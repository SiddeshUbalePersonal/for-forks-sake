"use client";

import { useState, useRef, useEffect } from "react";
import { useGitStore } from "@/store/useGitStore";
import { parseCommand } from "@/utils/commandParser";

interface TerminalProps {
    onSoundEffect?: (type: 'commit' | 'error') => void;
}

const generateHash = () => Math.random().toString(36).substring(2, 9);

export function Terminal({ onSoundEffect }: TerminalProps) {
    const { currentBranch, commit, createBranch, checkout, merge, reset, branches, getLog, staging, stageFile } = useGitStore();
    const [history, setHistory] = useState<string[]>([]);
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history]);

    const handleCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            const command = input.trim();
            const newHistory = [...history, `➜  git:( ${currentBranch || 'DETACHED'} ) ${command}`];

            const result = parseCommand(command);

            switch (result.type) {
                case 'ADD':
                    stageFile(result.payload.path);
                    newHistory.push(""); // Silent success usually
                    break;

                case 'STATUS':
                    // Real git status is complex. Simplified:
                    // 1. Changes to be committed (Staged)
                    // 2. Changes not staged (Modified)
                    // 3. Untracked
                    let output = "On branch " + (currentBranch || 'DETACHED') + "\n";

                    const stagedFiles = Array.from(staging);

                    // Unstaged logic: Check fileSystem vs HEAD
                    const headCommit = useGitStore.getState().commits.find(c => c.id === useGitStore.getState().head);
                    const headFS = headCommit ? headCommit.fileSystem : {};
                    const currentFS = useGitStore.getState().fileSystem;

                    const unstagedFiles: string[] = [];
                    Object.keys(currentFS).forEach(file => {
                        if (!staging.has(file)) {
                            // If content modified or file is new vs HEAD
                            if (currentFS[file] !== headFS[file]) {
                                unstagedFiles.push(file);
                            }
                        }
                    });

                    if (stagedFiles.length > 0) {
                        output += "Changes to be committed:\n  (use \"git reset HEAD <file>...\" to unstage)\n";
                        stagedFiles.forEach(f => output += `\tmodified:   ${f}\n`);
                    }

                    if (unstagedFiles.length > 0) {
                        output += "Changes not staged for commit:\n  (use \"git add <file>...\" to update what will be committed)\n";
                        unstagedFiles.forEach(f => output += `\tmodified:   ${f}\n`);
                    }

                    if (stagedFiles.length === 0 && unstagedFiles.length === 0) {
                        output += "nothing to commit, working tree clean\n";
                    }
                    newHistory.push(output);
                    break;

                case 'DIFF':
                    // Show diff of unstaged changes? 
                    // We don't have a diff engine text-wise.
                    newHistory.push("Diff feature requires 'diff' engine. Please check File Explorer for changes.");
                    break;

                case 'COMMIT':
                    if (staging.size === 0) {
                        // Check for unstaged changes to give better hint
                        const headC = useGitStore.getState().commits.find(c => c.id === useGitStore.getState().head);
                        const hFS = headC ? headC.fileSystem : {};
                        const cFS = useGitStore.getState().fileSystem;
                        const hasUnstaged = Object.keys(cFS).some(f => cFS[f] !== hFS[f]);

                        if (hasUnstaged) {
                            newHistory.push("Changes not staged for commit");
                            newHistory.push("  (use \"git add\" and/or \"git commit -a\")");
                        } else {
                            newHistory.push("nothing to commit, working tree clean");
                        }
                        onSoundEffect?.('error');
                    } else {
                        // If result.payload.message is null, it might be a 'git commit' merge flow
                        // We rely on store.commit implementation to provide default if needed or fail.
                        // But we want to fail here if NOT merging and NO message.
                        const { mergeHead } = useGitStore.getState();

                        if (!result.payload.message && !mergeHead) {
                            newHistory.push("Aborting commit due to empty commit message.");
                            onSoundEffect?.('error');
                        } else {
                            commit(result.payload.message || ""); // empty string might trigger default or we let store handle
                            // Actually store.commit is updated to handle empty string if mergeHead is set.
                            // If commit succeeds, store updates.
                            // We can assume success for Sim.
                            const msg = result.payload.message || (mergeHead ? "Merge commit" : "Update");
                            newHistory.push(`[${currentBranch || 'detached'} ${generateHash().substring(0, 7)}] ${msg}`);
                            onSoundEffect?.('commit');
                        }
                    }
                    break;

                case 'CREATE_BRANCH':
                    if (branches[result.payload.name]) {
                        newHistory.push(`fatal: A branch named '${result.payload.name}' already exists.`);
                        onSoundEffect?.('error');
                    } else {
                        createBranch(result.payload.name);
                        newHistory.push(`Switched to a new branch '${result.payload.name}'`);
                    }
                    break;

                case 'CHECKOUT':
                    // Check if it's a branch or hash (simple check, store handles strict check)
                    const target = result.payload.target;
                    if (branches[target]) {
                        checkout(target);
                        newHistory.push(`Switched to branch '${target}'`);
                    } else {
                        // Assume commit hash try
                        checkout(target);
                        newHistory.push(`Checking out '${target}'...`);
                        // Ideally we check if successful in store, but for sim:
                        newHistory.push(`Note: switching to '${target}'. Detached HEAD state.`);
                        if (!branches[target] && target.length > 7) onSoundEffect?.('error'); // quick hack to guess if checkout failed? 
                        // Actually useGitStore logic doesn't return success/fail easily without refactor. 
                        // Assuming checkout parser passed, we trust it mostly or rely on store to not explode.
                        // Imprecise but acceptable for prototype.
                    }
                    break;

                case 'MERGE':
                    const source = result.payload.source;
                    if (!branches[source]) {
                        newHistory.push(`fatal: '${source}' does not appear to be a valid branch.`);
                    } else {
                        merge(source);
                        newHistory.push(`Merge made by the 'ort' strategy.`);
                    }
                    break;

                case 'REBASE':
                    // Need to check if branch exists? Parser does not check valid branch.
                    // useGitStore check?
                    const { rebase, cherryPick } = useGitStore.getState(); // Fetch latest
                    rebase(result.payload.target);
                    newHistory.push(`Rebasing and updating refs/heads/${currentBranch}`);
                    break;

                case 'CHERRY_PICK':
                    const { cherryPick: doCherryPick } = useGitStore.getState();
                    doCherryPick(result.payload.hash);
                    newHistory.push(`[${currentBranch} ${generateHash().substring(0, 7)}] Cherry-picking commit...`);
                    break;

                case 'RESET':
                    reset(result.payload.mode, result.payload.target);
                    newHistory.push(`HEAD is now at ${result.payload.target}`);
                    break;

                case 'BRANCH':
                    const branchList = Object.keys(branches).map(b =>
                        b === currentBranch ? `* ${b}` : `  ${b}`
                    ).join("\n");
                    newHistory.push(branchList);
                    break;

                case 'LOG':
                    const log = getLog();
                    const logStr = log.map(c => `commit ${c.id}\nAuthor: You <you@dev>\nDate:   ${new Date(c.timestamp).toLocaleTimeString()}\n\n    ${c.message}`).join("\n\n");
                    newHistory.push(logStr);
                    break;

                case 'CLEAR':
                    setHistory([]);
                    setInput("");
                    return; // skip parsing history update

                case 'ERROR':
                    newHistory.push(result.error || "Error");
                    onSoundEffect?.('error');
                    break;

                case 'UNKNOWN':
                    newHistory.push(result.error || "Unknown command");
                    onSoundEffect?.('error');
                    break;
            }

            setHistory(newHistory);
            setInput("");
        }
    };

    return (
        <div
            className="border border-border rounded-lg bg-black/90 p-4 font-mono text-sm h-64 overflow-y-auto shadow-inner flex flex-col"
            ref={scrollRef}
            onClick={() => document.getElementById("terminal-input")?.focus()}
        >
            <div className="opacity-50 mb-2">Welcome to Git v2.4... just kidding.</div>

            {history.map((line, i) => (
                <div key={i} className="whitespace-pre-wrap mb-1 text-muted-foreground">{line}</div>
            ))}

            <div className="flex gap-2 items-center">
                <div className="flex shrink-0">
                    <span className="text-blue-400">➜</span>
                    <span className="text-yellow-400 ml-2">~/project</span>
                    <span className="text-gray-400 ml-2">git:(</span>
                    <span className="text-red-400">{currentBranch || 'DETACHED'}</span>
                    <span className="text-gray-400">)</span>
                </div>
                <input
                    id="terminal-input"
                    className="bg-transparent border-none outline-none text-foreground flex-1 w-full min-w-[50px]"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleCommand}
                    autoComplete="off"
                    autoFocus
                />
            </div>
        </div>
    );
}
