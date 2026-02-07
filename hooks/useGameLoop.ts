"use client";

import { useState, useEffect, useRef } from "react";
import { useGitStore, GitState } from "@/store/useGitStore";
import { levels } from "@/data/levels";

export function useGameLoop() {
    // Initialize from storage or default to 0
    const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
    const [isLevelComplete, setIsLevelComplete] = useState(false);
    const [hasHydrated, setHasHydrated] = useState(false);
    // Track if setup just ran - prevents immediate win condition checking
    const [setupJustRan, setSetupJustRan] = useState(false);
    // Track the initial state hash after setup to detect user actions
    const initialStateHashRef = useRef<string | null>(null);

    const gitState = useGitStore();
    const { gameMode } = gitState;

    // Helper to create a simple hash of the relevant git state
    const getStateHash = (state: GitState): string => {
        return JSON.stringify({
            commits: state.commits.length,
            head: state.head,
            branches: state.branches,
            conflictState: state.conflictState,
            mergeHead: state.mergeHead,
            fileSystem: state.fileSystem
        });
    };

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
                // Mark that setup is running - block win condition checks
                setSetupJustRan(true);
                setIsLevelComplete(false);

                // IMPORTANT: Ensure store is clean before running level setup?
                // Level setup usually assumes we are adding to empty.
                // But init() from MainMenu clears it.
                level.setup(gitState);

                // After a tick, capture the initial state hash
                // Win conditions will only be checked after user makes a change
                setTimeout(() => {
                    initialStateHashRef.current = getStateHash(useGitStore.getState());
                    setSetupJustRan(false);
                }, 100);
            }
        }
    }, [currentLevelIndex, hasHydrated, gameMode]); // Run on mode switch or level change

    // Check Win Condition
    useEffect(() => {
        if (!hasHydrated) return;
        if (isLevelComplete) return;
        if (setupJustRan) return; // Don't check while setup is running

        if (gameMode === 'tutorial') {
            const currentLevel = levels[currentLevelIndex];
            if (!currentLevel) return;

            // For levels with setup, only check win condition if state has changed from initial
            if (currentLevel.setup && initialStateHashRef.current) {
                const currentHash = getStateHash(gitState);
                if (currentHash === initialStateHashRef.current) {
                    // State hasn't changed since setup - user hasn't done anything yet
                    return;
                }
            }

            if (currentLevel.winCondition(gitState)) {
                setIsLevelComplete(true);
            }
        }
        // Challenge win condition would go here if we had active challenge state
    }, [gitState, currentLevelIndex, hasHydrated, isLevelComplete, gameMode, setupJustRan]);

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
