'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';

interface PageOpeningProps {
  children: React.ReactNode;
  variant?: 'fade' | 'slide' | 'zoom' | 'reveal' | 'curtain';
  duration?: number;
  delay?: number;
  showLogo?: boolean;
}

// Full page opening animation
export function PageOpening({ 
  children, 
  variant = 'reveal',
  duration = 0.8,
  delay = 0.2,
  showLogo = false
}: PageOpeningProps) {
  const [isLoading, setIsLoading] = useState(showLogo);

  useEffect(() => {
    if (showLogo) {
      const timer = setTimeout(() => setIsLoading(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [showLogo]);

  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slide: {
      initial: { opacity: 0, y: 50 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -50 },
    },
    zoom: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 1.1 },
    },
    reveal: {
      initial: { opacity: 0, y: 30, filter: 'blur(10px)' },
      animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
      exit: { opacity: 0, y: -30, filter: 'blur(10px)' },
    },
    curtain: {
      initial: { clipPath: 'inset(0 0 100% 0)' },
      animate: { clipPath: 'inset(0 0 0% 0)' },
      exit: { clipPath: 'inset(100% 0 0 0)' },
    },
  };

  const selectedVariant = variants[variant];

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="relative"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-24 h-24 rounded-full border-4 border-transparent border-t-yellow-400 border-r-yellow-400"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <span className="text-4xl">🏫</span>
            </motion.div>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={selectedVariant.initial}
          animate={selectedVariant.animate}
          exit={selectedVariant.exit}
          transition={{ 
            duration, 
            delay,
            ease: [0.25, 0.1, 0.25, 1]
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Section reveal animation
interface SectionRevealProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  className?: string;
}

export function SectionReveal({ 
  children, 
  direction = 'up', 
  delay = 0,
  className = ''
}: SectionRevealProps) {
  const directionVariants = {
    up: { y: 60, opacity: 0 },
    down: { y: -60, opacity: 0 },
    left: { x: 60, opacity: 0 },
    right: { x: -60, opacity: 0 },
  };

  return (
    <motion.div
      initial={directionVariants[direction]}
      whileInView={{ x: 0, y: 0, opacity: 1 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ 
        duration: 0.7, 
        delay,
        type: 'spring',
        stiffness: 100,
        damping: 20
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Interactive 3D Card with tilt effect
interface Interactive3DCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  glare?: boolean;
  scale?: number;
  borderGlow?: boolean;
  onClick?: () => void;
}

export function Interactive3DCard({
  children,
  className = '',
  intensity = 15,
  glare = true,
  scale = 1.02,
  borderGlow = true,
  onClick
}: Interactive3DCardProps) {
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  const rotateXSpring = useSpring(rotateX, { stiffness: 300, damping: 30 });
  const rotateYSpring = useSpring(rotateY, { stiffness: 300, damping: 30 });
  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const el = cardRef.current;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;
      rotateX.set((mouseY / (rect.height / 2)) * -intensity);
      rotateY.set((mouseX / (rect.width / 2)) * intensity);
      glareX.set(((e.clientX - rect.left) / rect.width) * 100);
      glareY.set(((e.clientY - rect.top) / rect.height) * 100);
    });
  }, [intensity, rotateX, rotateY, glareX, glareY]);

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rotateX.set(0);
    rotateY.set(0);
    glareX.set(50);
    glareY.set(50);
  }, [rotateX, rotateY, glareX, glareY]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <motion.div
      ref={cardRef}
      className={`relative cursor-pointer ${className}`}
      style={{ perspective: '1000px' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.div
        style={{
          rotateX: rotateXSpring,
          rotateY: rotateYSpring,
          transformStyle: 'preserve-3d',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full h-full"
      >
        {/* Border glow effect */}
        {borderGlow && (
          <div
            className="absolute -inset-[2px] rounded-[inherit] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: `linear-gradient(45deg, rgba(250,204,21,0.5), rgba(59,130,246,0.5), rgba(168,85,247,0.5))`,
              filter: 'blur(8px)',
            }}
          />
        )}
        
        {/* Card content */}
        <div className="relative z-10 w-full h-full">
          {children}
        </div>
        
        {/* Glare overlay - static subtle highlight */}
        {glare && (
          <div
            className="absolute inset-0 pointer-events-none rounded-[inherit] overflow-hidden"
            style={{
              background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2) 0%, transparent 60%)`,
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
}

// Floating 3D element
interface Floating3DElementProps {
  children: React.ReactNode;
  amplitude?: number;
  frequency?: number;
  rotateRange?: number;
  className?: string;
}

export function Floating3DElement({
  children,
  amplitude = 10,
  frequency = 3,
  rotateRange = 5,
  className = ''
}: Floating3DElementProps) {
  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -amplitude, 0, amplitude, 0],
        rotateX: [0, rotateRange, 0, -rotateRange, 0],
        rotateY: [0, -rotateRange, 0, rotateRange, 0],
      }}
      transition={{
        duration: frequency,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
    >
      {children}
    </motion.div>
  );
}

// Magnetic button/element
interface MagneticElementProps {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}

export function MagneticElement({
  children,
  strength = 0.3,
  className = ''
}: MagneticElementProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const xSpring = useSpring(x, { stiffness: 350, damping: 15 });
  const ySpring = useSpring(y, { stiffness: 350, damping: 15 });
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const el = ref.current;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      x.set((e.clientX - centerX) * strength);
      y.set((e.clientY - centerY) * strength);
    });
  };

  const handleMouseLeave = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    x.set(0);
    y.set(0);
  };

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: xSpring, y: ySpring }}
    >
      {children}
    </motion.div>
  );
}

// Counter animation
interface AnimatedCounterProps {
  from?: number;
  to: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export function AnimatedCounter({
  from = 0,
  to,
  duration = 2,
  suffix = '',
  prefix = '',
  className = ''
}: AnimatedCounterProps) {
  const [count, setCount] = useState(from);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (hasAnimated) return;
    
    const startTime = Date.now();
    const endTime = startTime + duration * 1000;
    
    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / (duration * 1000), 1);
      
      // Easing function (ease out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(from + (to - from) * eased);
      
      setCount(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setHasAnimated(true);
      }
    };
    
    requestAnimationFrame(animate);
  }, [from, to, duration, hasAnimated]);

  return (
    <span className={className}>
      {prefix}{count}{suffix}
    </span>
  );
}

// Stagger children animation
interface StaggerChildrenProps {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}

export function StaggerChildren({
  children,
  staggerDelay = 0.1,
  className = ''
}: StaggerChildrenProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 30, scale: 0.95 },
            visible: {
              opacity: 1,
              y: 0,
              scale: 1,
              transition: {
                type: 'spring',
                stiffness: 100,
                damping: 15,
              },
            },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

// Parallax scroll container
interface ParallaxSectionProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

export function ParallaxSection({
  children,
  speed = 0.5,
  className = ''
}: ParallaxSectionProps) {
  return (
    <motion.div
      className={className}
      initial={{ y: 0 }}
      whileInView={{ y: 0 }}
      viewport={{ once: false }}
      style={{
        willChange: 'transform',
      }}
      transition={{
        type: 'tween',
        ease: 'linear',
      }}
    >
      {children}
    </motion.div>
  );
}

// Glow effect wrapper
interface GlowWrapperProps {
  children: React.ReactNode;
  color?: string;
  intensity?: number;
  className?: string;
}

export function GlowWrapper({
  children,
  color = 'rgba(250, 204, 21, 0.5)',
  intensity = 20,
  className = ''
}: GlowWrapperProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <motion.div
        className="absolute inset-0 rounded-[inherit] opacity-0"
        whileHover={{ opacity: 1 }}
        style={{
          boxShadow: `0 0 ${intensity}px ${intensity / 2}px ${color}`,
        }}
        transition={{ duration: 0.3 }}
      />
      {children}
    </motion.div>
  );
}

// Text gradient animation
interface AnimatedGradientTextProps {
  text: string;
  className?: string;
  colors?: string[];
}

export function AnimatedGradientText({
  text,
  className = '',
  colors = ['#fbbf24', '#f59e0b', '#d97706', '#f59e0b', '#fbbf24']
}: AnimatedGradientTextProps) {
  return (
    <motion.span
      className={`bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: `linear-gradient(90deg, ${colors.join(', ')})`,
        backgroundSize: '200% 100%',
      }}
      animate={{
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      {text}
    </motion.span>
  );
}
