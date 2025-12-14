'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
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

// ============ SOUND UTILITY ============
const playSound = (type: 'hover' | 'click' | 'open' | 'close') => {
  if (typeof window === 'undefined') return;
  
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    switch (type) {
      case 'hover':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.06);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.08);
        break;
      case 'click':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.12);
        break;
      case 'open':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
        break;
      case 'close':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
        break;
    }
  } catch (e) {
    // Audio not supported
  }
};

// ============ ELEMENT CARD - Clean & Interactive ============
function ElementCard({ 
  element, 
  index,
  isActive,
  onClick
}: { 
  element: LogoElement; 
  index: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, amount: 0.2 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    playSound('hover');
  };

  const handleClick = () => {
    playSound('click');
    onClick();
  };

  return (
    <motion.div
      ref={cardRef}
      className="cursor-pointer"
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.1,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <motion.div 
        className={`
          relative p-6 md:p-8 rounded-2xl h-full
          transition-all duration-300
          ${isActive 
            ? 'bg-yellow-500/10 border-yellow-500/50' 
            : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.08] hover:border-white/20'
          }
          border backdrop-blur-sm
        `}
        whileHover={{ y: -6, scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Number badge */}
        <span className={`
          absolute top-4 right-4 text-xs font-mono
          ${isActive ? 'text-yellow-400' : 'text-white/20'}
        `}>
          0{index + 1}
        </span>

        {/* Icon */}
        <motion.div 
          className={`
            w-14 h-14 rounded-xl flex items-center justify-center mb-5
            transition-all duration-300
            ${isActive 
              ? 'bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg shadow-yellow-500/25' 
              : 'bg-white/10'
            }
          `}
          animate={{ 
            rotate: isHovered ? [0, -5, 5, 0] : 0,
            scale: isHovered ? 1.1 : 1
          }}
          transition={{ duration: 0.4 }}
        >
          <span className="text-2xl">{element.icon}</span>
        </motion.div>

        {/* Title */}
        <h3 className={`
          text-lg font-semibold mb-2 transition-colors duration-300
          ${isActive ? 'text-yellow-400' : 'text-white'}
        `}>
          {element.title}
        </h3>

        {/* Description */}
        <p className={`
          text-sm leading-relaxed transition-colors duration-300
          ${isActive ? 'text-white/80' : 'text-white/50'}
        `}>
          {element.description}
        </p>

        {/* Hover indicator */}
        <motion.div 
          className="mt-4 flex items-center gap-1 text-yellow-400 text-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
        >
          <span>Lihat detail</span>
          <motion.span 
            animate={{ x: isHovered ? [0, 4, 0] : 0 }}
            transition={{ repeat: Infinity, duration: 0.8 }}
          >
            →
          </motion.span>
        </motion.div>

        {/* Bottom accent */}
        <motion.div 
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-b-2xl"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isActive ? 1 : 0 }}
          style={{ transformOrigin: 'left' }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>
    </motion.div>
  );
}

// ============ DETAIL MODAL - Centered & Responsive ============
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
      playSound('open');
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    playSound('close');
    onClose();
  };

  if (!element) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div 
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
            onClick={handleClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          {/* Modal Content - Always centered */}
          <motion.div
            className="relative w-full max-w-xl bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl border border-white/10 overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              ✕
            </button>

            {/* Content */}
            <div className="p-8">
              {/* Header */}
              <div className="flex items-start gap-5 mb-6">
                <motion.div 
                  className={`w-16 h-16 rounded-xl ${element.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}
                  initial={{ rotate: -10, scale: 0.8 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <span className="text-3xl">{element.icon}</span>
                </motion.div>
                <div>
                  <motion.h3 
                    className="text-2xl font-bold text-white"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    {element.title}
                  </motion.h3>
                  <motion.div 
                    className="h-0.5 w-12 mt-2 rounded bg-gradient-to-r from-yellow-400 to-amber-500"
                    initial={{ width: 0 }}
                    animate={{ width: 48 }}
                    transition={{ delay: 0.25, duration: 0.4 }}
                  />
                </div>
              </div>

              {/* Description */}
              <motion.p 
                className="text-white/70 leading-relaxed mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {element.description}
              </motion.p>

              {/* Extra info */}
              <motion.div 
                className="bg-white/5 rounded-xl p-5 border border-white/5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-white/50 text-sm leading-relaxed">
                  Elemen ini merupakan bagian integral dari identitas visual OSIS SMK Informatika, 
                  mencerminkan nilai-nilai dan visi organisasi dalam membentuk generasi pemimpin masa depan.
                </p>
              </motion.div>

              {/* Close button */}
              <motion.button
                onClick={handleClose}
                className="mt-6 w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-gray-900 font-semibold rounded-xl hover:from-yellow-400 hover:to-amber-400 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
              >
                Tutup
              </motion.button>
            </div>

            {/* Decorative */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-yellow-500/10 to-transparent pointer-events-none" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============ LOGO DISPLAY - Simple & Clean ============
function LogoDisplay({ 
  logoSrc, 
  logoAlt 
}: { 
  logoSrc: string; 
  logoAlt: string;
}) {
  const logoRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(logoRef, { once: true, amount: 0.5 });
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div 
      ref={logoRef}
      className="relative flex justify-center items-center py-16 md:py-20"
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Background glow */}
      <motion.div 
        className="absolute w-80 h-80 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(251,191,36,0.1) 0%, transparent 70%)'
        }}
        animate={{ 
          scale: isHovered ? 1.2 : 1,
          opacity: isHovered ? 1 : 0.6
        }}
        transition={{ duration: 0.5 }}
      />

      {/* Rotating ring */}
      <motion.div 
        className="absolute w-72 h-72 border border-white/5 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      />

      {/* Logo */}
      <motion.div
        className="relative w-44 h-44 md:w-56 md:h-56 cursor-pointer"
        onMouseEnter={() => {
          setIsHovered(true);
          playSound('hover');
        }}
        onMouseLeave={() => setIsHovered(false)}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        whileHover={{ scale: 1.05 }}
      >
        <Image
          src={logoSrc}
          alt={logoAlt}
          fill
          className="object-contain"
          priority
        />
      </motion.div>

      {/* Label */}
      <motion.p 
        className="absolute -bottom-2 text-white/30 text-xs tracking-widest uppercase"
        animate={{ opacity: isHovered ? 0 : 1 }}
      >
        Logo OSIS
      </motion.p>
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
  const [selectedElement, setSelectedElement] = useState<LogoElement | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.6, 1, 1, 0.6]);

  const handleElementClick = (element: LogoElement, index: number) => {
    setSelectedElement(element);
    setActiveIndex(index);
  };

  return (
    <section 
      ref={containerRef}
      className="relative py-20 md:py-32 bg-gradient-to-b from-gray-900 via-[#0a0a0a] to-gray-900 overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Gradient orb */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]"
          style={{
            background: 'radial-gradient(circle, rgba(251,191,36,0.05) 0%, transparent 60%)'
          }}
        />
        
        {/* Grid */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      <motion.div 
        className="relative z-10 max-w-6xl mx-auto px-4 md:px-6"
        style={{ opacity }}
      >
        {/* Section Header */}
        <motion.div 
          className="text-center mb-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.span 
            className="inline-block text-yellow-500/80 text-xs font-medium tracking-[0.3em] uppercase mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            {sectionTitle}
          </motion.span>
          
          <motion.h2
            className="text-4xl md:text-5xl lg:text-6xl font-light text-white tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Filosofi{' '}
            <span className="font-semibold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
              Logo
            </span>
          </motion.h2>
          
          <motion.p 
            className="mt-4 text-white/40 max-w-xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            {sectionSubtitle}
          </motion.p>
        </motion.div>

        {/* Logo */}
        <LogoDisplay logoSrc={logoSrc} logoAlt={logoAlt} />

        {/* Divider */}
        <motion.div 
          className="flex items-center justify-center gap-3 py-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-white/20" />
          <div className="w-2 h-2 bg-yellow-500/50 rounded-full" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-white/20" />
        </motion.div>

        {/* Label */}
        <motion.p 
          className="text-center text-white/30 text-sm mb-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Klik untuk melihat detail
        </motion.p>

        {/* Elements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {elements.map((element, index) => (
            <ElementCard 
              key={index}
              element={element}
              index={index}
              isActive={activeIndex === index}
              onClick={() => handleElementClick(element, index)}
            />
          ))}
        </div>

        {/* Bottom accent */}
        <motion.div 
          className="mt-16 flex justify-center gap-2"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-yellow-500/30"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.1 }}
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
  );
}
