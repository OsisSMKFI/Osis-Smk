'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, useScroll, useTransform, useInView, useSpring, AnimatePresence, useMotionValue } from 'framer-motion';
import Image from 'next/image';

// ============ TYPES ============
interface LogoElement {
  icon: string;
  imageSrc?: string; // Path ke gambar SVG
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

// ============ AUDIO ENGINE ============
class AudioEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private masterGain: GainNode | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 0.25;
      } catch { return null; }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  private getMaster(): GainNode | null {
    this.getContext();
    return this.masterGain;
  }

  setEnabled(enabled: boolean) { this.enabled = enabled; }
  isEnabled() { return this.enabled; }

  hover() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    const master = this.getMaster();
    if (!ctx || !master) return;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(master);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2600, ctx.currentTime + 0.02);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.03);
  }

  click() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    const master = this.getMaster();
    if (!ctx || !master) return;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(master);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }

  reveal() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    const master = this.getMaster();
    if (!ctx || !master) return;
    
    [330, 440, 550, 660].forEach((freq, i) => {
      setTimeout(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(master);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }, i * 60);
    });
  }

  whoosh() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    const master = this.getMaster();
    if (!ctx || !master) return;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    
    osc.type = 'sawtooth';
    filter.type = 'bandpass';
    filter.Q.value = 3;
    filter.frequency.setValueAtTime(100, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.12);
    filter.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.25);
    
    osc.frequency.setValueAtTime(60, ctx.currentTime);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  }
}

const audio = new AudioEngine();

// ============ SCROLL REVEAL CARD ============
function ScrollRevealCard({ 
  children, 
  index = 0,
  className = ''
}: { 
  children: React.ReactNode;
  index?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const [hasRevealed, setHasRevealed] = useState(false);

  useEffect(() => {
    if (isInView && !hasRevealed) {
      setHasRevealed(true);
      setTimeout(() => audio.reveal(), index * 80);
    }
  }, [isInView, hasRevealed, index]);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 60, scale: 0.95 }}
      animate={hasRevealed ? { 
        opacity: 1, 
        y: 0, 
        scale: 1 
      } : { 
        opacity: 0, 
        y: 60, 
        scale: 0.95 
      }}
      transition={{ 
        duration: 0.7, 
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1]
      }}
    >
      {children}
    </motion.div>
  );
}

