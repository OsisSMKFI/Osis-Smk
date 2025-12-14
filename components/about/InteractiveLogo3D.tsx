'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useScroll, useTransform, useInView, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import Image from 'next/image';

interface LogoElement {
  icon: string;
  title: string;
  description: string;
  color: string;
  gradient: string;
}

interface InteractiveLogoProps {
  logoSrc: string;
  logoAlt: string;
  sectionTitle: string;
  sectionSubtitle: string;
  elements: LogoElement[];
}

// ============ SOUND SYSTEM ============
class SoundEngine {
  private audioContext: AudioContext | null = null;
  private isMuted: boolean = false;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  playHover() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }

  playClick() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // Click sound - two tones
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(440, ctx.currentTime);
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.15);
  }

  playWhoosh() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sawtooth';
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + 0.1);
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.25);

    osc.frequency.setValueAtTime(80, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  }

  playOpen() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // Opening chime
    [440, 554, 659, 880].forEach((freq, i) => {
      setTimeout(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }, i * 80);
    });
  }

  playClose() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  }
}

const soundEngine = new SoundEngine();

// ============ OPENING ANIMATION ============
function OpeningAnimation({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    soundEngine.playOpen();
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1300),
      setTimeout(() => {
        setPhase(4);
        onComplete();
      }, 1800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
      initial={{ opacity: 1 }}
      animate={{ opacity: phase >= 4 ? 0 : 1 }}
      transition={{ duration: 0.5 }}
      style={{ pointerEvents: phase >= 4 ? 'none' : 'auto' }}
    >
      {/* Center Logo */}
      <motion.div
        className="relative"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ 
          scale: phase >= 1 ? 1 : 0, 
          rotate: phase >= 1 ? 0 : -180 
        }}
        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
      >
        {/* Rings */}
        <motion.div
          className="absolute -inset-16 border-2 border-yellow-400/30 rounded-full"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: phase >= 2 ? [1, 1.5, 1] : 0,
            opacity: phase >= 2 ? 1 : 0,
            rotate: 360
          }}
          transition={{ 
            scale: { duration: 1, repeat: Infinity },
            rotate: { duration: 8, repeat: Infinity, ease: 'linear' }
          }}
        />
        <motion.div
          className="absolute -inset-24 border border-yellow-400/20 rounded-full"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: phase >= 2 ? 1 : 0,
            opacity: phase >= 2 ? 1 : 0,
            rotate: -360
          }}
          transition={{ rotate: { duration: 12, repeat: Infinity, ease: 'linear' } }}
        />

        {/* Logo text */}
        <motion.div
          className="text-6xl md:text-8xl font-bold text-yellow-400"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : 20 }}
        >
          OSIS
        </motion.div>
      </motion.div>

      {/* Particles */}
      {phase >= 3 && [...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-yellow-400 rounded-full"
          initial={{ 
            x: 0, 
            y: 0, 
            opacity: 1,
            scale: 1
          }}
          animate={{ 
            x: Math.cos(i * 30 * Math.PI / 180) * 200,
            y: Math.sin(i * 30 * Math.PI / 180) * 200,
            opacity: 0,
            scale: 0
          }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      ))}

      {/* Loading text */}
      <motion.p
        className="absolute bottom-20 text-white/50 text-sm tracking-widest uppercase"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 2 && phase < 4 ? 1 : 0 }}
      >
        Memuat pengalaman...
      </motion.p>
    </motion.div>
  );
}

// ============ SOUND TOGGLE ============
function SoundToggle() {
  const [isMuted, setIsMuted] = useState(false);

  const toggle = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    soundEngine.setMuted(newMuted);
    if (!newMuted) soundEngine.playClick();
  };

  return (
    <motion.button
      onClick={toggle}
      className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2 }}
    >
      {isMuted ? '🔇' : '🔊'}
    </motion.button>
  );
}

