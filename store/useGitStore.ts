import { create } from 'zustand';

export interface Commit {
    id: string;
    parentIds: string[]; // Supports multiple parents (merges)
    message: string;
    branch: string;
    timestamp: number;
}

export interface GitState {
    commits: Commit[];
    head: string | null;
    branches: Record<string, string>; // branchName -> commitId
    currentBranch: string | null; // null represents Detached HEAD

    init: () => void;
    commit: (message: string) => void;
    checkout: (target: string) => void;
    createBranch: (name: string) => void;
    merge: (sourceBranch: string) => void;
    reset: (mode: '--hard' | '--soft', target: string) => void;
    getLog: () => Commit[];
}

const generateHash = () => Math.random().toString(36).substring(2, 9);

export const useGitStore = create<GitState>((set, get) => ({
    commits: [],
    head: null,
    branches: {},
    currentBranch: 'main',

    init: () => {
        const initialHash = generateHash();
        const initialCommit: Commit = {
            id: initialHash,
            parentIds: [],
            message: 'Initial commit',
            branch: 'main',
            timestamp: Date.now(),
        };

        set({
            commits: [initialCommit],
            branches: { main: initialHash },
            head: initialHash,
            currentBranch: 'main',
        });
    },

    commit: (message) => {
        const { head, currentBranch, commits, branches } = get();
        if (!head) return;

        const newHash = generateHash();
        // If detached HEAD (currentBranch is null), the new commit keeps the "detached" branch context
        // or arguably creates a new ephemeral branch. Visualizer usually treats it as separate.
        // For now, we'll inherit the commit's "visual" branch from the parent OR just say 'detached'.
        const parentCommit = commits.find(c => c.id === head);
        const visualBranch = currentBranch || (parentCommit ? parentCommit.branch : 'detached');

        const newCommit: Commit = {
            id: newHash,
            parentIds: [head],
            message,
            branch: visualBranch,
            timestamp: Date.now(),
        };

        const newBranches = { ...branches };
        if (currentBranch) {
            newBranches[currentBranch] = newHash;
        }

        set({
            commits: [...commits, newCommit],
            head: newHash,
            branches: newBranches,
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
        const { branches, commits } = get();

        // 1. Checkout Branch
        if (branches[target]) {
            set({ head: branches[target], currentBranch: target });
            return;
        }

        // 2. Checkout Commit (Detached HEAD)
        const commit = commits.find(c => c.id === target);
        if (commit) {
            set({ head: target, currentBranch: null }); // null = Detached HEAD state
        }
    },

    merge: (sourceBranch) => {
        const { head, branches, currentBranch, commits } = get();
        if (!currentBranch) {
            console.error("Cannot merge in detached HEAD state");
            return; // Logic restriction
        }

        const sourceCommitId = branches[sourceBranch];
        if (!sourceCommitId) return; // Branch doesn't exist

        // Prevent self-merge
        if (sourceCommitId === head) return;

        const newHash = generateHash();
        const newCommit: Commit = {
            id: newHash,
            parentIds: [head!, sourceCommitId],
            message: `Merge branch '${sourceBranch}' into ${currentBranch}`,
            branch: currentBranch,
            timestamp: Date.now(),
        };

        set({
            commits: [...commits, newCommit],
            head: newHash,
            branches: {
                ...branches,
                [currentBranch]: newHash
            }
        });
    },

    reset: (mode, target) => {
        const { branches, currentBranch, commits } = get();
        if (!currentBranch) return; // Cannot reset detached HEAD pointer easily in this model (it's just a checkout)

        // Resolve target (could be hash or branch name)
        let targetCommitId = branches[target] || target;

        // Verify target exists (Exact Match)
        let targetCommit = commits.find(c => c.id === targetCommitId);

        // Retry with Partial Match
        if (!targetCommit) {
            targetCommit = commits.find(c => c.id.startsWith(target));
            if (targetCommit) {
                targetCommitId = targetCommit.id;
            }
        }

        if (!targetCommit) return;

        const newBranches = { ...branches, [currentBranch]: targetCommitId };

        let newCommits = [...commits];
        if (mode === '--hard') {
            // Simplistic Garbage Collection:
            // Remove commits that are NO LONGER REACHABLE from any branch or HEAD.
            // This is a simplified "destroy future" logic.

            // Helper to find reachable commits
            const reachable = new Set<string>();
            const stack = Object.values(newBranches); // Start from all branch tips

            // Also include the NEW HEAD position
            stack.push(targetCommitId);

            while (stack.length > 0) {
                const currentId = stack.pop()!;
                if (reachable.has(currentId)) continue;
                reachable.add(currentId);

                const commitObj = commits.find(c => c.id === currentId);
                if (commitObj) {
                    commitObj.parentIds.forEach(p => stack.push(p));
                }
            }

            newCommits = commits.filter(c => reachable.has(c.id));
        }

        set({
            head: targetCommitId,
            branches: newBranches,
            commits: newCommits
        });
    },

    getLog: () => {
        const { head, commits } = get();
        if (!head) return [];

        const log: Commit[] = [];
        const stack = [head];
        const visited = new Set<string>();

        // BFS/DFS to get history? strict linear log usually follows first parent
        // But let's just return linear first-parent traversal for "git log" feel
        let currentId: string | undefined = head;
        while (currentId) {
            const c = commits.find(commit => commit.id === currentId);
            if (!c) break;
            log.push(c);
            currentId = c.parentIds[0]; // Follow main lineage
        }
        return log;
    }
}));
