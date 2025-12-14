'use client';

import React, { useEffect, useRef, useState } from 'react';

interface SmoothScrollProviderProps {
  children: React.ReactNode;
}

export default function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Skip Lenis on mobile devices to prevent scroll issues
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      setIsReady(true);
      return;
    }

    // Dynamically import Lenis to prevent SSR issues
    let lenis: any = null;
    let rafId: number | null = null;

    const initLenis = async () => {
      try {
        const LenisModule = await import('lenis');
        const Lenis = LenisModule.default;
        
        lenis = new Lenis({
          duration: 1.0,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          orientation: 'vertical',
          gestureOrientation: 'vertical',
          smoothWheel: true,
          wheelMultiplier: 0.8,
          touchMultiplier: 1.5,
        });

        function raf(time: number) {
          lenis?.raf(time);
          rafId = requestAnimationFrame(raf);
        }

        rafId = requestAnimationFrame(raf);
        setIsReady(true);
      } catch (error) {
        console.warn('Lenis failed to load, using native scroll');
        setIsReady(true);
      }
    };

    initLenis();

    // Cleanup
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      lenis?.destroy();
    };
  }, []);

  return <div className="smooth-scroll-container">{children}</div>;
}