// ============ 3D CURSOR FOLLOWER ============
function CursorFollower() {
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const springX = useSpring(cursorX, { stiffness: 500, damping: 30 });
  const springY = useSpring(cursorY, { stiffness: 500, damping: 30 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-interactive]')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleMouseOver);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [cursorX, cursorY]);

  return (
    <motion.div
      className="fixed pointer-events-none z-[9999] mix-blend-difference hidden md:block"
      style={{ 
        x: springX, 
        y: springY,
        translateX: '-50%',
        translateY: '-50%'
      }}
    >
      <motion.div
        className="w-4 h-4 bg-yellow-400 rounded-full"
        animate={{ 
          scale: isHovering ? 2.5 : 1,
          opacity: isHovering ? 0.8 : 0.6
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      />
    </motion.div>
  );
}

// ============ INTERACTIVE ELEMENT CARD ============
function ElementCard({ 
  element, 
  index,
  isActive,
  onClick,
  onHover
}: { 
  element: LogoElement; 
  index: number;
  isActive: boolean;
  onClick: () => void;
  onHover: (hovering: boolean) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, amount: 0.3 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left - rect.width / 2) / 20,
      y: (e.clientY - rect.top - rect.height / 2) / 20
    });
  };

  const handleMouseEnter = () => {
    onHover(true);
    soundEngine.playHover();
  };

  const handleClick = () => {
    soundEngine.playClick();
    onClick();
  };

  return (
    <motion.div
      ref={cardRef}
      data-interactive
      className="group cursor-pointer perspective-1000"
      initial={{ opacity: 0, y: 80, rotateX: -15 }}
      animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 80, rotateX: -15 }}
      transition={{ 
        duration: 0.8, 
        delay: index * 0.12,
        ease: [0.22, 1, 0.36, 1]
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => {
        onHover(false);
        setMousePos({ x: 0, y: 0 });
      }}
      onClick={handleClick}
      style={{
        transformStyle: 'preserve-3d',
        transform: `rotateY(${mousePos.x}deg) rotateX(${-mousePos.y}deg)`
      }}
    >
      <motion.div 
        className={`
          relative p-8 rounded-2xl overflow-hidden
          ${isActive 
            ? 'bg-gradient-to-br from-yellow-500/30 to-amber-500/20 border-yellow-400' 
            : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.08]'
          }
          border backdrop-blur-xl transition-all duration-300
        `}
        whileHover={{ scale: 1.02 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Shine effect on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6 }}
        />

        {/* Number */}
        <div className="absolute top-4 right-4">
          <span className={`text-xs font-mono ${isActive ? 'text-yellow-400' : 'text-white/20'}`}>
            0{index + 1}
          </span>
        </div>

        {/* Icon with 3D effect */}
        <motion.div 
          className={`
            relative w-16 h-16 rounded-xl flex items-center justify-center mb-6
            ${isActive 
              ? 'bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg shadow-yellow-500/30' 
              : 'bg-white/10 group-hover:bg-white/20'
            }
          `}
          style={{ transform: 'translateZ(40px)' }}
          whileHover={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-3xl">{element.icon}</span>
        </motion.div>

        {/* Content */}
        <div style={{ transform: 'translateZ(20px)' }}>
          <h3 className={`text-xl font-bold mb-3 ${isActive ? 'text-yellow-400' : 'text-white'}`}>
            {element.title}
          </h3>
          <p className={`text-sm leading-relaxed ${isActive ? 'text-white/90' : 'text-white/50'}`}>
            {element.description}
          </p>
        </div>

        {/* Click hint */}
        <motion.div 
          className="mt-6 flex items-center gap-2 text-yellow-400/70 text-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: isActive ? 1 : 0 }}
        >
          <span>Lihat detail</span>
          <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1 }}>
            →
          </motion.span>
        </motion.div>

        {/* Bottom line */}
        <motion.div 
          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 to-amber-500"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isActive ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ transformOrigin: 'left' }}
        />
      </motion.div>
    </motion.div>
  );
}

