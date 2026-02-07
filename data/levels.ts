import { GitState, useGitStore, Commit } from "@/store/useGitStore";

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
        description: "Two developers edited the same line. Now you must choose whose code survives.",
        task: "Run 'git merge feature' to trigger the conflict, then resolve it in style.css.",
        setup: () => {
            // === PHASE 1: Complete Reset ===
            // Use a minimal initial commit with ONLY the file we care about
            const generateHash = () => Math.random().toString(36).substring(2, 9);

            const baseContent = "body { background: white; }";
            const baseHash = generateHash();
            const baseCommit: Commit = {
                id: baseHash,
                parentIds: [],
                message: "Initial commit",
                branch: "main",
                timestamp: Date.now(),
                fileSystem: { "style.css": baseContent }
            };

            // === PHASE 2: Create Feature Branch Commit (BLUE) ===
            const featureHash = generateHash();
            const featureContent = "body { background: BLUE; }";
            const featureCommit: Commit = {
                id: featureHash,
                parentIds: [baseHash],
                message: "Change background to BLUE",
                branch: "feature",
                timestamp: Date.now() + 1,
                fileSystem: { "style.css": featureContent }
            };

            // === PHASE 3: Create Main Branch Commit (RED) ===
            const mainContent = "body { background: RED; }";
            const mainHash = generateHash();
            const mainCommit: Commit = {
                id: mainHash,
                parentIds: [baseHash],
                message: "Change background to RED",
                branch: "main",
                timestamp: Date.now() + 2,
                fileSystem: { "style.css": mainContent }
            };

            // === SET STATE ATOMICALLY ===
            // Use Zustand's setState for proper reactivity
            useGitStore.setState({
                commits: [baseCommit, featureCommit, mainCommit],
                branches: { main: mainHash, feature: featureHash },
                head: mainHash,
                currentBranch: "main",
                fileSystem: { "style.css": mainContent },
                staging: new Set<string>(),
                conflictState: null,
                mergeHead: null,
                mergingBranch: null
            });

            // === READY ===
            // Graph structure:
            //     base (white)
            //      /       \
            //   feature    main
            //   (BLUE)     (RED)
            //
            // When user runs: git merge feature
            // LCA = base, Ours = main (RED), Theirs = feature (BLUE)
            // Both differ from ancestor = GUARANTEED CONFLICT
        },
        winCondition: (state: GitState) => {
            // Win conditions:
            // 1. No active conflict state
            // 2. On main branch
            // 3. HEAD commit has 2 parents (is a merge commit)
            // 4. style.css content does NOT contain conflict markers

            if (state.conflictState) return false;
            if (state.currentBranch !== 'main') return false;
            if (state.mergeHead) return false; // Still in merge state

            const headCommit = state.commits.find(c => c.id === state.head);
            if (!headCommit || headCommit.parentIds.length < 2) return false;

            // Check that resolved file doesn't contain conflict markers
            const styleContent = state.fileSystem["style.css"] || "";
            if (styleContent.includes("<<<<") ||
                styleContent.includes("====") ||
                styleContent.includes(">>>>")) {
                return false;
            }

            return true;
        },
        hint: "1. git merge feature  2. Click the conflicted file  3. Edit to resolve  4. git add .  5. git commit"
    }
];
