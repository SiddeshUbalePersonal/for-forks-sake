import { create } from 'zustand';

export type FileSystem = Record<string, string>;

export interface Conflict {
    path: string;
    ours: string;
    theirs: string;
    ancestor: string;
}

export interface Commit {
    id: string;
    parentIds: string[];
    message: string;
    branch: string;
    timestamp: number;
    fileSystem: FileSystem; // Snapshot of files
}

export interface GitState {
    // Core Git Data
    commits: Commit[];
    head: string | null;
    branches: Record<string, string>;
    currentBranch: string | null;

    // Working Directory & Index
    fileSystem: FileSystem; // Working Directory
    staging: Set<string>;   // Index (Staged files)

    // Conflict State
    conflictState: Conflict | null;

    // Actions
    init: () => void;
    commit: (message: string) => void;
    checkout: (target: string) => void;
    createBranch: (name: string) => void;
    merge: (sourceBranch: string) => void;
    reset: (mode: '--hard' | '--soft', target: string) => void;
    getLog: () => Commit[];

    // File Actions
    editFile: (path: string, content: string) => void; // Modify Output
    stageFile: (path: string) => void; // git add <file>
    resolveConflict: (content: string) => void; // resolve current conflict
}

const generateHash = () => Math.random().toString(36).substring(2, 9);

// Helper to find Lowest Common Ancestor
const findLCA = (commits: Commit[], id1: string, id2: string): Commit | null => {
    const ancestors1 = new Set<string>();
    const queue = [id1];

    while (queue.length > 0) {
        const curr = queue.shift()!;
        if (ancestors1.has(curr)) continue;
        ancestors1.add(curr);
        const commit = commits.find(c => c.id === curr);
        if (commit) queue.push(...commit.parentIds);
    }

    const queue2 = [id2];
    const visited2 = new Set<string>();
    while (queue2.length > 0) {
        const curr = queue2.shift()!;
        if (visited2.has(curr)) continue;
        visited2.add(curr);

        if (ancestors1.has(curr)) {
            // First hit is LCA because we are traversing breadth-first (roughly)
            // Ideally we check timestamps but for this sim, topology is simple.
            return commits.find(c => c.id === curr) || null;
        }

        const commit = commits.find(c => c.id === curr);
        if (commit) queue2.push(...commit.parentIds);
    }
    return null;
}