// ============ FULLSCREEN DETAIL MODAL ============
function DetailModal({ 
  element, 
  isOpen, 
  onClose 
}: { 
  element: LogoElement | null; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  useEffect(() => {
    if (isOpen) {
      soundEngine.playWhoosh();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    soundEngine.playClose();
    onClose();
  };

  if (!element) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop with blur */}
          <motion.div 
            className="absolute inset-0 bg-black/95 backdrop-blur-lg"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          {/* Content - Centered and visible without scroll */}
          <motion.div
            className="relative w-full max-w-3xl mx-4 max-h-[90vh] overflow-auto"
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ 
              type: 'spring',
              stiffness: 300,
              damping: 30
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button - Always visible */}
            <motion.button
              onClick={handleClose}
              className="absolute -top-2 right-0 z-10 w-12 h-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white text-2xl hover:bg-white/20 transition-colors"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              ×
            </motion.button>

            {/* Main Card */}
            <div className="bg-gradient-to-br from-gray-900/95 to-black/95 rounded-3xl p-8 md:p-12 border border-white/10 backdrop-blur-xl">
              {/* Header */}
              <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
                <motion.div 
                  className={`w-24 h-24 rounded-2xl ${element.gradient} flex items-center justify-center shadow-2xl flex-shrink-0`}
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                >
                  <span className="text-5xl">{element.icon}</span>
                </motion.div>
                
                <div className="flex-1">
                  <motion.h2 
                    className="text-3xl md:text-4xl font-bold text-white mb-3"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {element.title}
                  </motion.h2>
                  <motion.div 
                    className="h-1 w-20 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500"
                    initial={{ width: 0 }}
                    animate={{ width: 80 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <p className="text-xl text-white/80 leading-relaxed mb-8">
                  {element.description}
                </p>
              </motion.div>

              {/* Additional Info */}
              <motion.div 
                className="bg-white/5 rounded-2xl p-6 border border-white/10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h4 className="text-yellow-400 font-semibold mb-3 flex items-center gap-2">
                  <span>✨</span> Makna Mendalam
                </h4>
                <p className="text-white/60 leading-relaxed">
                  Elemen ini merupakan bagian integral dari identitas visual OSIS SMK Informatika. 
                  Setiap aspek dirancang dengan cermat untuk mencerminkan nilai-nilai organisasi 
                  dalam membentuk generasi pemimpin masa depan yang inovatif dan berkarakter.
                </p>
              </motion.div>

              {/* Features */}
              <motion.div 
                className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {['Inovatif', 'Inspiratif', 'Integral'].map((feat, i) => (
                  <motion.div
                    key={feat}
                    className="bg-white/5 rounded-xl p-4 text-center border border-white/5"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                  >
                    <span className="text-white/70 text-sm">{feat}</span>
                  </motion.div>
                ))}
              </motion.div>

              {/* Close button at bottom */}
              <motion.button
                onClick={handleClose}
                className="mt-8 w-full py-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-gray-900 font-semibold rounded-xl hover:from-yellow-400 hover:to-amber-400 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                Tutup
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============ INTERACTIVE 3D LOGO ============
function Logo3DDisplay({ 
  logoSrc, 
  logoAlt 
}: { 
  logoSrc: string; 
  logoAlt: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.5 });
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    setRotation({
      x: (e.clientY - centerY) / 15,
      y: (e.clientX - centerX) / 15
    });
  };

  return (
    <motion.div 
      ref={containerRef}
      data-interactive
      className="relative flex justify-center items-center py-20 md:py-32 cursor-pointer"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => {
        setIsHovered(true);
        soundEngine.playHover();
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setRotation({ x: 0, y: 0 });
      }}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 1 }}
    >
      {/* Background glow */}
      <motion.div 
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%)'
        }}
        animate={{ 
          scale: isHovered ? 1.3 : 1,
          opacity: isHovered ? 1 : 0.5
        }}
        transition={{ duration: 0.5 }}
      />

      {/* Rotating rings */}
      <motion.div 
        className="absolute w-80 h-80 border border-yellow-400/20 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div 
        className="absolute w-96 h-96 border border-yellow-400/10 rounded-full"
        animate={{ rotate: -360 }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div 
        className="absolute w-[28rem] h-[28rem] border border-yellow-400/5 rounded-full"
        animate={{ rotate: 180 }}
        transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
      />

      {/* Floating particles */}
      {isHovered && [...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-yellow-400 rounded-full"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
            x: Math.cos(i * 45 * Math.PI / 180) * 180,
            y: Math.sin(i * 45 * Math.PI / 180) * 180
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.15
          }}
        />
      ))}

      {/* Logo with 3D transform */}
      <motion.div
        className="relative w-56 h-56 md:w-72 md:h-72"
        initial={{ scale: 0.5, opacity: 0, rotateY: -180 }}
        animate={isInView ? { 
          scale: 1, 
          opacity: 1, 
          rotateY: 0,
          rotateX: -rotation.x,
          rotateZ: rotation.y / 3
        } : { scale: 0.5, opacity: 0, rotateY: -180 }}
        transition={{ 
          duration: 1.2,
          ease: [0.22, 1, 0.36, 1]
        }}
        style={{
          transformStyle: 'preserve-3d',
          perspective: '1000px'
        }}
      >
        <motion.div
          animate={{ 
            rotateY: rotation.y,
            rotateX: -rotation.x,
            scale: isHovered ? 1.1 : 1
          }}
          transition={{ type: 'spring', stiffness: 150, damping: 15 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <Image
            src={logoSrc}
            alt={logoAlt}
            fill
            className="object-contain drop-shadow-2xl"
            priority
          />
        </motion.div>
      </motion.div>

      {/* Hover hint */}
      <motion.div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ opacity: isHovered ? 0 : 0.5 }}
      >
        <p className="text-white/40 text-xs tracking-widest uppercase flex items-center gap-2">
          <motion.span 
            animate={{ y: [0, -4, 0] }} 
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            ↑
          </motion.span>
          Gerakkan mouse untuk interaksi
        </p>
      </motion.div>
    </motion.div>
  );
}

