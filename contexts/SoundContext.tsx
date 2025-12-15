'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

interface SoundContextType {
  soundEnabled: boolean;
  toggleSound: () => void;
  playClickSound: () => void;
  playHoverSound: () => void;
  playSuccessSound: () => void;
  playErrorSound: () => void;
  playNotificationSound: () => void;
}

const SoundContext = createContext<SoundContextType>({
  soundEnabled: false,
  toggleSound: () => {},
  playClickSound: () => {},
  playHoverSound: () => {},
  playSuccessSound: () => {},
  playErrorSound: () => {},
  playNotificationSound: () => {},
});

export const useSoundEffects = () => useContext(SoundContext);

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize audio context on first interaction
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current && typeof window !== 'undefined') {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        // Resume if suspended (autoplay policy)
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }
      } catch {
        console.warn('Audio context not available');
      }
    }
    return audioContextRef.current;
  }, []);

  // Load saved sound preference
  useEffect(() => {
    if (!mounted) return;
    try {
      const saved = localStorage.getItem('soundEnabled');
      if (saved === 'true') {
        setSoundEnabled(true);
      }
    } catch {}
  }, [mounted]);

  // Save sound preference
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem('soundEnabled', String(soundEnabled));
    } catch {}
  }, [soundEnabled, mounted]);

  // Click sound - subtle soft pop
  const playClickSound = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = initAudioContext();
    if (!ctx) return;

    try {
      if (ctx.state === 'suspended') ctx.resume();
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(600, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
    } catch {}
  }, [soundEnabled, initAudioContext]);

  // Hover sound - soft tick
  const playHoverSound = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = initAudioContext();
    if (!ctx) return;

    try {
      if (ctx.state === 'suspended') ctx.resume();
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1000, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);

      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.05);
    } catch {}
  }, [soundEnabled, initAudioContext]);

  // Success sound - ascending arpeggio
  const playSuccessSound = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = initAudioContext();
    if (!ctx) return;

    try {
      if (ctx.state === 'suspended') ctx.resume();
      
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.2);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.2);
      });
    } catch {}
  }, [soundEnabled, initAudioContext]);

  // Error sound - descending minor
  const playErrorSound = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = initAudioContext();
    if (!ctx) return;

    try {
      if (ctx.state === 'suspended') ctx.resume();
      
      const notes = [440, 349.23]; // A4, F4
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.2);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.2);
      });
    } catch {}
  }, [soundEnabled, initAudioContext]);

  // Notification sound - gentle bell
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = initAudioContext();
    if (!ctx) return;

    try {
      if (ctx.state === 'suspended') ctx.resume();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  }, [soundEnabled, initAudioContext]);

  // Toggle sound with enable jingle
  const toggleSound = useCallback(() => {
    // Initialize AudioContext on toggle (user interaction)
    const ctx = initAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    
    setSoundEnabled(prev => {
      const newVal = !prev;
      if (newVal && ctx) {
        // Play enable sound after short delay
        setTimeout(() => {
          try {
            if (ctx.state === 'suspended') ctx.resume();
            const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
            notes.forEach((freq, i) => {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.type = 'sine';
              osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
              gain.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.1);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.2);
              osc.start(ctx.currentTime + i * 0.1);
              osc.stop(ctx.currentTime + i * 0.1 + 0.2);
            });
          } catch {}
        }, 50);
      }
      return newVal;
    });
  }, [initAudioContext]);

  return (
    <SoundContext.Provider
      value={{
        soundEnabled,
        toggleSound,
        playClickSound,
        playHoverSound,
        playSuccessSound,
        playErrorSound,
        playNotificationSound,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
}

export default SoundContext;
