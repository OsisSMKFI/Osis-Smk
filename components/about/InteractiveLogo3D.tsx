'use client';

import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
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

// Minimalist Element Card - Igloo.inc style
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
  const isInView = useInView(cardRef, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={cardRef}
      className="group cursor-pointer"
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
      transition={{ 
        duration: 0.8, 
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1]
      }}
      onClick={onClick}
    >
      <motion.div 
        className={`
          relative p-8 rounded-2xl transition-all duration-500
          ${isActive 
            ? 'bg-gradient-to-br from-yellow-500/20 to-amber-500/10 border-yellow-500/50' 
            : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.05] hover:border-white/10'
          }
          border backdrop-blur-sm
        `}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3 }}
      >
        {/* Number indicator */}
        <div className="absolute top-6 right-6">
          <span className={`
            text-xs font-mono tracking-wider
            ${isActive ? 'text-yellow-400' : 'text-white/20'}
          `}>
            0{index + 1}
          </span>
        </div>

        {/* Icon */}
        <motion.div 
          className={`
            w-14 h-14 rounded-xl flex items-center justify-center mb-6
            transition-all duration-500
            ${isActive 
              ? 'bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg shadow-yellow-500/20' 
              : 'bg-white/5 group-hover:bg-white/10'
            }
          `}
        >
          <span className="text-2xl">{element.icon}</span>
        </motion.div>

        {/* Title */}
        <h3 className={`
          text-lg font-semibold mb-3 transition-colors duration-300
          ${isActive ? 'text-yellow-400' : 'text-white group-hover:text-white/90'}
        `}>
          {element.title}
        </h3>

        {/* Description - Always visible */}
        <p className={`
          text-sm leading-relaxed transition-colors duration-300
          ${isActive ? 'text-white/80' : 'text-white/40 group-hover:text-white/60'}
        `}>
          {element.description}
        </p>

        {/* Active indicator line */}
        <motion.div 
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-400 to-amber-500"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isActive ? 1 : 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: 'left' }}
        />
      </motion.div>
    </motion.div>
  );
}

// Detail Panel - Expanded view when element is clicked
function DetailPanel({ 
  element, 
  isOpen, 
  onClose 
}: { 
  element: LogoElement | null; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  if (!element) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div 
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          {/* Content */}
          <motion.div
            className="relative w-full max-w-2xl"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ 
              duration: 0.5, 
              ease: [0.22, 1, 0.36, 1]
            }}
          >
            {/* Close button */}
            <motion.button
              onClick={onClose}
              className="absolute -top-12 right-0 text-white/40 hover:text-white text-sm flex items-center gap-2 transition-colors"
              whileHover={{ x: 4 }}
            >
              Tutup <span className="text-lg">×</span>
            </motion.button>

            {/* Card */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-3xl p-8 md:p-12 border border-white/10 overflow-hidden relative">
              {/* Header */}
              <div className="flex items-start gap-6 mb-8">
                <motion.div 
                  className={`w-20 h-20 rounded-2xl ${element.gradient} flex items-center justify-center shadow-2xl flex-shrink-0`}
                  initial={{ rotate: -10, scale: 0.8 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                  <span className="text-4xl">{element.icon}</span>
                </motion.div>
                <div>
                  <motion.h2 
                    className="text-2xl md:text-3xl font-bold text-white mb-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    {element.title}
                  </motion.h2>
                  <motion.div 
                    className="h-1 w-12 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500"
                    initial={{ width: 0 }}
                    animate={{ width: 48 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Description */}
              <motion.p 
                className="text-lg text-white/70 leading-relaxed mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                {element.description}
              </motion.p>

              {/* Additional context */}
              <motion.div 
                className="bg-white/5 rounded-2xl p-6 border border-white/5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <p className="text-white/50 text-sm leading-relaxed">
                  Elemen ini merupakan bagian integral dari identitas visual OSIS SMK Informatika, 
                  mencerminkan nilai-nilai dan visi organisasi dalam membentuk generasi pemimpin masa depan.
                </p>
              </motion.div>

              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-bl-full pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-amber-500/10 to-transparent rounded-tr-full pointer-events-none" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Minimalist Logo Display
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
      className="relative flex justify-center items-center py-16 md:py-24"
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 1 }}
    >
      {/* Subtle background glow */}
      <motion.div 
        className="absolute w-[400px] h-[400px] bg-yellow-500/5 rounded-full blur-3xl"
        animate={{ 
          scale: isHovered ? 1.2 : 1,
          opacity: isHovered ? 0.1 : 0.05
        }}
        transition={{ duration: 0.8 }}
      />

      {/* Logo container */}
      <motion.div
        className="relative cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
        transition={{ 
          duration: 1.2,
          ease: [0.22, 1, 0.36, 1]
        }}
      >
        {/* Rotating ring - subtle */}
        <motion.div 
          className="absolute -inset-8 border border-white/[0.05] rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Logo */}
        <motion.div 
          className="relative w-48 h-48 md:w-64 md:h-64"
          animate={{ 
            scale: isHovered ? 1.05 : 1,
            rotate: isHovered ? 3 : 0
          }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src={logoSrc}
            alt={logoAlt}
            fill
            className="object-contain"
            priority
          />
        </motion.div>

        {/* Hover hint */}
        <motion.p 
          className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-white/30 text-xs tracking-wider uppercase whitespace-nowrap"
          animate={{ opacity: isHovered ? 0 : 1 }}
        >
          Logo OSIS
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

// Section Divider
function SectionDivider() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <motion.div 
      ref={ref}
      className="flex items-center justify-center gap-4 py-8"
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
    >
      <motion.div 
        className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent w-full max-w-xs"
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
      />
      <motion.span 
        className="text-yellow-400/50 text-xs"
        initial={{ scale: 0 }}
        animate={isInView ? { scale: 1 } : { scale: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        ◆
      </motion.span>
      <motion.div 
        className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent w-full max-w-xs"
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
      />
    </motion.div>
  );
}

// Main Component - Minimalist & Elegant
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

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  const handleElementClick = (element: LogoElement, index: number) => {
    setSelectedElement(element);
    setActiveIndex(index);
  };

  return (
    <section 
      ref={containerRef}
      className="relative py-24 md:py-40 bg-[#0a0a0a] overflow-hidden"
    >
      {/* Subtle background */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        style={{ y: backgroundY }}
      >
        {/* Gradient orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-yellow-900/10 via-transparent to-transparent rounded-full blur-3xl" />
        
        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
        }} />
      </motion.div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Section Header - Minimal */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.span 
            className="inline-block text-yellow-500/70 text-xs font-medium tracking-[0.3em] uppercase mb-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            {sectionTitle}
          </motion.span>
          
          <motion.h2
            className="text-4xl md:text-6xl lg:text-7xl font-light text-white tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Filosofi{' '}
            <span className="font-semibold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
              Logo
            </span>
          </motion.h2>
          
          <motion.p 
            className="mt-6 text-white/40 max-w-xl mx-auto text-lg font-light"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            {sectionSubtitle}
          </motion.p>
        </motion.div>

        {/* Logo Display */}
        <LogoDisplay logoSrc={logoSrc} logoAlt={logoAlt} />

        {/* Divider */}
        <SectionDivider />

        {/* Elements Label */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <span className="text-white/30 text-sm tracking-wider uppercase">
            Makna Setiap Elemen
          </span>
        </motion.div>

        {/* Elements Grid - Clean layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
          className="mt-20 flex justify-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-2">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-yellow-500/30"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + i * 0.1 }}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Detail Panel */}
      <DetailPanel 
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