// ============ ELEMENT CARD ============
function ElementCard({ 
  element, 
  index, 
  isActive, 
  onHover, 
  onClick 
}: { 
  element: LogoElement;
  index: number;
  isActive: boolean;
  onHover: (active: boolean) => void;
  onClick: () => void;
}) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // Handle mouse movement for 3D tilt effect
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePosition({ x, y });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePosition({ x: 0, y: 0 });
    onHover(false);
  }, [onHover]);

  return (
    <ScrollRevealCard index={index} className="h-full">
      <motion.div
        ref={cardRef}
        className={`
          relative h-full min-h-[380px] md:min-h-[420px] rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer
          bg-white dark:bg-gradient-to-br dark:from-[#1a1a24] dark:via-[#15151d] dark:to-[#0f0f14]
          border transition-all duration-500
          ${isActive 
            ? 'border-yellow-400/60 shadow-2xl shadow-yellow-500/30 dark:shadow-yellow-500/20' 
            : 'border-gray-200 dark:border-white/[0.05] hover:border-yellow-400/30'
          }
        `}
        style={{
          perspective: '1000px',
          transformStyle: 'preserve-3d',
        }}
        onMouseEnter={() => {
          onHover(true);
          audio.hover();
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => {
          audio.click();
          onClick();
        }}
        animate={{
          rotateX: isActive ? mousePosition.y * -15 : 0,
          rotateY: isActive ? mousePosition.x * 15 : 0,
          scale: isActive ? 1.03 : 1,
          y: isActive ? -8 : 0,
        }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* 3D Glow effect */}
        <motion.div 
          className="absolute inset-0 pointer-events-none"
          animate={{
            background: isActive 
              ? `radial-gradient(600px circle at ${(mousePosition.x + 0.5) * 100}% ${(mousePosition.y + 0.5) * 100}%, ${element.color}20, transparent 40%)`
              : 'none',
          }}
          transition={{ duration: 0.2 }}
        />
        
        {/* Gradient overlay */}
        <motion.div 
          className={`absolute inset-0 ${element.gradient} opacity-0`}
          animate={{ opacity: isActive ? 0.1 : 0 }}
          transition={{ duration: 0.4 }}
        />
        
        {/* Number watermark */}
        <span 
          className="absolute top-4 right-4 md:top-6 md:right-6 text-6xl md:text-8xl font-black text-gray-100 dark:text-white/[0.03] select-none"
          style={{ lineHeight: 1 }}
        >
          0{index + 1}
        </span>
        
        {/* Content */}
        <div className="relative z-10 p-6 md:p-8 h-full flex flex-col">
          {/* Icon - Now supports SVG images */}
          <motion.div 
            className={`
              w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6
              ${isActive ? element.gradient : 'bg-gray-100 dark:bg-white/5'}
              transition-all duration-400 shadow-lg relative overflow-hidden
            `}
            animate={{ 
              rotate: isActive ? [0, -6, 6, -3, 3, 0] : 0,
              scale: isActive ? 1.1 : 1,
              rotateY: isActive ? [0, 10, -10, 5, -5, 0] : 0,
            }}
            transition={{ duration: 0.6 }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {element.imageSrc ? (
              <div className="relative w-full h-full p-2">
                <Image
                  src={element.imageSrc}
                  alt={element.title}
                  fill
                  className="object-contain p-1"
                  style={{ filter: isActive ? 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' : 'none' }}
                />
              </div>
            ) : (
              <span className="text-2xl md:text-3xl">{element.icon}</span>
            )}
            {/* Shine effect on hover */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0"
              initial={{ x: '-100%', y: '-100%' }}
              animate={{ x: isActive ? '100%' : '-100%', y: isActive ? '100%' : '-100%' }}
              transition={{ duration: 0.6 }}
            />
          </motion.div>
          
          {/* Title */}
          <h3 className={`
            text-lg md:text-xl font-bold mb-2 md:mb-3 transition-colors duration-300
            ${isActive ? 'text-yellow-500 dark:text-yellow-400' : 'text-gray-900 dark:text-white'}
          `}>
            {element.title}
          </h3>
          
          {/* Description */}
          <p className="text-gray-600 dark:text-[#b6bac5]/70 text-sm md:text-base leading-relaxed flex-1">
            {element.description}
          </p>
          
          {/* Action hint */}
          <motion.div 
            className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-white/5"
            initial={{ opacity: 0 }}
            animate={{ opacity: isActive ? 1 : 0.5 }}
            transition={{ duration: 0.3 }}
          >
            <span className={`text-sm font-medium ${isActive ? 'text-yellow-500 dark:text-yellow-400' : 'text-gray-400 dark:text-white/30'}`}>
              {isActive ? 'Klik untuk detail' : 'Hover untuk info'}
            </span>
            <motion.div 
              className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? 'bg-yellow-400' : 'bg-gray-100 dark:bg-white/5'}`}
              animate={{ x: isActive ? [0, 4, 0] : 0 }}
              transition={{ duration: 0.6, repeat: isActive ? Infinity : 0 }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M3 8H13M13 8L8 3M13 8L8 13" stroke={isActive ? "#000" : "#999"} strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Bottom accent line */}
        <motion.div 
          className={`absolute bottom-0 left-0 h-1 ${element.gradient}`}
          initial={{ width: 0 }}
          animate={{ width: isActive ? '100%' : 0 }}
          transition={{ duration: 0.3 }}
        />

        {/* Corner glow effect */}
        <motion.div
          className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl pointer-events-none"
          animate={{
            backgroundColor: isActive ? element.color : 'transparent',
            opacity: isActive ? 0.3 : 0,
          }}
          transition={{ duration: 0.4 }}
        />
      </motion.div>
    </ScrollRevealCard>
  );
}

// ============ ELEMENTS GRID ============
function ElementsGrid({ 
  elements, 
  onElementClick 
}: { 
  elements: LogoElement[];
  onElementClick: (element: LogoElement, index: number) => void;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
      {/* Section label */}
      <motion.div 
        className="text-center mb-8 md:mb-12"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <span className="inline-flex items-center gap-2 text-gray-500 dark:text-[#b6bac5]/50 text-xs tracking-widest uppercase">
          <span className="w-6 h-px bg-gray-300 dark:bg-white/20" />
          5 Elemen Filosofi Logo
          <span className="w-6 h-px bg-gray-300 dark:bg-white/20" />
        </span>
      </motion.div>
      
      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {elements.map((element, index) => (
          <ElementCard
            key={index}
            element={element}
            index={index}
            isActive={activeIndex === index}
            onHover={(active) => setActiveIndex(active ? index : null)}
            onClick={() => onElementClick(element, index)}
          />
        ))}
      </div>
      
      {/* Indicator */}
      <motion.div 
        className="flex justify-center mt-8 md:mt-12 gap-1.5"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        {elements.map((_, i) => (
          <motion.div
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              activeIndex === i 
                ? 'w-6 bg-yellow-400' 
                : 'w-1.5 bg-gray-300 dark:bg-white/20'
            }`}
          />
        ))}
      </motion.div>
    </div>
  );
}

