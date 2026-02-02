"use client";

import { useGameLoop } from "@/hooks/useGameLoop";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { Trophy, ArrowRight, CheckCircle, RefreshCcw, GripHorizontal } from "lucide-react";

import { useEffect } from "react";

interface LevelOverlayProps {
    onLevelComplete?: () => void;
}

export function LevelOverlay({ onLevelComplete }: LevelOverlayProps) {
    const { currentLevel, isLevelComplete, isGameComplete, nextLevel, resetProgress } = useGameLoop();
    const dragControls = useDragControls();

    useEffect(() => {
        if (isLevelComplete || isGameComplete) {
            onLevelComplete?.();
        }
    }, [isLevelComplete, isGameComplete]);

    if (isGameComplete) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-6 right-6 z-50 w-80 bg-background/95 backdrop-blur border border-green-500/50 rounded-xl p-6 shadow-2xl"
            >
                <div className="flex flex-col items-center text-center gap-4">
                    <Trophy className="w-12 h-12 text-yellow-500" />
                    <h2 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                        Certificate of Git-ness
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        You have mastered the basics. You are now ready to break production.
                    </p>
                    <button
                        onClick={resetProgress}
                        className="flex items-center gap-2 bg-muted hover:bg-muted/80 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                        <RefreshCcw size={14} /> Restart Game
                    </button>
                </div>
            </motion.div>
        );
    }

    if (!currentLevel) return null;

    return (
        <motion.div
            className="absolute top-0 right-0 p-6 z-40 max-w-sm pointer-events-auto"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            drag
            dragListener={false}
            dragControls={dragControls}
            dragMomentum={false}
        >
            <div className="bg-background/90 backdrop-blur-md border border-border rounded-lg shadow-xl overflow-hidden relative">
                {/* Drag Handle */}
                <div
                    className="absolute top-0 right-0 p-2 cursor-grab active:cursor-grabbing hover:bg-accent/50 rounded-bl-lg z-50 transition-colors"
                    onPointerDown={(e) => dragControls.start(e)}
                >
                    <GripHorizontal className="w-4 h-4 text-muted-foreground/50" />
                </div>

                {/* Header */}
                <div className={`h-1.5 w-full ${isLevelComplete ? 'bg-green-500' : 'bg-primary'}`} />

                <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between pr-8">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                                    Level {currentLevel.id}
                                </span>
                                <button
                                    onClick={resetProgress}
                                    className="opacity-50 hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400"
                                    title="Reset Progress"
                                >
                                    <RefreshCcw size={10} />
                                </button>
                            </div>
                            <h3 className="font-bold text-lg leading-tight">{currentLevel.title}</h3>
                        </div>
                        {isLevelComplete && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring" }}
                            >
                                <CheckCircle className="text-green-500 w-6 h-6" />
                            </motion.div>
                        )}
                    </div>

                    <p className="text-sm text-muted-foreground select-text">
                        {currentLevel.description}
                    </p>

                    <div className="bg-muted/50 rounded-md p-3 border border-border/50 select-text">
                        <p className="text-xs font-medium text-foreground mb-1">Mission:</p>
                        <p className="text-sm font-mono text-primary/90">{currentLevel.task}</p>
                    </div>

                    {/* Hint */}
                    {!isLevelComplete && (
                        <div className="text-[10px] text-muted-foreground/60 italic select-text">
                            Hint: {currentLevel.hint}
                        </div>
                    )}

                    {/* Footer / Action */}
                    <AnimatePresence>
                        {isLevelComplete && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="pt-2"
                            >
                                <button
                                    onClick={nextLevel}
                                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md font-medium shadow-lg transition-all active:scale-95"
                                >
                                    Next Level <ArrowRight size={16} />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}
