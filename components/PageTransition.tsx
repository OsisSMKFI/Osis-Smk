'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
}

// Animated curtain opening effect - first load only
const CurtainOverlay: React.FC<{ isVisible: boolean }> = ({ isVisible }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="curtain-overlay"
          className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden"
        >
          <motion.div
            initial={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-yellow-400 via-amber-500 to-orange-500"
          />
          <motion.div
            initial={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-yellow-400 via-amber-500 to-orange-500"
          />
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="text-4xl drop-shadow-lg">⭐</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const pageVariants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const pathname = usePathname();
  const [showCurtain, setShowCurtain] = useState(true);
  const [mounted, setMounted] = useState(false);
  const isFirstMount = useRef(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Curtain on first load only
  useEffect(() => {
    if (!mounted) return;
    if (isFirstMount.current) {
      isFirstMount.current = false;
      const curtainTimer = setTimeout(() => setShowCurtain(false), 700);
      return () => clearTimeout(curtainTimer);
    }
  }, [mounted]);

  const isAdminPage = pathname?.startsWith('/admin');

  if (isAdminPage) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-screen" suppressHydrationWarning>
      <CurtainOverlay isVisible={showCurtain && mounted} />

      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          className={showCurtain ? 'opacity-0' : undefined}
          suppressHydrationWarning
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default PageTransition;
