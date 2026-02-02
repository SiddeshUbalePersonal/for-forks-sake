"use client";

import { useState, useCallback, useEffect } from "react";

export function useSoundEffects() {
    const [enabled, setEnabled] = useState(false);
    // AudioContext ref
    const [ctx, setCtx] = useState<AudioContext | null>(null);

    // Initialize AudioContext on first interaction or mount (browser policy requires interaction usually, 
    // but we can init lazily)
    useEffect(() => {
        // Check localStorage
        const saved = localStorage.getItem("ffs_sound_enabled");
        setEnabled(saved === "true");
    }, []);

    useEffect(() => {
        if (enabled && !ctx && typeof window !== 'undefined') {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            setCtx(audioCtx);
        } else if (!enabled && ctx) {
            ctx.close();
            setCtx(null);
        }
    }, [enabled, ctx]);

    const toggleMute = () => {
        const newState = !enabled;
        setEnabled(newState);
        localStorage.setItem("ffs_sound_enabled", String(newState));
    };

    const playTone = (freq: number, type: OscillatorType, duration: number, startTime = 0) => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

        gain.gain.setValueAtTime(0.1, ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + startTime);
        osc.stop(ctx.currentTime + startTime + duration);
    };

    const playCommit = useCallback(() => {
        if (!enabled || !ctx) return;
        // Mechanical "Thock" approximation: low sine + quick decay
        // Actually, let's make a "pop" sound
        playTone(600, 'sine', 0.1);
        playTone(300, 'square', 0.05);
    }, [enabled, ctx]);

    const playWin = useCallback(() => {
        if (!enabled || !ctx) return;
        // 8-bit arpeggio
        const now = 0;
        playTone(523.25, 'square', 0.1, now);       // C5
        playTone(659.25, 'square', 0.1, now + 0.1); // E5
        playTone(783.99, 'square', 0.2, now + 0.2); // G5
        playTone(1046.50, 'square', 0.4, now + 0.3); // C6
    }, [enabled, ctx]);

    const playError = useCallback(() => {
        if (!enabled || !ctx) return;
        // Low buzz
        playTone(150, 'sawtooth', 0.3);
        playTone(140, 'sawtooth', 0.3, 0.05);
    }, [enabled, ctx]);

    return { enabled, toggleMute, playCommit, playWin, playError };
}
