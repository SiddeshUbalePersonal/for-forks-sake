import { GitState } from "@/store/useGitStore";

export interface Level {
    id: number;
    title: string;
    description: string;
    task: string;
    winCondition: (state: GitState) => boolean;
    hint: string;
    setup?: (store: any) => void;
}

export const levels: Level[] = [
    {
        id: 1,
        title: "The Git Workflow",
        description: "Git is a three-step process: Edit files, Stage them, and Commit to save.",
        task: "Create a new file (or edit one), stage it with 'git add', and then commit.",
        winCondition: (state: GitState) => state.commits.length >= 2, // 1st is root, 2nd is user's
        hint: "New File -> git add . -> git commit -m 'Initial'"
    },
    {
        id: 2,
        title: "Branching Out",
        description: "Main is getting crowded. Let's create a safe space for new features. Note: 'checkout -b' copies your current files to the new branch.",
        task: "Create a branch named 'feature' and switch to it.",
        winCondition: (state: GitState) => state.currentBranch === 'feature',
        hint: "Type: git checkout -b feature"
    },
    {
        id: 3,
        title: "Merge It Back",
        description: "Your feature works! Now bring those changes back into the main codebase.",
        task: "Create a commit on 'feature', then switch to 'main' and merge 'feature' into it.",
        winCondition: (state: GitState) => {
            // Condition:
            // 1. We are on main
            // 2. Head commit has at least 2 parents (merges have >1 parents in this model)
            if (state.currentBranch !== 'main') return false;

            const headCommit = state.commits.find(c => c.id === state.head);
            return (headCommit?.parentIds.length || 0) >= 2;
        },
        hint: "1. Edit & Commit on feature  2. git checkout main  3. git merge feature"
    },
    {
        id: 4,
        title: "The Merge Conflict (BOSS)",
        description: "You and your teammate edited the same file. Chaos ensues.",
        task: "Resolve the conflict in style.css and complete the merge.",
        setup: (store) => {
            // Hard reset to a clean slate
            store.init();

            // 1. Create content on Main
            const mainContent = "body { background: red; }";
            store.editFile('style.css', mainContent);
            store.stageFile('style.css');
            store.commit("Set background to red");

            // 2. Branch to feature
            store.createBranch('feature');

            // 3. Edit on Feature
            store.checkout('feature');
            store.editFile('style.css', "body { background: blue; }");
            store.stageFile('style.css');
            store.commit("Set background to blue");

            // 4. Back to Main, Edit differently (Conflict Prep)
            store.checkout('main');
            store.editFile('style.css', mainContent + "\n/* Main was here */");
            store.stageFile('style.css');
            store.commit("Update main style");

            // Ready for user to: git merge feature
        },
        winCondition: (state: GitState) => {
            // Win if:
            // 1. We have no conflicts
            // 2. The head commit is a merge (2 parents)
            // 3. We are on main
            if (state.conflictState) return false;
            if (state.currentBranch !== 'main') return false;

            const headCommit = state.commits.find(c => c.id === state.head);
            return (headCommit?.parentIds.length || 0) >= 2;
        },
        hint: "1. git merge feature  2. Click conflict file  3. Resolve & Save  4. git add .  5. git commit"
    }
];
