import { GitState } from "@/store/useGitStore";

export interface Level {
    id: number;
    title: string;
    description: string;
    task: string;
    winCondition: (state: GitState) => boolean;
    hint: string;
}

export const levels: Level[] = [
    {
        id: 1,
        title: "The First Commit",
        description: "Welcome to For Fork's Sake! Let's get started by creating a repository history.",
        task: "Create a new commit with the message 'Initial'.",
        winCondition: (state: GitState) => state.commits.length >= 2, // 1st is root, 2nd is user's
        hint: "Type: git commit -m 'Initial'"
    },
    {
        id: 2,
        title: "Branching Out",
        description: "Main is getting crowded. Let's create a safe space for new features.",
        task: "Create a branch named 'feature' and switch to it.",
        winCondition: (state: GitState) => state.currentBranch === 'feature',
        hint: "Type: git checkout -b feature"
    },
    {
        id: 3,
        title: "Merge It Back",
        description: "Your feature works! Now bring those changes back into the main codebase.",
        task: "Make sure you have commits on 'feature', then switch to 'main' and merge 'feature' into it.",
        winCondition: (state: GitState) => {
            // Condition:
            // 1. We are on main
            // 2. Head commit has at least 2 parents (merges have >1 parents in this model)
            if (state.currentBranch !== 'main') return false;

            const headCommit = state.commits.find(c => c.id === state.head);
            return (headCommit?.parentIds.length || 0) >= 2;
        },
        hint: "1. git checkout main  2. git merge feature"
    }
];
