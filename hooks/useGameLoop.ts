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
    const { gameMode } = gitState;

    // Hydrate persistence
    useEffect(() => {
        const savedCallback = localStorage.getItem('ffs_level_index');
        if (savedCallback) {
            setCurrentLevelIndex(parseInt(savedCallback, 10));
        }
        setHasHydrated(true);
    }, []);

    // Save persistence (Tutorial Only)
    useEffect(() => {
        if (hasHydrated && gameMode === 'tutorial') {
            localStorage.setItem('ffs_level_index', currentLevelIndex.toString());
        }
    }, [currentLevelIndex, hasHydrated, gameMode]);

    // Setup Effect
    useEffect(() => {
        if (!hasHydrated) return;

        if (gameMode === 'tutorial') {
            const level = levels[currentLevelIndex];
            if (level?.setup) {
                // IMPORTANT: Ensure store is clean before running level setup?
                // Level setup usually assumes we are adding to empty.
                // But init() from MainMenu clears it.
                level.setup(gitState);
            }
        }
    }, [currentLevelIndex, hasHydrated, gameMode]); // Run on mode switch or level change

    // Check Win Condition
    useEffect(() => {
        if (!hasHydrated) return;
        if (isLevelComplete) return;

        if (gameMode === 'tutorial') {
            const currentLevel = levels[currentLevelIndex];
            if (currentLevel && currentLevel.winCondition(gitState)) {
                setIsLevelComplete(true);
            }
        }
        // Challenge win condition would go here if we had active challenge state
    }, [gitState, currentLevelIndex, hasHydrated, isLevelComplete, gameMode]);

    // Return logic based on mode
    if (gameMode !== 'tutorial') {
        return {
            currentLevel: null,
            currentLevelIndex: 0,
            isLevelComplete: false,
            isGameComplete: false,
            nextLevel: () => { },
            resetProgress: () => { }
        };
    }

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
