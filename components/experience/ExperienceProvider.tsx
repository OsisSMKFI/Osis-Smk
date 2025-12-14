'use client';

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SoundManagerProvider, SoundToggle } from '../sound/SoundManager';

// Lazy load heavy 3D components
const WebGLIntro = lazy(() => import('../3d/WebGLIntro'));
const CustomCursor = lazy(() => import('../cursor/CustomCursor'));
const ThreeDBackground = lazy(() => import('../3d/ThreeDBackground'));

interface ExperienceProviderProps {
  children: React.ReactNode;
  showIntro?: boolean;
  show3DBackground?: boolean;
  showCustomCursor?: boolean;
  backgroundVariant?: 'particles' | 'wireframe' | 'shapes' | 'grid' | 'full';
}

export default function ExperienceProvider({
  children,
  showIntro = true,
  show3DBackground = true,
  showCustomCursor = true,
  backgroundVariant = 'particles',
}: ExperienceProviderProps) {
  const [introComplete, setIntroComplete] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [hasSeenIntro, setHasSeenIntro] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // Check if user has seen intro in this session
    const seenIntro = sessionStorage.getItem('seenIntro');
    if (seenIntro === 'true') {
      setHasSeenIntro(true);
      setIntroComplete(true);
    }

    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    // Check if mobile
    setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);

    // Listen for changes
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleIntroComplete = () => {
    setIntroComplete(true);
    sessionStorage.setItem('seenIntro', 'true');
  };

  // Skip effects for reduced motion or mobile
  const shouldShowEffects = !prefersReducedMotion && !isMobile;
  const shouldShowIntro = showIntro && !hasSeenIntro && shouldShowEffects;
  const shouldShow3D = show3DBackground && shouldShowEffects && introComplete;
  const shouldShowCursor = showCustomCursor && shouldShowEffects && !isMobile;

  if (!isClient) {
    return <>{children}</>;
  }

  return (
    <SoundManagerProvider>
      {/* WebGL Intro */}
      <AnimatePresence>
        {shouldShowIntro && !introComplete && (
          <Suspense fallback={
            <div className="fixed inset-0 z-[9999] bg-slate-900 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
            </div>
          }>
            <WebGLIntro onComplete={handleIntroComplete} minDuration={3500} />
          </Suspense>
        )}
      </AnimatePresence>

      {/* 3D Background */}
      {shouldShow3D && (
        <Suspense fallback={null}>
          <ThreeDBackground variant={backgroundVariant} opacity={0.5} />
        </Suspense>
      )}

      {/* Custom Cursor */}
      {shouldShowCursor && (
        <Suspense fallback={null}>
          <CustomCursor enabled={true} />
        </Suspense>
      )}

      {/* Main content with page transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key="main-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: introComplete ? 1 : 0 }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {/* Sound toggle (fixed position) */}
      {introComplete && (
        <motion.div
          className="fixed bottom-4 right-4 z-50"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <SoundToggle />
        </motion.div>
      )}
    </SoundManagerProvider>
  );
}

// Page transition wrapper for individual pages
export function PageTransitionWrapper({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string 
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ 
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    >
      {children}
    </motion.div>
  );
}

// Scroll-triggered animation wrapper
export function ScrollReveal({ 
  children, 
  className = '',
  delay = 0,
  direction = 'up'
}: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right'
}) {
  const initialPosition = {
    up: { opacity: 0, y: 50 },
    down: { opacity: 0, y: -50 },
    left: { opacity: 0, x: 50 },
    right: { opacity: 0, x: -50 },
  };

  return (
    <motion.div
      className={className}
      initial={initialPosition[direction]}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ 
        duration: 0.6,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    >
      {children}
    </motion.div>
  );
}
