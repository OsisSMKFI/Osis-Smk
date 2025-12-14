'use client';

import React, { useRef, useState, useEffect, Suspense } from 'react';
import { motion, useScroll, useTransform, useInView, useSpring, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import dynamic from 'next/dynamic';

// Dynamic 3D imports
const Canvas = dynamic(
  () => import('@react-three/fiber').then(mod => mod.Canvas),
  { ssr: false }
);

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

// 3D Logo Scene Component
function Logo3DScene({ onHover }: { onHover: (hovering: boolean) => void }) {
  return (
    <mesh 
      onPointerEnter={() => onHover(true)}
      onPointerLeave={() => onHover(false)}
    >
      <boxGeometry args={[2, 2, 0.1]} />
      <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
    </mesh>
  );
}

// Interactive Element Card with full details
function InteractiveCard({ 
  element, 
  index,
  isExpanded,
  onExpand,
  onPlaySound
}: { 
  element: LogoElement; 
  index: number;
  isExpanded: boolean;
  onExpand: () => void;
  onPlaySound: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, amount: 0.2 });
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    onPlaySound();
    onExpand();
  };

  return (
    <motion.div
      ref={cardRef}
      className="relative cursor-pointer"
      initial={{ opacity: 0, y: 80, rotateX: -20 }}
      animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 80, rotateX: -20 }}
      transition={{ 
        duration: 0.8, 
        delay: index * 0.12,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      style={{ perspective: '1200px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      whileHover={{ scale: 1.02, y: -8 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Glow effect */}
      <motion.div 
        className={`absolute -inset-3 rounded-3xl blur-2xl ${element.gradient}`}
        animate={{ opacity: isHovered ? 0.4 : 0 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Main Card */}
      <motion.div 
        className="relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-2xl rounded-2xl p-6 md:p-8 border border-white/10 overflow-hidden h-full"
        animate={{ 
          borderColor: isHovered ? 'rgba(251, 191, 36, 0.5)' : 'rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Animated background gradient */}
        <motion.div 
          className={`absolute inset-0 ${element.gradient}`}
          animate={{ opacity: isHovered ? 0.15 : 0.05 }}
          transition={{ duration: 0.3 }}
        />

        {/* Floating particles */}
        {isHovered && (
          <>
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full"
                initial={{ 
                  x: '50%', 
                  y: '50%', 
                  opacity: 0,
                  scale: 0 
                }}
                animate={{ 
                  x: `${20 + Math.random() * 60}%`,
                  y: `${20 + Math.random() * 60}%`,
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </>
        )}

        {/* Icon with 3D transform */}
        <motion.div 
          className={`relative w-20 h-20 mb-6 rounded-2xl ${element.gradient} flex items-center justify-center shadow-2xl`}
          animate={{ 
            rotateY: isHovered ? 15 : 0,
            rotateX: isHovered ? -10 : 0,
            scale: isHovered ? 1.1 : 1
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <span className="text-4xl" style={{ transform: 'translateZ(10px)' }}>
            {element.icon}
          </span>
          {/* Icon shadow/reflection */}
          <div className={`absolute inset-0 rounded-2xl ${element.gradient} blur-lg opacity-50`} />
        </motion.div>

        {/* Content */}
        <div className="relative z-10">
          <motion.h3 
            className="text-xl md:text-2xl font-bold text-white mb-3"
            animate={{ color: isHovered ? '#fbbf24' : '#ffffff' }}
          >
            {element.title}
          </motion.h3>

          <motion.p 
            className="text-gray-400 leading-relaxed text-sm md:text-base"
            animate={{ color: isHovered ? '#d1d5db' : '#9ca3af' }}
          >
            {element.description}
          </motion.p>

          {/* Click hint */}
          <motion.div 
            className="mt-4 flex items-center gap-2 text-yellow-400 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
          >
            <span>Klik untuk detail</span>
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              →
            </motion.span>
          </motion.div>
        </div>

        {/* Bottom accent line */}
        <motion.div 
          className={`absolute bottom-0 left-0 h-1.5 ${element.gradient}`}
          initial={{ width: 0 }}
          animate={{ width: isInView ? '100%' : 0 }}
          transition={{ duration: 1, delay: index * 0.12 + 0.5 }}
        />

        {/* Corner accent */}
        <div className={`absolute top-0 right-0 w-20 h-20 ${element.gradient} opacity-10 rounded-bl-full`} />
      </motion.div>
    </motion.div>
  );
}

// Element Detail Modal
function ElementModal({ 
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          {/* Modal Content */}
          <motion.div
            className="relative max-w-lg w-full bg-gray-900 rounded-3xl p-8 border border-white/10 overflow-hidden"
            initial={{ scale: 0.8, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 50, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
          >
            {/* Background gradient */}
            <div className={`absolute inset-0 ${element.gradient} opacity-10`} />
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              ✕
            </button>

            {/* Icon */}
            <motion.div 
              className={`w-24 h-24 mb-6 rounded-3xl ${element.gradient} flex items-center justify-center shadow-2xl mx-auto`}
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-5xl">{element.icon}</span>
            </motion.div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-white text-center mb-4">
              {element.title}
            </h2>

            {/* Description */}
            <p className="text-gray-300 text-center text-lg leading-relaxed mb-6">
              {element.description}
            </p>

            {/* Additional info */}
            <div className="bg-white/5 rounded-2xl p-4 text-center">
              <p className="text-gray-400 text-sm">
                Elemen ini merupakan bagian penting dari identitas OSIS SMK Informatika yang mencerminkan komitmen kami terhadap nilai-nilai organisasi.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Interactive Logo with 3D effects
function InteractiveLogo({ 
  logoSrc, 
  logoAlt,
  onPlaySound 
}: { 
  logoSrc: string; 
  logoAlt: string;
  onPlaySound: () => void;
}) {
  const logoRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(logoRef, { once: true, amount: 0.3 });
  const [isHovered, setIsHovered] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!logoRef.current) return;
    const rect = logoRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rotateX = (e.clientY - centerY) / 10;
    const rotateY = (e.clientX - centerX) / 10;
    setRotation({ x: -rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const handleClick = () => {
    onPlaySound();
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 3000);
  };

  return (
    <motion.div 
      ref={logoRef}
      className="relative flex justify-center items-center cursor-pointer"
      initial={{ opacity: 0, scale: 0.5, rotateY: 180 }}
      animate={isInView ? { 
        opacity: 1, 
        scale: 1, 
        rotateY: 0 
      } : { 
        opacity: 0, 
        scale: 0.5, 
        rotateY: 180 
      }}
      transition={{ 
        duration: 1.5,
        type: 'spring',
        stiffness: 80,
        damping: 15
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{ perspective: '1000px' }}
    >
      <motion.div 
        className="relative"
        animate={{
          rotateX: rotation.x,
          rotateY: rotation.y,
          scale: isHovered ? 1.1 : 1
        }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Outer glow rings */}
        <motion.div 
          className="absolute -inset-20 border-2 border-yellow-400/30 rounded-full"
          animate={{ rotate: 360, scale: isHovered ? 1.1 : 1 }}
          transition={{ rotate: { duration: 20, repeat: Infinity, ease: 'linear' } }}
        />
        <motion.div 
          className="absolute -inset-28 border border-yellow-400/20 rounded-full"
          animate={{ rotate: -360, scale: isHovered ? 1.15 : 1 }}
          transition={{ rotate: { duration: 30, repeat: Infinity, ease: 'linear' } }}
        />
        <motion.div 
          className="absolute -inset-36 border border-yellow-400/10 rounded-full"
          animate={{ rotate: 180, scale: isHovered ? 1.2 : 1 }}
          transition={{ rotate: { duration: 40, repeat: Infinity, ease: 'linear' } }}
        />
        
        {/* Logo glow */}
        <motion.div 
          className="absolute -inset-8 bg-gradient-radial from-yellow-400/30 via-yellow-400/10 to-transparent rounded-full blur-2xl"
          animate={{ scale: isHovered ? 1.3 : 1, opacity: isHovered ? 0.8 : 0.5 }}
        />
        
        {/* Logo image */}
        <div className="relative w-56 h-56 md:w-72 md:h-72">
          <Image
            src={logoSrc}
            alt={logoAlt}
            fill
            className="object-contain drop-shadow-2xl"
            priority
          />
        </div>
        
        {/* Floating particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2.5 h-2.5 bg-yellow-400 rounded-full"
            style={{ left: '50%', top: '50%' }}
            animate={{
              x: [0, Math.cos(i * 45 * Math.PI / 180) * (isHovered ? 140 : 120)],
              y: [0, Math.sin(i * 45 * Math.PI / 180) * (isHovered ? 140 : 120)],
              opacity: [0, 1, 0],
              scale: [0, 1.2, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.4,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Interactive hint */}
        <motion.div 
          className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-yellow-400 text-sm font-medium whitespace-nowrap"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: isHovered ? 1 : 0.5, y: 0 }}
        >
          {isHovered ? '✨ Klik untuk info lebih lanjut' : '👆 Hover & klik logo'}
        </motion.div>
      </motion.div>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            className="absolute -bottom-32 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-xl shadow-2xl z-10"
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
          >
            <p className="text-sm">Logo OSIS SMK Informatika - Dirgantara 2025</p>
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-800 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Main Component
export default function InteractiveLogo3D({ 
  logoSrc, 
  logoAlt, 
  sectionTitle, 
  sectionSubtitle,
  elements 
}: InteractiveLogoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedElement, setSelectedElement] = useState<LogoElement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sound effect function
  const playSound = () => {
    if (typeof window !== 'undefined' && window.AudioContext) {
      try {
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(900, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      } catch (e) {
        // Audio not supported
      }
    }
  };

  const handleExpandElement = (element: LogoElement) => {
    setSelectedElement(element);
    setIsModalOpen(true);
  };

  return (
    <section 
      ref={containerRef}
      className="relative py-20 md:py-32 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Animated gradient orbs */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.15, 0.1, 0.15]
          }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-3xl"
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(251, 191, 36, 0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(251, 191, 36, 0.4) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.span 
            className="inline-flex items-center gap-3 text-yellow-400 text-sm font-medium tracking-widest uppercase mb-4"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <span className="w-12 h-px bg-gradient-to-r from-transparent to-yellow-400" />
            ✨ {sectionTitle}
            <span className="w-12 h-px bg-gradient-to-l from-transparent to-yellow-400" />
          </motion.span>
          <motion.h2
            className="text-3xl md:text-5xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            Filosofi <span className="text-yellow-400">Logo</span>
          </motion.h2>
          <motion.p 
            className="text-gray-400 max-w-2xl mx-auto text-lg"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            {sectionSubtitle}
          </motion.p>
        </motion.div>

        {/* Interactive Logo */}
        <div className="mb-20 md:mb-28">
          <InteractiveLogo 
            logoSrc={logoSrc} 
            logoAlt={logoAlt} 
            onPlaySound={playSound}
          />
        </div>

        {/* Elements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {elements.map((element, index) => (
            <InteractiveCard 
              key={index}
              element={element}
              index={index}
              isExpanded={selectedElement === element}
              onExpand={() => handleExpandElement(element)}
              onPlaySound={playSound}
            />
          ))}
        </div>
      </div>

      {/* Element Detail Modal */}
      <ElementModal 
        element={selectedElement}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  );
}
