import { GitState, useGitStore } from "@/store/useGitStore";

export interface Challenge {
    id: string;
    title: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    setup: (store: any) => void;
    winCondition: (state: GitState) => boolean;
}

export const challenges: Challenge[] = [
    {
        id: 'detached-head',
        title: 'The Detached Head',
        description: "You are comfortably working on 'main' when suddenly... you lost your ref! Can you save your commit?",
        difficulty: 'Medium',
        setup: (store) => { // store passed from UI is likely a snapshot, use fresh state
            const freshStore = useGitStore.getState();
            freshStore.init();

            // 1. Initial State
            freshStore.commit("Initial Commit");
            freshStore.commit("Stable work");

            // 2. Detach HEAD properly
            const commits = useGitStore.getState().commits; // Refetch after commits
            const root = commits.find((c: any) => c.message === "Initial commit")?.id || commits[0].id; // Fallback

            freshStore.checkout(root);

            // 3. Make a "Lost" commit in detached state
            freshStore.editFile('notes.txt', 'Important work here');
            freshStore.stageFile('notes.txt');
            freshStore.commit("My lost work");

            // No need to force state if checkout worked correctly, 
            // but let's verify if checkout(root) sets currentBranch to null.
            // It should if 'root' is an ID and not a branch name.
        },
        winCondition: (state: GitState) => {
            const headId = state.head;
            if (!headId) return false;

            // Win if:
            // 1. We are Attached (on a branch)
            // 2. This branch branch points to the recovered commit (or a descendant)
            // Simpler: Just check if HEAD is reachable from any Branch Ref?

            // Original goal: "Save your commit".
            // So if any branch points to HEAD (exact match), we are saved.
            // Check if we are NOT detached.
            if (state.currentBranch === null) return false;

            // Is the current branch pointing to HEAD?
            const branchHead = state.branches[state.currentBranch];
            return branchHead === headId;
        }
    },
    {
        id: 'rebase-feature',
        title: 'Rebase Feature',
        description: "Your feature branch is out of date. Main has moved on. Replay your work on top of the latest main to keep history clean.",
        difficulty: 'Hard',
        setup: (store) => {
            store.init();
            store.commit("Initial");

            store.createBranch('feature');
            store.checkout('feature');
            store.commit("Feature 1");
            store.commit("Feature 2");

            store.checkout('main');
            store.commit("Main Update 1");
            store.commit("Main Update 2");

            store.checkout('feature');
        },
        winCondition: (state: GitState) => {
            if (state.currentBranch !== 'feature') return false;

            const featureHead = state.branches['feature'];
            const mainHead = state.branches['main'];

            if (!featureHead || !mainHead) return false;

            // Check if mainHead is an ancestor of featureHead
            let curr: string | undefined = featureHead;
            let found = false;
            for (let i = 0; i < 15; i++) {
                if (curr === mainHead) {
                    found = true;
                    break;
                }
                const c = state.commits.find(x => x.id === curr);
                if (!c || c.parentIds.length === 0) break;
                // Walk first parent only (linear)
                curr = c.parentIds[0];
            }
            return found;
        }
    },
    {
        id: 'cherry-pick-hotfix',
        title: 'The Hotfix',
        description: "A critical bug was fixed in the 'feature' branch, but we can't merge the whole thing yet. Cherry-pick just the fix into 'main'.",
        difficulty: 'Hard',
        setup: (store) => {
            store.init();
            store.commit("Initial");

            store.createBranch('feature');
            store.checkout('feature');
            store.commit("Feature Work 1");

            store.editFile('bug.txt', 'FIXED');
            store.stageFile('bug.txt');
            store.commit("Fix critical bug");

            store.commit("Feature Work 2");

            store.checkout('main');
            store.editFile('app.js', 'console.log("main work")');
            store.stageFile('app.js');
            store.commit("Main work");
        },
        winCondition: (state: GitState) => {
            if (state.currentBranch !== 'main') return false;
            const hasFix = state.fileSystem['bug.txt'] === 'FIXED';
            return hasFix;
        }
    }
];
