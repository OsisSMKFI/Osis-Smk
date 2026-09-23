'use client';

import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView, useMotionValue, MotionValue, type Variants } from 'framer-motion';

// Custom easing as tuple for TypeScript
const customEase: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

// Smooth scroll parallax hook
export function useParallax(value: MotionValue<number>, distance: number) {
  return useTransform(value, [0, 1], [-distance, distance]);
}

// Text reveal animation - character by character
interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;
  staggerDelay?: number;
}

export function TextReveal({ text, className = '', delay = 0, staggerDelay = 0.03 }: TextRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay,
      },
    },
  };

  const childVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      rotateX: -90,
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        type: 'spring' as const,
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <motion.span
      ref={ref}
      className={`inline-block ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      style={{ perspective: '1000px' }}
    >
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          variants={childVariants}
          className="inline-block"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.span>
  );
}

// Word by word reveal
interface WordRevealProps {
  text: string;
  className?: string;
  delay?: number;
  highlightWords?: string[];
  highlightClassName?: string;
}

export function WordReveal({ 
  text, 
  className = '', 
  delay = 0,
  highlightWords = [],
  highlightClassName = 'text-yellow-500'
}: WordRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const words = text.split(' ');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: delay,
      },
    },
  };

  const wordVariants: Variants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      filter: 'blur(10px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.5,
        ease: customEase,
      },
    },
  };

  return (
    <motion.span
      ref={ref}
      className={`inline ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      {words.map((word, index) => {
        const isHighlight = highlightWords.some(hw => 
          word.toLowerCase().includes(hw.toLowerCase())
        );
        return (
          <motion.span
            key={index}
            variants={wordVariants}
            className={`inline-block mr-2 ${isHighlight ? highlightClassName : ''}`}
          >
            {word}
          </motion.span>
        );
      })}
    </motion.span>
  );
}

// Scroll-triggered section with parallax
interface ScrollSectionProps {
  children: React.ReactNode;
  className?: string;
  parallaxOffset?: number;
}

export function ScrollSection({ children, className = '', parallaxOffset = 50 }: ScrollSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 0.5, 1], [parallaxOffset, 0, -parallaxOffset]);
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        y: smoothY,
      }}
    >
      {children}
    </motion.div>
  );
}

// Counter animation
interface CounterProps {
  from?: number;
  to: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export function Counter({ 
  from = 0, 
  to, 
  duration = 2, 
  suffix = '', 
  prefix = '',
  className = '' 
}: CounterProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const [count, setCount] = useState(from);

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      
      // Easing function
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(from + (to - from) * easeOutQuart);
      
      setCount(currentCount);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [isInView, from, to, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}{count}{suffix}
    </span>
  );
}

// Magnetic button effect
interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}

export function MagneticButton({ children, className = '', strength = 0.3 }: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const xSpring = useSpring(x, { stiffness: 150, damping: 15 });
  const ySpring = useSpring(y, { stiffness: 150, damping: 15 });
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

// Reveal on scroll with different directions
interface RevealProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade';
  delay?: number;
  duration?: number;
  className?: string;
}

export function Reveal({ 
  children, 
  direction = 'up', 
  delay = 0, 
  duration = 0.6,
  className = '' 
}: RevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const getInitialState = () => {
    switch (direction) {
      case 'up': return { opacity: 0, y: 60 };
      case 'down': return { opacity: 0, y: -60 };
      case 'left': return { opacity: 0, x: -60 };
      case 'right': return { opacity: 0, x: 60 };
      case 'scale': return { opacity: 0, scale: 0.8 };
      case 'fade': return { opacity: 0 };
      default: return { opacity: 0, y: 60 };
    }
  };

  const getFinalState = () => {
    switch (direction) {
      case 'up':
      case 'down': return { opacity: 1, y: 0 };
      case 'left':
      case 'right': return { opacity: 1, x: 0 };
      case 'scale': return { opacity: 1, scale: 1 };
      case 'fade': return { opacity: 1 };
      default: return { opacity: 1, y: 0 };
    }
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={getInitialState()}
      animate={isInView ? getFinalState() : getInitialState()}
      transition={{
        duration,
        delay,
        ease: customEase,
      }}
    >
      {children}
    </motion.div>
  );
}

// Stagger children animation
interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  delay?: number;
}

export function StaggerContainer({ 
  children, 
  className = '', 
  staggerDelay = 0.1,
  delay = 0 
}: StaggerContainerProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string 
}) {
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: customEase,
      },
    },
  };

  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}

// Cursor follower effect
export function CursorFollower() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`;
        cursorRef.current.style.top = `${e.clientY}px`;
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, [data-cursor-hover]')) {
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
  }, []);

  return (
    <motion.div
      ref={cursorRef}
      className="fixed pointer-events-none z-[9999] hidden lg:block"
      style={{ transform: 'translate(-50%, -50%)' }}
      animate={{
        width: isHovering ? 60 : 20,
        height: isHovering ? 60 : 20,
        backgroundColor: isHovering ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.5)',
        borderColor: isHovering ? 'rgba(251, 191, 36, 0.8)' : 'rgba(251, 191, 36, 0.3)',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="w-full h-full rounded-full border-2 backdrop-blur-sm" />
    </motion.div>
  );
}

// Horizontal scroll section
interface HorizontalScrollProps {
  children: React.ReactNode;
  className?: string;
}

export function HorizontalScroll({ children, className = '' }: HorizontalScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-75%']);

  return (
    <div ref={containerRef} className={`relative h-[300vh] ${className}`}>
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <motion.div style={{ x }} className="flex gap-8">
          {children}
        </motion.div>
      </div>
    </div>
  );
}

// Floating element with mouse interaction
interface FloatingElementProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}

export function FloatingElement({ children, className = '', intensity = 20 }: FloatingElementProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const rotateXSpring = useSpring(rotateX, { stiffness: 100, damping: 15 });
  const rotateYSpring = useSpring(rotateY, { stiffness: 100, damping: 15 });
  const rafRef = useRef<number>(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const el = ref.current;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const percentX = (e.clientX - centerX) / (rect.width / 2);
      const percentY = (e.clientY - centerY) / (rect.height / 2);
      rotateX.set(-percentY * intensity);
      rotateY.set(percentX * intensity);
    });
  };

  const handleMouseLeave = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rotateX.set(0);
    rotateY.set(0);
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
      style={{
        rotateX: rotateXSpring,
        rotateY: rotateYSpring,
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
    >
      {children}
    </motion.div>
  );
}