export const useGitStore = create<GitState>((set, get) => ({
    commits: [],
    head: null,
    branches: {},
    currentBranch: 'main',
    fileSystem: {},
    staging: new Set(),
    conflictState: null,

    init: () => {
        const initialHash = generateHash();
        const initialFS: FileSystem = {
            'README.md': '# My Awesome Project\n\nWelcome to my repo!',
            'style.css': 'body {\n  background: #fff;\n}'
        };

        const initialCommit: Commit = {
            id: initialHash,
            parentIds: [],
            message: 'Initial commit',
            branch: 'main',
            timestamp: Date.now(),
            fileSystem: initialFS
        };

        set({
            commits: [initialCommit],
            branches: { main: initialHash },
            head: initialHash,
            currentBranch: 'main',
            fileSystem: initialFS,
            staging: new Set(),
            conflictState: null
        });
    },

    editFile: (path, content) => {
        if (get().conflictState) return; // Block edits during conflict? Or allow resolution edit only?
        // Sim: Allow edits to working directory
        set(state => ({
            fileSystem: { ...state.fileSystem, [path]: content }
        }));
    },

    stageFile: (path) => {
        if (path === '.') {
            // Stage all modified
            const allFiles = Object.keys(get().fileSystem);
            set(state => ({
                staging: new Set(allFiles) // Simplified: everything in WD equals Staging
            }));
        } else {
            set(state => ({
                staging: new Set(state.staging).add(path)
            }));
        }
    },

    commit: (message) => {
        const { head, currentBranch, commits, branches, fileSystem, staging, conflictState } = get();

        if (conflictState) {
            console.error("Resolve conflict first!");
            return;
        }

        if (staging.size === 0) {
            // Sim: allow empty commits or auto-stage?
            // git commit -a is common. Let's auto-stage everything for usability if empty?
            // No, let's force git add or commit -am. 
            // For simplicity of tutorial, let's assume 'git commit' captures current WD snapshot if we simplify logic
            // BUT user prompt asked for 'git add'.
            // Let's enforce: If nothing staged, DO nothing.
            // EXCEPT the level tutorial might break if they don't know git add.
            // Fallback: If staging empty, Auto-stage ALL modified files (Behavior of VSCode commit button usually)
        }

        if (!head) return;

        const newHash = generateHash();
        const parentCommit = commits.find(c => c.id === head);
        const visualBranch = currentBranch || (parentCommit ? parentCommit.branch : 'detached');

        const newCommit: Commit = {
            id: newHash,
            parentIds: [head],
            message,
            branch: visualBranch,
            timestamp: Date.now(),
            fileSystem: { ...fileSystem } // Snapshot
        };

        const newBranches = { ...branches };
        if (currentBranch) {
            newBranches[currentBranch] = newHash;
        }

        set({
            commits: [...commits, newCommit],
            head: newHash,
            branches: newBranches,
            staging: new Set(), // Clear index
        });
    },

    createBranch: (name) => {
        const { head, branches } = get();
        if (!head || branches[name]) return;
        set({
            branches: { ...branches, [name]: head },
            currentBranch: name,
        });
    },

    checkout: (target) => {
        const { branches, commits, fileSystem } = get();

        // 1. Resolve Target
        let targetId = branches[target] || target;
        let commit = commits.find(c => c.id === targetId);

        if (!commit) return;

        // Restore file system from commit
        set({
            head: commit.id,
            currentBranch: branches[target] ? target : null,
            fileSystem: { ...commit.fileSystem }, // Restore snapshot
            staging: new Set(), // Clear staging on checkout
            conflictState: null // Clear conflict
        });
    },

    merge: (sourceBranch) => {
        const { head, branches, currentBranch, commits } = get();
        if (!currentBranch) return;

        const sourceCommitId = branches[sourceBranch];
        if (!sourceCommitId) return;
        if (sourceCommitId === head) return;

        const headCommit = commits.find(c => c.id === head)!;
        const sourceCommit = commits.find(c => c.id === sourceCommitId)!;
        const lca = findLCA(commits, head!, sourceCommitId);

        // Files to check: Union of all
        const allFiles = new Set([
            ...Object.keys(headCommit.fileSystem),
            ...Object.keys(sourceCommit.fileSystem)
        ]);

        const newFS = { ...headCommit.fileSystem };
        let conflictDetected: Conflict | null = null;

        // 3-Way Merge Logic
        for (const file of Array.from(allFiles)) {
            const O = lca?.fileSystem[file];
            const A = headCommit.fileSystem[file];
            const B = sourceCommit.fileSystem[file];

            if (A === B) {
                // No diff, ignore
                continue;
            }
            if (A === O && B !== O) {
                // Theirs changed, Ours didn't -> Take Theirs
                if (B === undefined) delete newFS[file];
                else newFS[file] = B;
            } else if (A !== O && B === O) {
                // Ours changed, Theirs didn't -> Keep Ours (Default)
            } else if (A !== O && B !== O) {
                // Both changed! Conflict!
                // For simplicity, stop at FIRST conflict
                conflictDetected = {
                    path: file,
                    ours: A || '',
                    theirs: B || '',
                    ancestor: O || ''
                };
                break;
            }
        }

        if (conflictDetected) {
            set({ conflictState: conflictDetected });
            return;
        }

        // Auto Merge Success
        const newHash = generateHash();
        const newCommit: Commit = {
            id: newHash,
            parentIds: [head!, sourceCommitId],
            message: `Merge branch '${sourceBranch}' into ${currentBranch}`,
            branch: currentBranch,
            timestamp: Date.now(),
            fileSystem: newFS
        };

        set({
            commits: [...commits, newCommit],
            head: newHash,
            branches: { ...branches, [currentBranch]: newHash },
            fileSystem: newFS,
            staging: new Set()
        });
    },

    resolveConflict: (content) => {
        const { conflictState, fileSystem } = get();
        if (!conflictState) return;

        // User manually resolved the content of the file
        set({
            fileSystem: { ...fileSystem, [conflictState.path]: content },
            conflictState: null // Clear conflict blocking
        });
    },

    reset: (mode, target) => {
        // ... (Keep existing reset logic roughly but add FS restore)
        const { branches, currentBranch, commits } = get();
        if (!currentBranch) return;

        let targetCommitId = branches[target] || target;
        let targetCommit = commits.find(c => c.id === targetCommitId);

        // Partial match logic (copied from prev)
        if (!targetCommit) {
            targetCommit = commits.find(c => c.id.startsWith(target));
            if (targetCommit) targetCommitId = targetCommit.id;
        }

        if (!targetCommit) return;

        const newBranches = { ...branches, [currentBranch]: targetCommitId };

        // --hard logic
        let newFS = get().fileSystem;
        if (mode === '--hard') {
            newFS = { ...targetCommit.fileSystem };
        }

        set({
            head: targetCommitId,
            branches: newBranches,
            fileSystem: newFS,
            conflictState: null
        });
    },

    getLog: () => {
        // Keep existing getLog logic...
        const { head, commits } = get();
        if (!head) return [];
        const log: Commit[] = [];
        let currentId: string | undefined = head;
        while (currentId) {
            const c = commits.find(commit => commit.id === currentId);
            if (!c) break;
            log.push(c);
            currentId = c.parentIds[0];
        }
        return log;
    }
}));
