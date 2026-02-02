"use client";

import { useState, useEffect } from "react";
import { useGitStore, GitState } from "@/store/useGitStore";
import { levels } from "@/data/levels";

export function useGameLoop() {
    // Initialize from storage or default to 0
    const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
    const [isLevelComplete, setIsLevelComplete] = useState(false);
    const [hasHydrated, setHasHydrated] = useState(false);

    const gitState = useGitStore();

    // Hydrate persistence
    useEffect(() => {
        const savedCallback = localStorage.getItem('ffs_level_index');
        if (savedCallback) {
            setCurrentLevelIndex(parseInt(savedCallback, 10));
        }
        setHasHydrated(true);
    }, []);

    // Save persistence
    useEffect(() => {
        if (hasHydrated) {
            localStorage.setItem('ffs_level_index', currentLevelIndex.toString());
        }
    }, [currentLevelIndex, hasHydrated]);

    // Check Win Condition
    useEffect(() => {
        if (!hasHydrated) return;
        if (isLevelComplete) return; // Already done

        const currentLevel = levels[currentLevelIndex];
        // If we ran out of levels, stop
        if (!currentLevel) return;

        if (currentLevel.winCondition(gitState)) {
            setIsLevelComplete(true);
        }
    }, [gitState, currentLevelIndex, hasHydrated, isLevelComplete]);

    const currentLevel = levels[currentLevelIndex];
    const isGameComplete = !currentLevel && currentLevelIndex >= levels.length;

    const nextLevel = () => {
        if (currentLevelIndex < levels.length) {
            setCurrentLevelIndex(prev => prev + 1);
            setIsLevelComplete(false);
        }
    };

    const resetProgress = () => {
        setCurrentLevelIndex(0);
        setIsLevelComplete(false);
        localStorage.setItem('ffs_level_index', '0');
        // Optionally reset git store too?
        // gitState.reset('--hard', 'root'); // Complex, let's just let user do it or refresh
        window.location.reload();
    };

    return {
        currentLevel,
        currentLevelIndex,
        isLevelComplete,
        isGameComplete,
        nextLevel,
        resetProgress
    };
}
