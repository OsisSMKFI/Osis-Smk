'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingScreen from './LoadingScreen';

interface PageTransitionProps {
  children: React.ReactNode;
}

// Animated curtain opening effect - OPTIMIZED for performance
const CurtainOverlay: React.FC<{ isVisible: boolean }> = ({ isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="curtain-overlay"
          className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden"
        >
          {/* Top curtain */}
          <motion.div
            initial={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-yellow-400 via-amber-500 to-orange-500"
          />
          
          {/* Bottom curtain */}
          <motion.div
            initial={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-yellow-400 via-amber-500 to-orange-500"
          />
          
          {/* Center logo - simplified */}
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="text-4xl drop-shadow-lg">⭐</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Page content animation variants - OPTIMIZED
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const pathname = usePathname();
  const [showCurtain, setShowCurtain] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [displayChildren, setDisplayChildren] = useState(children);
  const [mounted, setMounted] = useState(false);
  const isFirstMount = useRef(true);

  // Ensure client-side only rendering
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Handle curtain animation on first load
  useEffect(() => {
    if (!mounted) return;
    
    if (isFirstMount.current) {
      isFirstMount.current = false;
      // Hide curtain after animation
      const curtainTimer = setTimeout(() => {
        setShowCurtain(false);
      }, 900);
      
      return () => clearTimeout(curtainTimer);
    }
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    
    // Skip loading screen on first mount (curtain handles it)
    if (isFirstMount.current) return;
    
    setIsLoading(true);
    setProgress(0);
    
    // OPTIMIZED: Faster loading - reduced delays significantly  
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 50; // Faster progress
      });
    }, 30); // Faster interval

    // OPTIMIZED: Minimal loading time for instant navigation
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setProgress(100);
      
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
        clearInterval(progressInterval);
      }, 50); // Reduced from 100ms
    }, 100); // Reduced from 300ms for faster navigation

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [pathname, children, mounted]);
  
  // Skip animations for admin pages
  const isAdminPage = pathname?.startsWith('/admin');
  
  if (isAdminPage) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-screen" suppressHydrationWarning>
      {/* Curtain opening animation (first load only) */}
      <CurtainOverlay isVisible={showCurtain && mounted} />
      
      {/* Loading screen for navigation */}
      <LoadingScreen 
        isVisible={isLoading && !showCurtain} 
        progress={progress}
        message="Memuat halaman"
      />

      {/* Page Content with animation - OPTIMIZED */}
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className={`${
            (isLoading || showCurtain)
              ? 'opacity-0' 
              : 'opacity-100'
          }`}
          suppressHydrationWarning
        >
          {displayChildren}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default PageTransition;