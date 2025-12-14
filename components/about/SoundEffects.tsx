'use client';

import React, { useEffect, useRef, useState, createContext, useContext } from 'react';

interface SoundContextType {
  isMuted: boolean;
  toggleMute: () => void;
  playHover: () => void;
  playClick: () => void;
  playWhoosh: () => void;
  playAmbient: () => void;
  stopAmbient: () => void;
}

const SoundContext = createContext<SoundContextType | null>(null);

export function useSoundEffects() {
  const context = useContext(SoundContext);
  if (!context) {
    // Return dummy functions if not in provider
    return {
      isMuted: true,
      toggleMute: () => {},
      playHover: () => {},
      playClick: () => {},
      playWhoosh: () => {},
      playAmbient: () => {},
      stopAmbient: () => {},
    };
  }
  return context;
}

interface SoundProviderProps {
  children: React.ReactNode;
}

// Generate sounds using Web Audio API (no external files needed)
function createOscillatorSound(
  audioContext: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.1
) {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  
  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

function createHoverSound(audioContext: AudioContext) {
  // Soft high-pitched click
  createOscillatorSound(audioContext, 800, 0.05, 'sine', 0.05);
  setTimeout(() => {
    createOscillatorSound(audioContext, 1200, 0.03, 'sine', 0.03);
  }, 20);
}

function createClickSound(audioContext: AudioContext) {
  // Short punchy click
  createOscillatorSound(audioContext, 400, 0.08, 'triangle', 0.1);
  setTimeout(() => {
    createOscillatorSound(audioContext, 600, 0.05, 'sine', 0.08);
  }, 30);
}

function createWhooshSound(audioContext: AudioContext) {
  // Whoosh/sweep effect
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  
  oscillator.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.type = 'sawtooth';
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(200, audioContext.currentTime);
  filter.frequency.exponentialRampToValueAtTime(2000, audioContext.currentTime + 0.15);
  filter.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);
  
  oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.15);
  oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.3);
  
  gainNode.gain.setValueAtTime(0.03, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
}

export function SoundProvider({ children }: SoundProviderProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const ambientOscillator = useRef<OscillatorNode | null>(null);
  const ambientGain = useRef<GainNode | null>(null);

  useEffect(() => {
    // Initialize AudioContext on user interaction
    const initAudio = () => {
      if (!audioContext) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(ctx);
      }
    };

    // Listen for first user interaction
    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('touchstart', initAudio, { once: true });

    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('touchstart', initAudio);
    };
  }, [audioContext]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      stopAmbient();
    }
  };

  const playHover = () => {
    if (isMuted || !audioContext) return;
    createHoverSound(audioContext);
  };

  const playClick = () => {
    if (isMuted || !audioContext) return;
    createClickSound(audioContext);
  };

  const playWhoosh = () => {
    if (isMuted || !audioContext) return;
    createWhooshSound(audioContext);
  };

  const playAmbient = () => {
    if (isMuted || !audioContext) return;
    
    // Create ambient drone
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    oscillator1.connect(filter);
    oscillator2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator1.type = 'sine';
    oscillator1.frequency.setValueAtTime(60, audioContext.currentTime);
    
    oscillator2.type = 'sine';
    oscillator2.frequency.setValueAtTime(90, audioContext.currentTime);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0.02, audioContext.currentTime);
    
    oscillator1.start();
    oscillator2.start();
    
    ambientOscillator.current = oscillator1;
    ambientGain.current = gainNode;
  };

  const stopAmbient = () => {
    if (ambientOscillator.current) {
      ambientOscillator.current.stop();
      ambientOscillator.current = null;
    }
    if (ambientGain.current) {
      ambientGain.current = null;
    }
  };

  return (
    <SoundContext.Provider value={{
      isMuted,
      toggleMute,
      playHover,
      playClick,
      playWhoosh,
      playAmbient,
      stopAmbient,
    }}>
      {children}
    </SoundContext.Provider>
  );
}

// Sound Toggle Button Component
export function SoundToggle() {
  const { isMuted, toggleMute, playClick } = useSoundEffects();

  const handleClick = () => {
    playClick();
    toggleMute();
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 left-6 z-50 w-12 h-12 rounded-full bg-gray-800/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-gray-700/80 transition-all duration-300 group"
      aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
    >
      {isMuted ? (
        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
        </svg>
      ) : (
        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
      )}
      
      {/* Ripple effect when unmuted */}
      {!isMuted && (
        <>
          <span className="absolute w-full h-full rounded-full border border-yellow-400/50 animate-ping" />
          <span className="absolute w-[120%] h-[120%] rounded-full border border-yellow-400/30 animate-pulse" />
        </>
      )}
    </button>
  );
}

// Hook for adding hover sounds to elements
export function useHoverSound() {
  const { playHover } = useSoundEffects();
  
  return {
    onMouseEnter: playHover,
  };
}

// Hook for adding click sounds to elements
export function useClickSound() {
  const { playClick } = useSoundEffects();
  
  return {
    onClick: (e: React.MouseEvent) => {
      playClick();
    },
  };
}
