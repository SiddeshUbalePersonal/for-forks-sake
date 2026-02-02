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
    mergeHead: string | null;
    mergingBranch: string | null;

    // Actions
    init: () => void;
    commit: (message: string) => void;
    checkout: (target: string) => void;
    createBranch: (name: string) => void;
    merge: (sourceBranch: string) => void;
    rebase: (targetBranch: string) => void;
    cherryPick: (hash: string) => void;
    reset: (mode: '--hard' | '--soft', target: string) => void;
    getLog: () => Commit[];

    // File Actions
    editFile: (path: string, content: string) => void; // Modify Output
    stageFile: (path: string) => void; // git add <file>
    resolveConflict: (content: string) => void; // resolve current conflict

    // Game Mode
    gameMode: 'home' | 'tutorial' | 'challenge' | 'sandbox';
    setGameMode: (mode: 'home' | 'tutorial' | 'challenge' | 'sandbox') => void;
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

// Helper to calculate 3-way merge FS
const calculate3WayMerge = (baseFS: FileSystem, theirsFS: FileSystem, ancestorFS: FileSystem | undefined): { newFS: FileSystem, conflict: Conflict | null } => {
    const allFiles = new Set([
        ...Object.keys(baseFS),
        ...Object.keys(theirsFS)
    ]);

    const newFS = { ...baseFS };
    let conflict: Conflict | null = null;

    for (const file of Array.from(allFiles)) {
        const O = ancestorFS ? ancestorFS[file] : undefined;
        const A = baseFS[file];
        const B = theirsFS[file];

        if (A === B) continue;

        if (A === O && B !== O) {
            // Theirs changed, Ours didn't -> Take Theirs
            if (B === undefined) delete newFS[file];
            else newFS[file] = B;
        } else if (A !== O && B === O) {
            // Ours changed, Theirs didn't -> Keep Ours
        } else if (A !== O && B !== O) {
            // Conflict
            conflict = {
                path: file,
                ours: A || '',
                theirs: B || '',
                ancestor: O || ''
            };
            break; // Stop at first conflict
        }
    }
    return { newFS, conflict };
};

