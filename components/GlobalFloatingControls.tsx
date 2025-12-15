'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowUp, FaVolumeUp, FaVolumeMute, FaComments } from 'react-icons/fa';
import { useSoundEffects } from '@/contexts/SoundContext';

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

  const scrollToTop = useCallback(() => {
    // Play sound first (wrapped in try-catch to not block scroll)
    try {
      playClickSound();
    } catch (e) {
      console.warn('Sound play failed:', e);
    }
    
    // Scroll to top with fallback
    try {
      // Try smooth scroll first
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } catch {
      // Fallback to instant scroll
      window.scrollTo(0, 0);
    }
    
    // Also try scrolling html and body directly as fallback
    try {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } catch {}
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
