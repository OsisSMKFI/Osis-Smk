'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useScroll, useTransform, useInView, useSpring, AnimatePresence, useMotionValue } from 'framer-motion';
import Image from 'next/image';

// ============ TYPES ============
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

// ============ AUDIO ENGINE - Igloo Style ============
class AudioEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch { return null; }
    }
    return this.ctx;
  }

  setEnabled(enabled: boolean) { this.enabled = enabled; }
  isEnabled() { return this.enabled; }

  // Subtle hover - high pitched tick
  hover() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2000, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.03);
    
    gain.gain.setValueAtTime(0.02, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  }

  // Click - soft pop
  click() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);
    
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }

  // Reveal - ascending chime
  reveal() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    
    [400, 500, 600, 800].forEach((freq, i) => {
      setTimeout(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
      }, i * 60);
    });
  }

  // Transition whoosh
  transition() {
    if (!this.enabled) return;
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
    filter.frequency.setValueAtTime(200, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.1);
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.25);
    
    osc.frequency.setValueAtTime(100, ctx.currentTime);
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  }
}

const audio = new AudioEngine();

// ============ SECTION REVEAL - Igloo Style Opening ============
function SectionReveal({ 
  children, 
  onReveal 
}: { 
  children: React.ReactNode;
  onReveal?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (isInView && !revealed) {
      setRevealed(true);
      audio.reveal();
      onReveal?.();
    }
  }, [isInView, revealed, onReveal]);

  return (
    <div ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 100 }}
        transition={{ 
          duration: 1.2, 
          ease: [0.16, 1, 0.3, 1] // Custom easing like igloo
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// ============ ANIMATED TEXT - Letter by Letter ============
function AnimatedText({ 
  text, 
  className = '',
  delay = 0,
  highlight = false
}: { 
  text: string; 
  className?: string;
  delay?: number;
  highlight?: boolean;
}) {
  const letters = text.split('');
  
  return (
    <span className={`inline-block ${highlight ? 'bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent' : ''}`}>
      {letters.map((letter, i) => (
        <motion.span
          key={i}
          className={`inline-block ${className}`}
          initial={{ opacity: 0, y: 40, rotateX: -90 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.6,
            delay: delay + i * 0.03,
            ease: [0.16, 1, 0.3, 1]
          }}
          style={{ transformOrigin: 'bottom' }}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </motion.span>
      ))}
    </span>
  );
}

// ============ HORIZONTAL SCROLL GALLERY - Igloo Style ============
function HorizontalGallery({ 
  elements, 
  onElementClick 
}: { 
  elements: LogoElement[];
  onElementClick: (element: LogoElement, index: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });
  
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div ref={containerRef} className="relative overflow-hidden py-12">
      <motion.div 
        className="flex gap-6 px-8"
        style={{ x }}
      >
        {elements.map((element, index) => (
          <motion.div
            key={index}
            className="flex-shrink-0 w-80 md:w-96 cursor-pointer"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ 
              duration: 0.8, 
              delay: index * 0.1,
              ease: [0.16, 1, 0.3, 1]
            }}
            onMouseEnter={() => {
              setHoveredIndex(index);
              audio.hover();
            }}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => {
              audio.click();
              onElementClick(element, index);
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className={`
              relative p-8 rounded-3xl h-72 overflow-hidden
              bg-gradient-to-br from-[#383e4e] to-[#2a2f3a]
              border transition-all duration-500
              ${hoveredIndex === index 
                ? 'border-yellow-400/50 shadow-2xl shadow-yellow-500/10' 
                : 'border-white/5'
              }
            `}>
              {/* Background gradient on hover */}
              <motion.div 
                className={`absolute inset-0 ${element.gradient} opacity-0`}
                animate={{ opacity: hoveredIndex === index ? 0.1 : 0 }}
                transition={{ duration: 0.3 }}
              />
              
              {/* Number */}
              <motion.span 
                className="absolute top-6 right-6 text-6xl font-bold text-white/5"
                animate={{ 
                  color: hoveredIndex === index ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.05)'
                }}
              >
                0{index + 1}
              </motion.span>
              
              {/* Icon */}
              <motion.div 
                className={`
                  w-16 h-16 rounded-2xl flex items-center justify-center mb-6
                  ${hoveredIndex === index ? element.gradient : 'bg-white/10'}
                  transition-all duration-300
                `}
                animate={{ 
                  rotate: hoveredIndex === index ? [0, -5, 5, 0] : 0,
                  scale: hoveredIndex === index ? 1.1 : 1
                }}
              >
                <span className="text-3xl">{element.icon}</span>
              </motion.div>
              
              {/* Content */}
              <div className="relative z-10">
                <h3 className={`
                  text-xl font-bold mb-3 transition-colors duration-300
                  ${hoveredIndex === index ? 'text-yellow-400' : 'text-white'}
                `}>
                  {element.title}
                </h3>
                <p className="text-[#b6bac5] text-sm leading-relaxed line-clamp-3">
                  {element.description}
                </p>
              </div>
              
              {/* Click hint */}
              <motion.div 
                className="absolute bottom-6 right-6 flex items-center gap-2 text-yellow-400 text-sm"
                initial={{ opacity: 0, x: -10 }}
                animate={{ 
                  opacity: hoveredIndex === index ? 1 : 0,
                  x: hoveredIndex === index ? 0 : -10
                }}
              >
                <span>Lihat</span>
                <motion.span
                  animate={{ x: hoveredIndex === index ? [0, 5, 0] : 0 }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                >
                  →
                </motion.span>
              </motion.div>
              
              {/* Bottom line */}
              <motion.div 
                className={`absolute bottom-0 left-0 h-1 ${element.gradient}`}
                initial={{ width: 0 }}
                animate={{ width: hoveredIndex === index ? '100%' : 0 }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ============ DETAIL MODAL - Igloo Style Fullscreen ============
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
      audio.transition();
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    audio.click();
    onClose();
  }, [onClose]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) handleClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleClose]);

  if (!element) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Backdrop */}
          <motion.div 
            className="absolute inset-0 bg-[#0a0a0f]/95 backdrop-blur-xl"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          {/* Close button - top right */}
          <motion.button
            className="absolute top-8 right-8 z-10 w-14 h-14 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-colors"
            onClick={handleClose}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ delay: 0.2 }}
            whileHover={{ rotate: 90 }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </motion.button>
          
          {/* Content */}
          <motion.div
            className="relative w-full max-w-4xl mx-6 md:mx-12"
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ 
              duration: 0.6,
              ease: [0.16, 1, 0.3, 1]
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left - Icon */}
              <motion.div 
                className="flex justify-center"
                initial={{ opacity: 0, x: -50, rotate: -10 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <div className={`
                  w-48 h-48 md:w-64 md:h-64 rounded-3xl ${element.gradient}
                  flex items-center justify-center shadow-2xl
                `}>
                  <motion.span 
                    className="text-8xl md:text-9xl"
                    animate={{ 
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ 
                      duration: 4, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    {element.icon}
                  </motion.span>
                </div>
              </motion.div>
              
              {/* Right - Content */}
              <div className="text-left">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <span className="text-yellow-400 text-sm tracking-widest uppercase mb-4 block">
                    Filosofi Logo
                  </span>
                  
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                    {element.title}
                  </h2>
                  
                  <div className="w-16 h-1 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full mb-8" />
                  
                  <p className="text-[#b6bac5] text-lg leading-relaxed mb-8">
                    {element.description}
                  </p>
                  
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                      <span className="text-yellow-400">✦</span>
                      Makna Mendalam
                    </h4>
                    <p className="text-[#b6bac5] text-sm leading-relaxed">
                      Setiap elemen dalam logo OSIS SMK Informatika dirancang dengan cermat 
                      untuk merepresentasikan nilai-nilai organisasi dan visi untuk 
                      membentuk generasi pemimpin masa depan yang inovatif dan berkarakter.
                    </p>
                  </div>
                </motion.div>
                
                {/* Close button */}
                <motion.button
                  onClick={handleClose}
                  className="mt-8 px-8 py-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-gray-900 font-semibold rounded-xl hover:from-yellow-400 hover:to-amber-400 transition-all"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Tutup
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============ 3D LOGO - Parallax & Interactive ============
function Logo3D({ 
  logoSrc, 
  logoAlt 
}: { 
  logoSrc: string; 
  logoAlt: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.5 });
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [15, -15]), { stiffness: 100, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-15, 15]), { stiffness: 100, damping: 20 });
  
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  return (
    <motion.div 
      ref={containerRef}
      className="relative flex justify-center items-center py-20 cursor-pointer"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => {
        setIsHovered(true);
        audio.hover();
      }}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 1 }}
      style={{ perspective: 1000 }}
    >
      {/* Background glow */}
      <motion.div 
        className="absolute w-96 h-96 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%)'
        }}
        animate={{ 
          scale: isHovered ? 1.3 : 1,
          opacity: isHovered ? 1 : 0.5
        }}
      />

      {/* Orbiting rings */}
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border"
          style={{
            width: 200 + i * 50,
            height: 200 + i * 50,
            borderColor: `rgba(251,191,36,${0.1 / i})`
          }}
          animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
          transition={{ 
            duration: 20 + i * 10, 
            repeat: Infinity, 
            ease: 'linear' 
          }}
        />
      ))}

      {/* Logo with 3D rotation */}
      <motion.div
        className="relative w-52 h-52 md:w-64 md:h-64"
        initial={{ scale: 0.5, opacity: 0, rotateY: -180 }}
        animate={isInView ? { 
          scale: 1, 
          opacity: 1, 
          rotateY: 0 
        } : { scale: 0.5, opacity: 0, rotateY: -180 }}
        transition={{ 
          duration: 1.2,
          ease: [0.16, 1, 0.3, 1]
        }}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d'
        }}
        whileHover={{ scale: 1.08 }}
      >
        <Image
          src={logoSrc}
          alt={logoAlt}
          fill
          className="object-contain drop-shadow-2xl"
          priority
        />
      </motion.div>

      {/* Floating particles on hover */}
      <AnimatePresence>
        {isHovered && [...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-yellow-400 rounded-full"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
              x: Math.cos(i * 60 * Math.PI / 180) * 150,
              y: Math.sin(i * 60 * Math.PI / 180) * 150
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.1
            }}
          />
        ))}
      </AnimatePresence>
      
      {/* Hint text */}
      <motion.p 
        className="absolute -bottom-4 text-[#b6bac5] text-xs tracking-widest uppercase"
        animate={{ opacity: isHovered ? 0 : 0.5 }}
      >
        ↑ Gerakkan mouse
      </motion.p>
    </motion.div>
  );
}