// ============ MAIN COMPONENT ============
export default function InteractiveLogo3D({ 
  logoSrc, 
  logoAlt, 
  sectionTitle, 
  sectionSubtitle,
  elements 
}: InteractiveLogoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showOpening, setShowOpening] = useState(true);
  const [selectedElement, setSelectedElement] = useState<LogoElement | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.5, 1, 1, 0.5]);

  const handleElementClick = (element: LogoElement, index: number) => {
    setSelectedElement(element);
    setActiveIndex(index);
  };

  return (
    <>
      {/* Opening Animation */}
      {showOpening && (
        <OpeningAnimation onComplete={() => setShowOpening(false)} />
      )}

      {/* Cursor Follower */}
      <CursorFollower />

      {/* Sound Toggle */}
      <SoundToggle />

      <section 
        ref={containerRef}
        className="relative py-24 md:py-40 bg-[#050505] overflow-hidden"
      >
        {/* Animated Background */}
        <motion.div 
          className="absolute inset-0 pointer-events-none"
          style={{ y: backgroundY, opacity }}
        >
          {/* Main gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-yellow-900/5 via-transparent to-yellow-900/5" />
          
          {/* Center orb */}
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px]"
            style={{
              background: 'radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 50%)'
            }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          
          {/* Grid lines */}
          <div 
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(251,191,36,0.5) 1px, transparent 1px),
                linear-gradient(90deg, rgba(251,191,36,0.5) 1px, transparent 1px)
              `,
              backgroundSize: '80px 80px'
            }}
          />
        </motion.div>

        <motion.div 
          className="relative z-10 max-w-6xl mx-auto px-6"
          style={{ opacity }}
        >
          {/* Section Header */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.span 
              className="inline-block text-yellow-500/80 text-xs font-medium tracking-[0.4em] uppercase mb-6"
              initial={{ opacity: 0, letterSpacing: '0.1em' }}
              whileInView={{ opacity: 1, letterSpacing: '0.4em' }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              {sectionTitle}
            </motion.span>
            
            <motion.h2
              className="text-5xl md:text-7xl lg:text-8xl font-light text-white tracking-tight"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              Filosofi{' '}
              <span className="font-bold bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                Logo
              </span>
            </motion.h2>
            
            <motion.p 
              className="mt-6 text-white/40 max-w-2xl mx-auto text-lg md:text-xl font-light"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
            >
              {sectionSubtitle}
            </motion.p>
          </motion.div>

          {/* 3D Logo Display */}
          <Logo3DDisplay logoSrc={logoSrc} logoAlt={logoAlt} />

          {/* Divider */}
          <motion.div 
            className="flex items-center justify-center gap-4 py-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="h-px w-24 bg-gradient-to-r from-transparent to-yellow-400/30" />
            <motion.div 
              className="w-3 h-3 bg-yellow-400/50 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
            <div className="h-px w-24 bg-gradient-to-l from-transparent to-yellow-400/30" />
          </motion.div>

          {/* Elements Label */}
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <span className="text-white/30 text-sm tracking-[0.2em] uppercase">
              Klik kartu untuk melihat detail
            </span>
          </motion.div>

          {/* Elements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {elements.map((element, index) => (
              <ElementCard 
                key={index}
                element={element}
                index={index}
                isActive={activeIndex === index}
                onClick={() => handleElementClick(element, index)}
                onHover={(hovering) => {
                  if (hovering) setActiveIndex(index);
                }}
              />
            ))}
          </div>

          {/* Bottom decoration */}
          <motion.div 
            className="mt-24 flex justify-center gap-3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-yellow-400/30"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + i * 0.1 }}
              />
            ))}
          </motion.div>
        </motion.div>

        {/* Detail Modal */}
        <DetailModal 
          element={selectedElement}
          isOpen={selectedElement !== null}
          onClose={() => {
            setSelectedElement(null);
            setActiveIndex(null);
          }}
        />
      </section>
    </>
  );
}
