'use client';

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Fallback component for failed lazy loads
const NullComponent = () => <></>;

// Lazy load components with error handling
const WebGLIntro = lazy(() => 
  import('../3d/WebGLIntro').catch(() => ({ default: NullComponent }))
);
const CustomCursor = lazy(() => 
  import('../cursor/CustomCursor').catch(() => ({ default: NullComponent }))
);
const ThreeDBackground = lazy(() => 
  import('../3d/ThreeDBackground').catch(() => ({ default: NullComponent }))
);
const SoundManagerProvider = lazy(() => 
  import('../sound/SoundManager').then(m => ({ default: m.SoundManagerProvider })).catch(() => ({ 
    default: ({ children }: { children: React.ReactNode }) => <>{children}</> 
  }))
);

interface ExperienceProviderProps {
  children: React.ReactNode;
  showIntro?: boolean;
  showCustomCursor?: boolean;
  showBackground?: boolean;
}

export default function ExperienceProvider({
  children,
  showIntro = true,
  showCustomCursor = true,
  showBackground = true,
}: ExperienceProviderProps) {
  const [introComplete, setIntroComplete] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [hasSeenIntro, setHasSeenIntro] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [webglSupported, setWebglSupported] = useState(true);
  const [introError, setIntroError] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // Check WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      setWebglSupported(!!gl);
    } catch {
      setWebglSupported(false);
    }

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

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);

    // Auto-complete intro after timeout (failsafe)
    const failsafeTimeout = setTimeout(() => {
      if (!introComplete) {
        console.warn('[ExperienceProvider] Failsafe: auto-completing intro');
        setIntroComplete(true);
        sessionStorage.setItem('seenIntro', 'true');
      }
    }, 8000); // 8 seconds max

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      clearTimeout(failsafeTimeout);
    };
  }, [introComplete]);

  const handleIntroComplete = () => {
    setIntroComplete(true);
    sessionStorage.setItem('seenIntro', 'true');
  };

  const handleIntroError = () => {
    console.error('[ExperienceProvider] Intro error, skipping');
    setIntroError(true);
    setIntroComplete(true);
    sessionStorage.setItem('seenIntro', 'true');
  };

  // Skip effects for reduced motion, mobile, or no WebGL
  const shouldShowEffects = !prefersReducedMotion && !isMobile && webglSupported && !introError;
  const shouldShowIntro = showIntro && !hasSeenIntro && shouldShowEffects && !introComplete;
  const shouldShowCursor = showCustomCursor && !isMobile && isClient;
  const shouldShowBackground = showBackground && shouldShowEffects && isClient && introComplete;

  return (
    <Suspense fallback={<>{children}</>}>
      <SoundManagerProvider>
        {/* 3D Background - renders behind everything */}
        {shouldShowBackground && (
          <Suspense fallback={null}>
            <ThreeDBackground opacity={0.3} />
          </Suspense>
        )}

        {/* Children are ALWAYS rendered - never block content */}
        <div 
          className={shouldShowIntro ? 'opacity-0' : 'opacity-100'}
          style={{ 
            transition: 'opacity 0.5s ease-out',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {children}
        </div>

        {/* Intro overlay - renders on top, doesn't block children */}
        <AnimatePresence>
          {isClient && shouldShowIntro && (
            <motion.div
              className="fixed inset-0 z-[9999]"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Suspense fallback={
                <div className="fixed inset-0 z-[9999] bg-slate-900 flex items-center justify-center">
                  <div className="text-center">
                    <img src="/images/logo-2.png" alt="Logo" className="w-16 h-16 mx-auto mb-4 animate-pulse" />
                    <p className="text-yellow-400">Loading...</p>
                  </div>
                </div>
              }>
                <ErrorBoundary onError={handleIntroError}>
                  <WebGLIntro onComplete={handleIntroComplete} minDuration={3500} />
                </ErrorBoundary>
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Custom Cursor - desktop only */}
        {shouldShowCursor && (
          <Suspense fallback={null}>
            <CustomCursor enabled={true} />
          </Suspense>
        )}
      </SoundManagerProvider>
    </Suspense>
  );
}

// Simple Error Boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, info);
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}
