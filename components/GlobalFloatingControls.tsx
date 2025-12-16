'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowUp, FaVolumeUp, FaVolumeMute, FaComments } from 'react-icons/fa';
import { useSoundEffects } from '@/contexts/SoundContext';

// Version marker for deployment tracking
const COMPONENT_VERSION = 'v0.1.7';
const isDev = process.env.NODE_ENV !== 'production';

interface GlobalFloatingControlsProps {
  showChat?: boolean;
}

export default function GlobalFloatingControls({ showChat = true }: GlobalFloatingControlsProps) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const { soundEnabled, toggleSound, playClickSound, playHoverSound } = useSoundEffects();

  useEffect(() => {
    setMounted(true);
    setPortalRoot(document.body);
  }, []);

  // Scroll listener for scroll-to-top button - more robust detection
  useEffect(() => {
    if (!mounted) return;
    
    let rafId: number;
    let lastScrollY = 0;
    
    const updateScrollState = () => {
      const scrollY = Math.max(
        window.scrollY || 0,
        window.pageYOffset || 0,
        document.documentElement.scrollTop || 0,
        document.body.scrollTop || 0
      );
      
      if (scrollY !== lastScrollY) {
        lastScrollY = scrollY;
        setShowScrollTop(scrollY > 200);
      }
      
      rafId = requestAnimationFrame(updateScrollState);
    };

    // Start polling scroll position
    rafId = requestAnimationFrame(updateScrollState);
    
    // Also listen to scroll events as backup
    const handleScroll = () => {
      const scrollY = Math.max(
        window.scrollY || 0,
        window.pageYOffset || 0,
        document.documentElement.scrollTop || 0,
        document.body.scrollTop || 0
      );
      setShowScrollTop(scrollY > 200);
    };

    // Initial check
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll, { capture: true } as EventListenerOptions);
    };
  }, [mounted]);

  const scrollToTop = useCallback((e: React.MouseEvent) => {
    // Prevent any default behavior
    e.preventDefault();
    e.stopPropagation();
    
    console.log(`[ScrollToTop] Button clicked - ${COMPONENT_VERSION}`);
    
    // Play sound first (wrapped in try-catch to not block scroll)
    try {
      playClickSound();
    } catch (err) {
      console.warn('Sound play failed:', err);
    }
    
    // Multiple scroll methods for maximum compatibility
    const doScroll = () => {
      console.log('[ScrollToTop] Executing scroll...');
      
      // Method 1: scrollTo with options
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        console.log('[ScrollToTop] Method 1: scrollTo with options');
      } catch {
        // Method 2: scrollTo without options
        window.scrollTo(0, 0);
        console.log('[ScrollToTop] Method 2: scrollTo fallback');
      }
      
      // Method 3: Direct element scroll
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
        console.log('[ScrollToTop] Method 3: documentElement');
      }
      if (document.body) {
        document.body.scrollTop = 0;
        console.log('[ScrollToTop] Method 3: body');
      }
      
      // Method 4: scrollIntoView on top element
      const topElement = document.getElementById('top') || document.body.firstElementChild;
      if (topElement && typeof topElement.scrollIntoView === 'function') {
        topElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        console.log('[ScrollToTop] Method 4: scrollIntoView');
      }
    };
    
    // Execute immediately and also with requestAnimationFrame
    doScroll();
    requestAnimationFrame(doScroll);
    
    // Also try with setTimeout as ultimate fallback
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      console.log('[ScrollToTop] Timeout fallback executed');
    }, 100);
  }, [playClickSound]);

  const openChat = useCallback(() => {
    playClickSound();
    window.dispatchEvent(new CustomEvent('open-live-chat'));
  }, [playClickSound]);

  const handleToggleSound = useCallback(() => {
    try {
      toggleSound();
    } catch (e) {
      console.warn('Toggle sound failed:', e);
    }
  }, [toggleSound]);

  if (!mounted || !portalRoot) return null;

  const floatingControls = (
    <div 
      id="global-floating-controls"
      style={{ 
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        alignItems: 'flex-end',
        pointerEvents: 'auto'
      }}
    >
      {/* Scroll to Top Button */}
      <AnimatePresence mode="wait">
        {showScrollTop && (
          <motion.button
            key="scroll-top-btn"
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            transition={{ duration: 0.2 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            onMouseEnter={playHoverSound}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'linear-gradient(to right, #facc15, #f59e0b)',
              color: '#111827',
              boxShadow: '0 10px 15px -3px rgba(234, 179, 8, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: 'none',
              outline: 'none'
            }}
            aria-label="Scroll to top"
            title="Scroll ke atas"
            type="button"
          >
            <FaArrowUp style={{ fontSize: '18px' }} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Sound Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleToggleSound}
        onMouseEnter={playHoverSound}
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: soundEnabled 
            ? 'linear-gradient(to right, #4ade80, #10b981)' 
            : '#ffffff',
          color: soundEnabled ? '#ffffff' : '#9ca3af',
          boxShadow: soundEnabled 
            ? '0 10px 15px -3px rgba(34, 197, 94, 0.3)'
            : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          border: soundEnabled ? 'none' : '1px solid #e5e7eb',
          outline: 'none'
        }}
        aria-label={soundEnabled ? 'Disable sounds' : 'Enable sounds'}
        title={soundEnabled ? 'Matikan efek suara' : 'Nyalakan efek suara'}
        type="button"
      >
        {soundEnabled ? <FaVolumeUp style={{ fontSize: '18px' }} /> : <FaVolumeMute style={{ fontSize: '18px' }} />}
      </motion.button>

      {/* AI Chat Button */}
      {showChat && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={openChat}
          onMouseEnter={playHoverSound}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(to right, #3b82f6, #4f46e5)',
            color: '#ffffff',
            boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            border: 'none',
            outline: 'none'
          }}
          aria-label="Open AI Chat"
          title="Buka AI Chat"
          type="button"
        >
          <FaComments style={{ fontSize: '20px' }} />
        </motion.button>
      )}
    </div>
  );

  return createPortal(floatingControls, portalRoot);
}
