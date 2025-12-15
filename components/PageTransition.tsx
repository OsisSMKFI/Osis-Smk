'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingScreen from './LoadingScreen';

interface PageTransitionProps {
  children: React.ReactNode;
}

// Animated curtain opening effect
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
            transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
            className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-yellow-400 via-amber-500 to-orange-500"
          >
            {/* Decorative elements */}
            <motion.div
              initial={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `radial-gradient(circle at 30% 80%, rgba(255,255,255,0.3) 0%, transparent 50%),
                                 radial-gradient(circle at 70% 60%, rgba(255,255,255,0.2) 0%, transparent 40%)`,
              }}
            />
          </motion.div>
          
          {/* Bottom curtain */}
          <motion.div
            initial={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.7, ease: [0.65, 0, 0.35, 1] }}
            className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-yellow-400 via-amber-500 to-orange-500"
          >
            {/* Decorative elements */}
            <motion.div
              initial={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `radial-gradient(circle at 70% 20%, rgba(255,255,255,0.3) 0%, transparent 50%),
                                 radial-gradient(circle at 30% 40%, rgba(255,255,255,0.2) 0%, transparent 40%)`,
              }}
            />
          </motion.div>
          
          {/* Center logo animation */}
          <motion.div
            initial={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="relative">
              {/* Outer ring */}
              <motion.div
                initial={{ rotate: 0, scale: 1 }}
                animate={{ rotate: 360 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ 
                  rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 0.3 },
                  opacity: { duration: 0.3 }
                }}
                className="w-24 h-24 rounded-full border-4 border-transparent border-t-white/90 border-r-white/70 border-b-white/50"
              />
              
              {/* Inner ring (counter-rotate) */}
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: -360 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ 
                  rotate: { duration: 1.5, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 0.3 },
                  opacity: { duration: 0.3 }
                }}
                className="absolute inset-3 rounded-full border-2 border-transparent border-t-white/60 border-l-white/40"
              />
              
              {/* Center icon with pulse */}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <span className="text-4xl drop-shadow-lg">⭐</span>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Page content animation variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 30,
    filter: 'blur(10px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    filter: 'blur(5px)',
    transition: {
      duration: 0.3,
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
    
    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 20;
      });
    }, 50);

    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setProgress(100);
      
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
        clearInterval(progressInterval);
      }, 200);
    }, 600);

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

      {/* Page Content with animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className={`transition-all duration-700 ease-in-out ${
            (isLoading || showCurtain)
              ? 'opacity-0 transform translate-y-8 scale-95' 
              : 'opacity-100 transform translate-y-0 scale-100'
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