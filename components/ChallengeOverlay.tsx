"use client";

import { useGitStore } from "@/store/useGitStore";
import { challenges } from "@/data/challenges";
import { Trophy, AlertTriangle, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export function ChallengeOverlay() {
    const { gameMode, commits, head, branches, currentBranch, init } = useGitStore();
    const [status, setStatus] = useState<'incomplete' | 'solved'>('incomplete');
    const [challengeIndex, setChallengeIndex] = useState(0);
    const [isInitializing, setIsInitializing] = useState(true);

    const challenge = challenges[challengeIndex];

    const loadChallenge = (index: number) => {
        setIsInitializing(true);
        setStatus('incomplete'); // Reset status immediately
        setChallengeIndex(index);

        // Small timeout to ensure UI updates before freezing for setup or allows paint
        setTimeout(() => {
            challenges[index].setup(useGitStore.getState());
            setIsInitializing(false);
        }, 10);
    };

    const nextChallenge = () => {
        const next = (challengeIndex + 1) % challenges.length;
        loadChallenge(next);
    };

    const prevChallenge = () => {
        const prev = (challengeIndex - 1 + challenges.length) % challenges.length;
        loadChallenge(prev);
    };

    useEffect(() => {
        if (gameMode === 'challenge') {
            loadChallenge(0); // Load first challenge on enter
        }
    }, [gameMode]);

    useEffect(() => {
        if (!challenge || isInitializing) return;

        const state = useGitStore.getState();
        if (challenge.winCondition(state)) {
            setStatus('solved');
        } else {
            setStatus('incomplete');
        }
    }, [commits, head, branches, currentBranch, challenge, isInitializing]);

    if (gameMode !== 'challenge') return null;
    if (!challenge) return null;

    return (
        <div className="absolute top-4 right-4 z-40 w-80">
            <motion.div
                key={challenge.id}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className={`
                    border rounded-xl p-4 shadow-xl backdrop-blur-md
                    ${status === 'solved' ? 'bg-green-500/10 border-green-500/50' : 'bg-orange-500/10 border-orange-500/50'}
                `}
            >
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider opacity-60">
                                <button onClick={prevChallenge} className="hover:text-primary"><ChevronLeft size={14} /></button>
                                <span>{challengeIndex + 1} / {challenges.length}</span>
                                <button onClick={nextChallenge} className="hover:text-primary"><ChevronRight size={14} /></button>
                            </div>
                            <h3 className="font-bold text-lg flex items-center gap-2 leading-none mt-1">
                                {status === 'solved' ? <Trophy className="text-green-500 w-5 h-5" /> : <AlertTriangle className="text-orange-500 w-5 h-5" />}
                                {challenge.title}
                            </h3>
                        </div>
                    </div>

                    <div className="flex gap-1">
                        <button
                            onClick={() => loadChallenge(challengeIndex)}
                            className="p-1 hover:bg-background/20 rounded"
                            title="Reset Challenge"
                        >
                            <RefreshCw size={14} />
                        </button>
                    </div>
                </div>

                <p className="text-sm text-foreground/80 mb-4">
                    {challenge.description}
                </p>

                <div className="bg-background/50 p-3 rounded text-xs font-mono mb-2 border border-border/50">
                    <div className="font-bold mb-1 opacity-70">OBJECTIVE:</div>
                    {challenge.difficulty === 'Hard' ? "Advanced Git required." : "Fix the repo state."}
                </div>

                <div className={`
                    text-xs font-bold uppercase tracking-wider text-center py-1 rounded
                    ${status === 'solved' ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-500'}
                `}>
                    {status === 'solved' ? "CHALLENGE SOLVED" : "INCOMPLETE"}
                </div>
            </motion.div>
        </div>
    );
}
