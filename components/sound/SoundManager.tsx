'use client';

import React, { createContext, useContext, useRef, useEffect, useState, useCallback } from 'react';

interface Sound {
  id: string;
  audio: HTMLAudioElement;
  volume: number;
}

interface SoundManagerContextType {
  playSound: (id: string) => void;
  stopSound: (id: string) => void;
  setVolume: (id: string, volume: number) => void;
  setMasterVolume: (volume: number) => void;
  toggleMute: () => void;
  isMuted: boolean;
  masterVolume: number;
  isReady: boolean;
}

const SoundManagerContext = createContext<SoundManagerContextType | null>(null);

// Sound definitions
const SOUNDS = {
  hover: '/sounds/hover.mp3',
  click: '/sounds/click.mp3',
  success: '/sounds/success.mp3',
  transition: '/sounds/transition.mp3',
  ambient: '/sounds/ambient.mp3',
  whoosh: '/sounds/whoosh.mp3',
};

export function SoundManagerProvider({ children }: { children: React.ReactNode }) {
  const sounds = useRef<Map<string, Sound>>(new Map());
  const [isMuted, setIsMuted] = useState(false);
  const [masterVolume, setMasterVolumeState] = useState(0.5);
  const [isReady, setIsReady] = useState(false);

  // Initialize sounds
  useEffect(() => {
    // Check if sounds are disabled
    const savedMuted = localStorage.getItem('soundMuted');
    const savedVolume = localStorage.getItem('soundVolume');
    
    if (savedMuted === 'true') setIsMuted(true);
    if (savedVolume) setMasterVolumeState(parseFloat(savedVolume));

    // Preload sounds
    Object.entries(SOUNDS).forEach(([id, path]) => {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = path;
      audio.volume = masterVolume;
      
      sounds.current.set(id, {
        id,
        audio,
        volume: 1,
      });
    });

    setIsReady(true);

    return () => {
      sounds.current.forEach(sound => {
        sound.audio.pause();
        sound.audio.src = '';
      });
      sounds.current.clear();
    };
  }, []);

  const playSound = useCallback((id: string) => {
    if (isMuted) return;
    
    const sound = sounds.current.get(id);
    if (sound) {
      sound.audio.currentTime = 0;
      sound.audio.volume = sound.volume * masterVolume;
      sound.audio.play().catch(() => {
        // Ignore autoplay errors
      });
    }
  }, [isMuted, masterVolume]);

  const stopSound = useCallback((id: string) => {
    const sound = sounds.current.get(id);
    if (sound) {
      sound.audio.pause();
      sound.audio.currentTime = 0;
    }
  }, []);

  const setVolume = useCallback((id: string, volume: number) => {
    const sound = sounds.current.get(id);
    if (sound) {
      sound.volume = Math.max(0, Math.min(1, volume));
      sound.audio.volume = sound.volume * masterVolume;
    }
  }, [masterVolume]);

  const setMasterVolume = useCallback((volume: number) => {
    const newVolume = Math.max(0, Math.min(1, volume));
    setMasterVolumeState(newVolume);
    localStorage.setItem('soundVolume', String(newVolume));
    
    // Update all sound volumes
    sounds.current.forEach(sound => {
      sound.audio.volume = sound.volume * newVolume;
    });
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev;
      localStorage.setItem('soundMuted', String(newMuted));
      
      if (newMuted) {
        // Stop all sounds when muting
        sounds.current.forEach(sound => {
          sound.audio.pause();
        });
      }
      
      return newMuted;
    });
  }, []);

  return (
    <SoundManagerContext.Provider value={{
      playSound,
      stopSound,
      setVolume,
      setMasterVolume,
      toggleMute,
      isMuted,
      masterVolume,
      isReady,
    }}>
      {children}
    </SoundManagerContext.Provider>
  );
}

export function useSoundManager() {
  const context = useContext(SoundManagerContext);
  if (!context) {
    // Return a no-op version if not in provider
    return {
      playSound: () => {},
      stopSound: () => {},
      setVolume: () => {},
      setMasterVolume: () => {},
      toggleMute: () => {},
      isMuted: true,
      masterVolume: 0,
      isReady: false,
    };
  }
  return context;
}

// Sound toggle button component
export function SoundToggle({ className = '' }: { className?: string }) {
  const { isMuted, toggleMute, masterVolume, setMasterVolume } = useSoundManager();
  const [showSlider, setShowSlider] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={toggleMute}
        onMouseEnter={() => setShowSlider(true)}
        className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300"
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? (
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5.889 16H2a1 1 0 01-1-1V9a1 1 0 011-1h3.889l5.294-4.332a.5.5 0 01.817.387v15.89a.5.5 0 01-.817.387L5.89 16zm13.517 4.134l-1.416-1.416A8.978 8.978 0 0021 12a8.982 8.982 0 00-3.536-7.146l1.415-1.415A10.969 10.969 0 0123 12c0 3.223-1.386 6.122-3.594 8.134zm-3.543-3.543l-1.422-1.422A3.993 3.993 0 0016 12c0-1.43-.75-2.685-1.879-3.393l1.414-1.414A5.99 5.99 0 0118 12a5.99 5.99 0 01-2.137 4.591zM3 16H1a1 1 0 01-1-1V9a1 1 0 011-1h2V6.414L4.707 4.707l1.586 1.586L3 9.586V16z"/>
          </svg>
        ) : (
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5.889 16H2a1 1 0 01-1-1V9a1 1 0 011-1h3.889l5.294-4.332a.5.5 0 01.817.387v15.89a.5.5 0 01-.817.387L5.89 16zm14.525-4l3.536 3.536-1.414 1.414L19 13.414l-3.536 3.536-1.414-1.414L17.586 12 14.05 8.464l1.414-1.414L19 10.586l3.536-3.536 1.414 1.414L20.414 12z"/>
          </svg>
        )}
      </button>

      {/* Volume slider */}
      {showSlider && !isMuted && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-slate-800 rounded-lg shadow-xl"
          onMouseLeave={() => setShowSlider(false)}
        >
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={masterVolume}
            onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
            className="w-24 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-yellow-500"
          />
        </div>
      )}
    </div>
  );
}

// Hook for adding sound effects to interactions
export function useSoundEffect() {
  const { playSound } = useSoundManager();

  return {
    onHover: () => playSound('hover'),
    onClick: () => playSound('click'),
    onSuccess: () => playSound('success'),
    onTransition: () => playSound('transition'),
    onWhoosh: () => playSound('whoosh'),
  };
}