export const useGitStore = create<GitState>((set, get) => ({
    commits: [],
    // ... (rest of default state)

    head: null,
    branches: {},
    currentBranch: 'main',
    fileSystem: {},
    staging: new Set(),
    conflictState: null,
    mergeHead: null,
    mergingBranch: null,
    gameMode: 'home',

    setGameMode: (mode) => {
        set({ gameMode: mode });
        // Sim Persist
        localStorage.setItem('ffs_game_mode', mode);
    },

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
            conflictState: null,
            mergeHead: null,
            mergingBranch: null
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
        const { head, currentBranch, commits, branches, fileSystem, staging, conflictState, mergeHead, mergingBranch } = get();

        if (conflictState) {
            console.error("Resolve conflict first!");
            return;
        }

        if (staging.size === 0) {
            // ... (keep logic empty for now)
        }

        if (!head) return;

        const newHash = generateHash();

        // Parent Logic: Normal = [head], Merge = [head, mergeHead]
        const parentIds = [head];
        if (mergeHead) {
            parentIds.push(mergeHead);
        }

        const parentCommit = commits.find(c => c.id === head);
        const visualBranch = currentBranch || (parentCommit ? parentCommit.branch : 'detached');

        const newCommit: Commit = {
            id: newHash,
            parentIds: parentIds,
            // Auto message if mergeHead exists and message is empty (from parser fix later)
            message: message || (mergeHead ? `Merge branch '${mergingBranch || 'unknown'}'` : 'Update'),
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
            mergeHead: null,     // Clear merge state
            mergingBranch: null
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

        const { newFS, conflict } = calculate3WayMerge(headCommit.fileSystem, sourceCommit.fileSystem, lca?.fileSystem);

        if (conflict) {
            set({
                conflictState: conflict,
                mergeHead: sourceCommitId,
                mergingBranch: sourceBranch
            });
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

    rebase: (targetBranch) => {
        const { head, branches, currentBranch, commits } = get();
        if (!currentBranch || !head) return;

        const targetCommitId = branches[targetBranch];
        if (!targetCommitId) return;
        if (targetCommitId === head) return; // Already there

        const lca = findLCA(commits, head, targetCommitId);
        if (!lca) return; // Should not happen in connected graph

        if (lca.id === head) {
            // Fast-forward not really possible in rebase semantics usually? 
            // If we are ancestor of target, rebase just moves us to target?
            // "Current branch is up to date" or "Fast forward" logic.
            // Let's do nothing or just move pointer if linear?
            // Rebase X onto Y where X is ancestor of Y -> X becomes Y.
            // Implementation: Reset to target.
            const targetCommit = commits.find(c => c.id === targetCommitId)!;
            set({
                head: targetCommitId,
                branches: { ...branches, [currentBranch]: targetCommitId },
                fileSystem: targetCommit.fileSystem
            });
            return;
        }

        if (lca.id === targetCommitId) {
            // Target is ancestor of Head. Rebase does nothing?
            // "Current branch is up to date"
            return;
        }

        // 1. Identify commits to replay (from LCA+1 to Head)
        const commitsToReplay: Commit[] = [];
        let curr: string | undefined = head;
        while (curr && curr !== lca.id) {
            const c = commits.find(x => x.id === curr);
            if (!c) break;
            commitsToReplay.unshift(c); // Add to front to process oldest first
            curr = c.parentIds[0]; // Assume linear history for simplify
        }

        // 2. Hard Reset to Target
        let newHeadId = targetCommitId;
        let newFS = commits.find(c => c.id === targetCommitId)!.fileSystem;
        const newCommits = [...commits];

        // 3. Replay
        for (const commit of commitsToReplay) {
            const ancestorFS = commits.find(c => c.id === commit.parentIds[0])?.fileSystem;
            const result = calculate3WayMerge(newFS, commit.fileSystem, ancestorFS);

            // Note: If conflict, we crash or ignore? 
            // For simplicity in this game: IGNORE CONFLICT (take ours/base?) or just force it.
            // Let's take result.newFS regardless.
            // If conflict exists, it might leave file undefined or broken?
            // Sim: Just assume safe for now.

            const replayHash = generateHash();
            const replayCommit: Commit = {
                id: replayHash,
                parentIds: [newHeadId],
                message: commit.message,
                branch: currentBranch,
                timestamp: Date.now(),
                fileSystem: result.newFS
            };

            newCommits.push(replayCommit);
            newHeadId = replayHash;
            newFS = result.newFS;
        }

        set({
            commits: newCommits,
            head: newHeadId,
            branches: { ...branches, [currentBranch]: newHeadId },
            fileSystem: newFS,
            staging: new Set(),
            conflictState: null
        });
    },

    cherryPick: (hash) => {
        const { head, branches, currentBranch, commits } = get();
        if (!currentBranch || !head) return;

        // 1. Resolve Target Commit
        // Support partial hash
        let targetCommit = commits.find(c => c.id === hash || c.id.startsWith(hash));
        if (!targetCommit) return;

        // 2. Calculate Diff (Target vs Parent) -> Apply to Current
        // Cherry-pick logic: Take changes introduced by Target and apply to Head.
        // This is effectively a 3-Way Merge where:
        // Base = Target's Parent
        // Theirs = Target
        // Ours = Head

        if (targetCommit.parentIds.length === 0) {
            // Root commit? 
            return;
        }

        const parentCommit = commits.find(c => c.id === targetCommit.parentIds[0]);
        const headCommit = commits.find(c => c.id === head)!;

        // Uses 3-Way Merge helper
        const baseFS = parentCommit ? parentCommit.fileSystem : {};
        const theirsFS = targetCommit.fileSystem;
        const oursFS = headCommit.fileSystem;

        // Re-use helper logic but mapped differently:
        // calculate3WayMerge expects (base, theirs, ancestor)
        // Here: 
        // Ancestor = TargetParent (The common base for the patch)
        // Base = Head (Where we apply)
        // Theirs = Target (The changes)

        const { newFS, conflict } = calculate3WayMerge(oursFS, theirsFS, baseFS);

        if (conflict) {
            set({
                conflictState: conflict,
                // cherry-pick doesn't strict merge state in this simple sim, just conflict mode
                mergeHead: null,
                mergingBranch: null
            });
            return;
        }

        const newHash = generateHash();
        const newCommit: Commit = {
            id: newHash,
            parentIds: [head], // One parent, linear
            message: targetCommit.message, // Copy message
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
