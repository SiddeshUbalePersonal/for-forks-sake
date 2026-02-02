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

            // Auto-setup level if needed
            const level = levels[currentLevelIndex];
            if (level?.setup) {
                // We only run setup if it hasn't been run for this level session?
                // Or maybe simple hack: check if history is empty or something?
                // Better: Just run it. Reset the store for the level.
                // BUT this runs every render if in dependency array? 
                // We need a ref to track if we initialized this level index.
            }
        }
    }, [currentLevelIndex, hasHydrated]);

    // Better effect for setup
    useEffect(() => {
        if (hasHydrated) {
            const level = levels[currentLevelIndex];
            // Only run setup if we are "reset" or entering it fresh. 
            // Since we don't have complex session tracking, let's assume if the store is "empty" or default we run it.
            // Actually, for the Boss level, we WANT to force the scenario.
            // Let's us a simple flag in session storage or just trust user won't refresh spam.
            if (level?.setup) {
                // Check if we are already in the "Boss" state to avoid infinite reset loops?
                // No, easiest is to let the user reset if they mess up.
                // We will run setup ONCE per level index change.
                level.setup(gitState);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentLevelIndex, hasHydrated]); // Run once when level index changes

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
