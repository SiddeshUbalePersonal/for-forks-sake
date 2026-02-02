"use client";

import { useGitStore } from "@/store/useGitStore";
import { Book, Swords, Box, Wrench } from "lucide-react";
import { motion } from "framer-motion";

export function MainMenu() {
    const { setGameMode, init } = useGitStore();

    const handleModeSelect = (mode: 'tutorial' | 'challenge' | 'sandbox') => {
        // Enforce hard reset on mode switch to prevent state pollution
        if (mode === 'sandbox' || mode === 'tutorial') {
            init(); // Reset to clean initial state
        }
        // Note: 'challenge' mode resets itself via ChallengeOverlay on mount

        setGameMode(mode);
    };

    return (
        <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur flex items-center justify-center p-8">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-3 gap-6"
            >
                <div className="col-span-1 md:col-span-3 text-center mb-8">
                    <h1 className="text-4xl font-black mb-2 tracking-tighter">FOR FORK'S SAKE</h1>
                    <p className="text-muted-foreground">Master Git visually. Choose your destiny.</p>
                </div>

                {/* Tutorial Card */}
                <div
                    onClick={() => handleModeSelect('tutorial')}
                    className="group relative p-6 border border-border rounded-xl bg-card hover:bg-accent/50 cursor-pointer transition-all hover:scale-105"
                >
                    <Book className="mb-4 text-blue-500" size={32} />
                    <h3 className="text-xl font-bold mb-2">The Basics</h3>
                    <p className="text-sm text-muted-foreground">Learn the fundamentals. Commits, Branches, Merges.</p>
                    <div className="mt-4 text-xs font-mono opacity-50">Levels 1-4</div>
                </div>

                {/* Challenge Card */}
                <div
                    onClick={() => handleModeSelect('challenge')}
                    className="group relative p-6 border border-border rounded-xl bg-card hover:bg-accent/50 cursor-pointer transition-all hover:scale-105"
                >
                    <Swords className="mb-4 text-red-500" size={32} />
                    <h3 className="text-xl font-bold mb-2">Advanced Ops</h3>
                    <p className="text-sm text-muted-foreground">Expert challenges. Fix broken repos, detach heads, and rebase.</p>
                    <div className="mt-4 text-xs font-mono opacity-50">Hard Mode</div>
                </div>

                {/* Debug Card (Placeholder) */}
                <div className="group relative p-6 border border-border rounded-xl bg-card opacity-50 cursor-not-allowed">
                    <Wrench className="mb-4 text-purple-500" size={32} />
                    <h3 className="text-xl font-bold mb-2">Fix It</h3>
                    <p className="text-sm text-muted-foreground">Real-world scenarios. Coming Soon.</p>
                </div>

                {/* Sandbox Button - Large */}
                <div
                    onClick={() => handleModeSelect('sandbox')}
                    className="col-span-1 md:col-span-3 p-8 border-2 border-dashed border-primary/30 rounded-xl bg-primary/5 hover:bg-primary/10 cursor-pointer flex items-center gap-6 transition-all hover:border-primary"
                >
                    <div className="p-4 bg-primary/20 rounded-full">
                        <Box size={40} className="text-primary" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold">The Playground</h3>
                        <p className="text-muted-foreground">No rules. No guides. Just a blank repo and a terminal.</p>
                    </div>
                    <div className="ml-auto font-mono text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                        SANDBOX
                    </div>
                </div>

            </motion.div>
        </div>
    );
}
