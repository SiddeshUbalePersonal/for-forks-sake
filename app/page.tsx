"use client";

import { useEffect, useState } from "react";
import { useGitStore } from "@/store/useGitStore";
import { Moon, Sun, GitGraph as GitIcon, Volume2, VolumeX } from "lucide-react";
import { useTheme } from "next-themes";
import { Terminal } from "@/components/Terminal";
import { GitGraph } from "@/components/GitGraph";
import { AnimatePresence } from "framer-motion";
import { LevelOverlay } from "@/components/LevelOverlay";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { MainMenu } from "@/components/MainMenu";
import { FileExplorer } from "@/components/FileExplorer";
import { ChallengeOverlay } from "@/components/ChallengeOverlay";

export default function Home() {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme } = useTheme();
    const { enabled: soundEnabled, toggleMute, playCommit, playError, playWin } = useSoundEffects();

    const { init, head, gameMode } = useGitStore();

    useEffect(() => {
        setMounted(true);
        init();
    }, [init]);

    if (!mounted) return null;



    return (
        <main className="flex flex-col md:flex-row h-full w-full relative">
            {/* Main Menu Overlay */}
            <AnimatePresence>
                {gameMode === 'home' && (
                    <div className="absolute inset-0 z-[100]">
                        <MainMenu />
                    </div>
                )}
            </AnimatePresence>

            {/* Level Overlay (Tutorial Only) */}
            {gameMode === 'tutorial' && <LevelOverlay onLevelComplete={playWin} />}
            {gameMode === 'challenge' && <ChallengeOverlay />}

            {/* LEFT PANEL: Controls & Terminal */}

            <aside className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-border bg-muted/30 p-6 flex flex-col gap-6">
                <header className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tighter flex items-center gap-2">
                        <GitIcon className="w-6 h-6 text-primary" />
                        <span>For Fork's Sake</span>
                    </h1>
                    {/* Home Button */}
                    {gameMode !== 'home' && (
                        <button
                            onClick={() => useGitStore.getState().setGameMode('home')}
                            className="text-xs bg-muted border border-border px-2 py-1 rounded"
                        >
                            Menu
                        </button>
                    )}
                    <div className="flex gap-2">
                        <button
                            onClick={toggleMute}
                            className="p-2 rounded-md hover:bg-muted transition-colors opacity-70 hover:opacity-100"
                            title={soundEnabled ? "Mute Sounds" : "Enable Sounds"}
                        >
                            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                        </button>
                        <button
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="p-2 rounded-md hover:bg-muted transition-colors"
                            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        >
                            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-hidden flex flex-col gap-4">

                    <Terminal onSoundEffect={(type) => type === 'commit' ? playCommit() : playError()} />

                    {/* Integrated File Explorer */}
                    <div className="flex-1 min-h-0 border border-border rounded-lg overflow-hidden flex flex-col">
                        <FileExplorer />
                    </div>
                </div>
            </aside>

            {/* RIGHT PANEL: Visualization */}
            <section className="flex-1 bg-background relative overflow-hidden flex items-center justify-center p-0">
                {/* Head Label Overlay - positioned at top right */}
                <div className="absolute top-4 right-4 z-10 bg-muted/50 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-mono text-muted-foreground border border-border pointer-events-none">
                    HEAD: {head?.substring(0, 7)}
                    <span className="ml-2 opacity-50 uppercase tracking-widest text-[10px] border-l border-border pl-2">
                        {gameMode} MODE
                    </span>
                </div>

                <div className="w-full h-full">
                    {/* Removed max-width wrapper to allow full canvas */}
                    <GitGraph />
                </div>


            </section>
        </main>
    );
}