// ============ 3D LOGO ============
function Logo3D({ 
  logoSrc, 
  logoAlt 
}: { 
  logoSrc: string; 
  logoAlt: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.3 });
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const rotateX = useSpring(useTransform(mouseY, [-200, 200], [15, -15]), { stiffness: 100, damping: 25 });
  const rotateY = useSpring(useTransform(mouseX, [-200, 200], [-15, 15]), { stiffness: 100, damping: 25 });
  
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
      className="relative flex justify-center items-center py-16 md:py-24"
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
        className="absolute w-64 h-64 md:w-96 md:h-96 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(251,191,36,0.15) 0%, rgba(251,191,36,0.03) 50%, transparent 70%)'
        }}
        animate={{ 
          scale: isHovered ? 1.2 : 1,
          opacity: isHovered ? 1 : 0.6
        }}
        transition={{ duration: 0.6 }}
      />

      {/* Orbital rings */}
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-yellow-400/10"
          style={{
            width: 140 + i * 50,
            height: 140 + i * 50,
          }}
          animate={{ 
            rotate: i % 2 === 0 ? 360 : -360,
            scale: isHovered ? 1.05 : 1,
          }}
          transition={{ 
            rotate: { duration: 20 + i * 8, repeat: Infinity, ease: 'linear' },
            scale: { duration: 0.4 }
          }}
        />
      ))}

      {/* Floating particles on hover */}
      <AnimatePresence>
        {isHovered && [...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full"
            initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              x: Math.cos(i * 45 * Math.PI / 180) * 120,
              y: Math.sin(i * 45 * Math.PI / 180) * 120
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </AnimatePresence>

      {/* Logo with 3D effect */}
      <motion.div
        className="relative w-44 h-44 md:w-56 md:h-56 lg:w-64 lg:h-64 cursor-pointer"
        initial={{ scale: 0.5, opacity: 0, rotateY: -90 }}
        animate={isInView ? { 
          scale: 1, 
          opacity: 1, 
          rotateY: 0 
        } : { scale: 0.5, opacity: 0, rotateY: -90 }}
        transition={{ 
          duration: 1.2,
          ease: [0.16, 1, 0.3, 1]
        }}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d'
        }}
        whileHover={{ scale: 1.05 }}
      >
        <Image
          src={logoSrc}
          alt={logoAlt}
          fill
          sizes="(max-width: 768px) 176px, (max-width: 1024px) 224px, 256px"
          className="object-contain drop-shadow-2xl"
          priority
        />
      </motion.div>
      
      {/* Hint text */}
      <motion.p 
        className="absolute -bottom-2 text-gray-400 dark:text-[#b6bac5]/40 text-xs tracking-widest uppercase"
        animate={{ 
          opacity: isHovered ? 0 : [0.4, 0.7, 0.4],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        ↑ Gerakkan kursor
      </motion.p>
    </motion.div>
  );
}