// ============ SOUND TOGGLE ============
function SoundToggle() {
  const [enabled, setEnabled] = useState(true);
  
  const toggle = () => {
    const newState = !enabled;
    setEnabled(newState);
    audio.setEnabled(newState);
    if (newState) audio.click();
  };

  return (
    <motion.button
      onClick={toggle}
      className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/20 transition-all"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      {enabled ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 5L6 9H2v6h4l5 4V5z"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 5L6 9H2v6h4l5 4V5z"/>
          <line x1="23" y1="9" x2="17" y2="15"/>
          <line x1="17" y1="9" x2="23" y2="15"/>
        </svg>
      )}
    </motion.button>
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
  const [selectedElement, setSelectedElement] = useState<LogoElement | null>(null);
  const [revealed, setRevealed] = useState(false);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  return (
    <>
      <SoundToggle />
      
      <section 
        ref={containerRef}
        className="relative py-24 md:py-40 overflow-hidden"
        style={{ 
          background: 'linear-gradient(180deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)'
        }}
      >
        {/* Background effects */}
        <motion.div 
          className="absolute inset-0 pointer-events-none"
          style={{ y: backgroundY }}
        >
          {/* Center gradient */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px]"
            style={{
              background: 'radial-gradient(circle, rgba(251,191,36,0.05) 0%, transparent 50%)'
            }}
          />
          
          {/* Grid overlay */}
          <div 
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
              `,
              backgroundSize: '80px 80px'
            }}
          />
        </motion.div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          {/* Section Header with reveal animation */}
          <SectionReveal onReveal={() => setRevealed(true)}>
            <div className="text-center mb-8">
              {/* Label */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={revealed ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2 }}
                className="mb-6"
              >
                <span className="inline-flex items-center gap-3 text-yellow-400/80 text-xs tracking-[0.3em] uppercase">
                  <span className="w-8 h-px bg-yellow-400/50" />
                  {sectionTitle}
                  <span className="w-8 h-px bg-yellow-400/50" />
                </span>
              </motion.div>
              
              {/* Title with letter animation */}
              <h2 className="text-5xl md:text-7xl lg:text-8xl font-light text-white tracking-tight mb-6">
                <AnimatedText text="Filosofi " delay={0.3} />
                <AnimatedText text="Logo" delay={0.5} highlight />
              </h2>
              
              {/* Subtitle */}
              <motion.p 
                className="text-[#b6bac5] text-lg md:text-xl max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={revealed ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.8 }}
              >
                {sectionSubtitle}
              </motion.p>
            </div>
          </SectionReveal>

          {/* 3D Logo */}
          <Logo3D logoSrc={logoSrc} logoAlt={logoAlt} />

          {/* Divider */}
          <motion.div 
            className="flex items-center justify-center gap-4 py-12"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-white/20" />
            <motion.div 
              className="w-3 h-3 bg-yellow-400/50 rounded-full"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <div className="h-px w-20 bg-gradient-to-l from-transparent to-white/20" />
          </motion.div>

          {/* Elements label */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <span className="text-[#b6bac5]/50 text-sm tracking-widest uppercase">
              Elemen Logo • Klik untuk detail
            </span>
          </motion.div>
        </div>

        {/* Horizontal scrolling gallery */}
        <HorizontalGallery 
          elements={elements} 
          onElementClick={(element, index) => setSelectedElement(element)}
        />

        {/* Bottom accent */}
        <motion.div 
          className="flex justify-center gap-2 mt-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-yellow-500/30"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.08 }}
            />
          ))}
        </motion.div>

        {/* Detail Modal */}
        <DetailModal 
          element={selectedElement}
          isOpen={selectedElement !== null}
          onClose={() => setSelectedElement(null)}
        />
      </section>
    </>
  );
}