// ============ DETAIL MODAL ============
function DetailModal({ 
  element, 
  isOpen, 
  onClose 
}: { 
  element: LogoElement | null; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      audio.whoosh();
      document.body.style.overflow = 'hidden';
      setIsFlipped(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    audio.click();
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) handleClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleClose]);

  // State to track if we're on client (for portal)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!element || !mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 md:p-8"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop with animated gradient */}
          <motion.div 
            className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Animated background particles */}
            <motion.div
              className="absolute inset-0 overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
            >
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full blur-3xl"
                  style={{
                    backgroundColor: element.color,
                    width: `${150 + i * 50}px`,
                    height: `${150 + i * 50}px`,
                    left: `${20 + i * 15}%`,
                    top: `${10 + i * 18}%`,
                  }}
                  animate={{
                    x: [0, 30, -30, 0],
                    y: [0, -20, 20, 0],
                    opacity: [0.1, 0.2, 0.1],
                  }}
                  transition={{
                    duration: 5 + i,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.5,
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
          
          {/* Close button - glassmorphism style */}
          <motion.button
            className="fixed top-3 right-3 sm:top-6 sm:right-6 z-[10000] w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 flex items-center justify-center text-white hover:bg-white/20 hover:scale-110 transition-all shadow-2xl"
            onClick={handleClose}
            initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5, rotate: 180 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            whileHover={{ rotate: 90 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </motion.button>
          
          {/* Main Content with 3D perspective */}
          <motion.div
            className="relative w-full max-w-lg sm:max-w-2xl md:max-w-4xl"
            initial={{ opacity: 0, rotateX: -15, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, rotateX: 15, y: 50, scale: 0.9 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ perspective: '1500px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Card Container with 3D flip capability */}
            <motion.div
              className="relative rounded-3xl overflow-hidden"
              style={{ transformStyle: 'preserve-3d' }}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.8, type: 'spring', stiffness: 100 }}
            >
              {/* Front of Card */}
              <motion.div
                className="relative"
                style={{ 
                  backfaceVisibility: 'hidden',
                  pointerEvents: isFlipped ? 'none' : 'auto',
                  opacity: isFlipped ? 0 : 1,
                  transition: 'opacity 0.3s ease'
                }}
              >
                <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 sm:p-8 md:p-10 shadow-2xl border border-white/10">
                  <div className="flex flex-col md:grid md:grid-cols-5 gap-6 md:gap-10 items-center">
                    
                    {/* Left: Large Icon/Image with 3D float effect */}
                    <motion.div 
                      className="md:col-span-2 flex justify-center"
                      initial={{ opacity: 0, scale: 0.5, rotateY: -30 }}
                      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                      transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
                    >
                      <motion.div 
                        className={`relative w-40 h-40 sm:w-52 sm:h-52 md:w-64 md:h-64 rounded-3xl ${element.gradient} flex items-center justify-center shadow-2xl overflow-hidden`}
                        animate={{
                          y: [0, -10, 0],
                          rotateZ: [0, 2, -2, 0],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                        whileHover={{ scale: 1.05 }}
                        style={{ transformStyle: 'preserve-3d' }}
                      >
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                        
                        {/* Icon or Image */}
                        {element.imageSrc ? (
                          <div className="relative w-full h-full p-6">
                            <Image
                              src={element.imageSrc}
                              alt={element.title}
                              fill
                              className="object-contain p-4 drop-shadow-2xl"
                              style={{ filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.4))' }}
                            />
                          </div>
                        ) : (
                          <span className="text-7xl sm:text-8xl md:text-9xl drop-shadow-2xl relative z-10">{element.icon}</span>
                        )}
                        
                        {/* Animated shine effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0"
                          initial={{ x: '-100%', y: '-100%' }}
                          animate={{ x: '100%', y: '100%' }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        />
                        
                        {/* Floating particles around the icon */}
                        {[...Array(3)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-3 h-3 rounded-full bg-white/30"
                            animate={{
                              x: [0, 20, -20, 0],
                              y: [-30 - i * 20, 30 + i * 10, -30 - i * 20],
                              opacity: [0, 1, 0],
                            }}
                            transition={{
                              duration: 3 + i,
                              repeat: Infinity,
                              delay: i * 0.5,
                            }}
                            style={{
                              left: `${30 + i * 20}%`,
                              top: `${20 + i * 15}%`,
                            }}
                          />
                        ))}
                      </motion.div>
                    </motion.div>
                    
                    {/* Right: Details */}
                    <motion.div 
                      className="md:col-span-3 text-center md:text-left w-full"
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      {/* Label with animated line */}
                      <motion.span 
                        className="inline-flex items-center gap-3 text-yellow-400 text-xs sm:text-sm tracking-[0.2em] uppercase mb-3 sm:mb-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <motion.span 
                          className="w-0 h-px bg-yellow-400"
                          animate={{ width: 24 }}
                          transition={{ delay: 0.5, duration: 0.3 }}
                        />
                        Filosofi Logo OSIS
                        <motion.span 
                          className="w-0 h-px bg-yellow-400"
                          animate={{ width: 24 }}
                          transition={{ delay: 0.5, duration: 0.3 }}
                        />
                      </motion.span>
                      
                      {/* Title with gradient */}
                      <motion.h2 
                        className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                      >
                        <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                          {element.title}
                        </span>
                      </motion.h2>
                      
                      {/* Animated divider */}
                      <motion.div 
                        className="h-1 rounded-full mb-5 mx-auto md:mx-0"
                        style={{ background: `linear-gradient(to right, ${element.color}, transparent)` }}
                        initial={{ width: 0 }}
                        animate={{ width: '120px' }}
                        transition={{ delay: 0.4, duration: 0.4 }}
                      />
                      
                      {/* Description with fade-in effect */}
                      <motion.p 
                        className="text-gray-300 text-base sm:text-lg leading-relaxed mb-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.45 }}
                      >
                        {element.description}
                      </motion.p>
                      
                      {/* Info cards */}
                      <motion.div 
                        className="grid grid-cols-2 gap-3 mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                      >
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                          <div className="text-yellow-400 text-2xl mb-1">✦</div>
                          <div className="text-white font-semibold text-sm">Makna Mendalam</div>
                          <div className="text-gray-400 text-xs mt-1">Simbol bermakna</div>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                          <div className="text-yellow-400 text-2xl mb-1">◈</div>
                          <div className="text-white font-semibold text-sm">Nilai Organisasi</div>
                          <div className="text-gray-400 text-xs mt-1">Karakter OSIS</div>
                        </div>
                      </motion.div>
                      
                      {/* Action buttons */}
                      <motion.div 
                        className="flex flex-col sm:flex-row gap-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.55 }}
                      >
                        <motion.button
                          onClick={() => setIsFlipped(true)}
                          className="flex-1 px-6 py-3.5 bg-white/10 backdrop-blur-sm text-white font-semibold text-sm rounded-xl border border-white/20 hover:bg-white/20 transition-all flex items-center justify-center gap-2 group"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span>Lihat Detail</span>
                          <motion.span
                            className="text-lg"
                            animate={{ rotateY: [0, 360] }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                          >
                            ↻
                          </motion.span>
                        </motion.button>
                        <motion.button
                          onClick={handleClose}
                          className={`flex-1 px-6 py-3.5 ${element.gradient} text-gray-900 font-bold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Tutup
                        </motion.button>
                      </motion.div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* Back of Card */}
              <motion.div
                className="absolute inset-0"
                style={{ 
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  pointerEvents: isFlipped ? 'auto' : 'none',
                  opacity: isFlipped ? 1 : 0,
                  transition: 'opacity 0.3s ease 0.2s'
                }}
              >
                <div className="h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 sm:p-8 md:p-10 shadow-2xl border border-white/10 rounded-3xl">
                  <div className="flex flex-col items-center justify-center h-full min-h-[300px] md:min-h-[400px]">
                    {/* Back content - more details */}
                    <motion.div
                      className="text-center max-w-lg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isFlipped ? 1 : 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <h3 className="text-yellow-400 text-lg font-semibold mb-2 tracking-wide uppercase">
                        Nilai yang Terkandung
                      </h3>
                      <h2 className="text-white text-3xl md:text-4xl font-bold mb-6">
                        {element.title}
                      </h2>
                      
                      <div className="space-y-4 text-left bg-white/5 rounded-2xl p-6 border border-white/10 mb-6">
                        <div className="flex items-start gap-3">
                          <span className="text-yellow-400 mt-1">●</span>
                          <p className="text-gray-300">
                            Elemen ini mewakili identitas dan karakter utama dari organisasi OSIS SMK Informatika Fithrah Insani.
                          </p>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-yellow-400 mt-1">●</span>
                          <p className="text-gray-300">
                            Dirancang dengan penuh makna untuk mencerminkan nilai-nilai yang dijunjung tinggi oleh seluruh anggota.
                          </p>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-yellow-400 mt-1">●</span>
                          <p className="text-gray-300">
                            Menjadi pengingat bagi setiap anggota akan tanggung jawab dan peran dalam organisasi.
                          </p>
                        </div>
                      </div>
                      
                      <motion.button
                        onClick={() => setIsFlipped(false)}
                        className={`px-8 py-3.5 ${element.gradient} text-gray-900 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Kembali
                      </motion.button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Use portal to render modal at document body level - fixes mobile position issues
  return createPortal(modalContent, document.body);
}

// ============ SECTION HEADER ============
function SectionHeader({ 
  title, 
  subtitle 
}: { 
  title: string; 
  subtitle: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (isInView && !revealed) {
      setRevealed(true);
      audio.reveal();
    }
  }, [isInView, revealed]);

  return (
    <div ref={ref} className="text-center mb-8 md:mb-12 px-4">
      {/* Label */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={revealed ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="mb-4 md:mb-6"
      >
        <span className="inline-flex items-center gap-3 text-yellow-500 dark:text-yellow-400/70 text-xs tracking-widest uppercase">
          <motion.span 
            className="w-8 md:w-12 h-px bg-gradient-to-r from-transparent to-yellow-400"
            initial={{ scaleX: 0 }}
            animate={revealed ? { scaleX: 1 } : {}}
            transition={{ delay: 0.3, duration: 0.5 }}
          />
          {title}
          <motion.span 
            className="w-8 md:w-12 h-px bg-gradient-to-l from-transparent to-yellow-400"
            initial={{ scaleX: 0 }}
            animate={revealed ? { scaleX: 1 } : {}}
            transition={{ delay: 0.3, duration: 0.5 }}
          />
        </span>
      </motion.div>
      
      {/* Main title */}
      <motion.h2 
        className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white tracking-tight mb-4 md:mb-6"
        initial={{ opacity: 0, y: 30 }}
        animate={revealed ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.1, duration: 0.7 }}
      >
        Filosofi{' '}
        <span className="bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
          Logo
        </span>
      </motion.h2>
      
      {/* Subtitle */}
      <motion.p 
        className="text-gray-500 dark:text-[#b6bac5]/60 text-base md:text-lg max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={revealed ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        {subtitle}
      </motion.p>
    </div>
  );
}

// ============ SOUND TOGGLE ============
function SoundToggleButton() {
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
      className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[90] w-11 h-11 md:w-12 md:h-12 rounded-full bg-white dark:bg-white/10 shadow-lg border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-all"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
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
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);

  return (
    <>
      {/* SoundToggleButton removed - handled by GlobalFloatingControls in layout */}
      
      <section 
        ref={containerRef}
        id="filosofi"
        className="relative py-16 md:py-24 lg:py-32 overflow-hidden bg-gray-50 dark:bg-transparent"
        style={{ 
          position: 'relative' // Fix scroll offset warning
        }}
      >
        {/* Background - Dark mode only */}
        <div className="absolute inset-0 dark:block hidden">
          <motion.div 
            className="absolute inset-0 pointer-events-none"
            style={{ y: backgroundY }}
          >
            {/* Central glow */}
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]"
              style={{
                background: 'radial-gradient(circle, rgba(251,191,36,0.05) 0%, transparent 60%)'
              }}
            />
            
            {/* Grid */}
            <div 
              className="absolute inset-0 opacity-[0.015]"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)
                `,
                backgroundSize: '80px 80px'
              }}
            />
          </motion.div>
        </div>

        {/* Light mode background */}
        <div className="absolute inset-0 dark:hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-100/50 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-amber-100/50 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <SectionHeader title={sectionTitle} subtitle={sectionSubtitle} />

          {/* 3D Logo */}
          <Logo3D logoSrc={logoSrc} logoAlt={logoAlt} />

          {/* Divider */}
          <motion.div 
            className="flex items-center justify-center gap-4 py-8 md:py-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <motion.div 
              className="h-px w-16 md:w-20 bg-gradient-to-r from-transparent to-gray-300 dark:to-white/10"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
            />
            <motion.div 
              className="w-2 h-2 bg-yellow-400 rounded-full"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div 
              className="h-px w-16 md:w-20 bg-gradient-to-l from-transparent to-gray-300 dark:to-white/10"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
            />
          </motion.div>
        </div>

        {/* Elements Grid */}
        <ElementsGrid 
          elements={elements} 
          onElementClick={(element) => setSelectedElement(element)}
        />

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
