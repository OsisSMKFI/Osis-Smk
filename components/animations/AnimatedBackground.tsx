'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// ============================================
// FLOATING PARTICLES
// ============================================
interface FloatingParticlesProps {
  count?: number;
  color?: string;
  minSize?: number;
  maxSize?: number;
}

export const FloatingParticles: React.FC<FloatingParticlesProps> = ({
  count = 30,
  color = 'bg-white/30',
  minSize = 2,
  maxSize = 6,
}) => {
  const particles = useMemo(() => 
    Array.from({ length: count }, (_, i) => ({
      id: i,
      size: Math.random() * (maxSize - minSize) + minSize,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 5,
    })), [count, minSize, maxSize]
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute rounded-full ${color}`}
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

// ============================================
// GRADIENT ORB
// ============================================
interface GradientOrbProps {
  className?: string;
  colors: string[];
  size?: number;
  blur?: number;
  animate?: boolean;
}

export const GradientOrb: React.FC<GradientOrbProps> = ({
  className = '',
  colors,
  size = 300,
  blur = 80,
  animate = true,
}) => (
  <motion.div
    className={`absolute rounded-full pointer-events-none ${className}`}
    style={{
      width: size,
      height: size,
      background: `linear-gradient(135deg, ${colors.join(', ')})`,
      filter: `blur(${blur}px)`,
      opacity: 0.6,
    }}
    animate={animate ? {
      scale: [1, 1.2, 1],
      x: [0, 20, 0],
      y: [0, -15, 0],
    } : undefined}
    transition={{
      duration: 8,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  />
);

// ============================================
// GRID PATTERN OVERLAY
// ============================================
interface GridPatternProps {
  size?: number;
  opacity?: number;
  color?: string;
}

export const GridPattern: React.FC<GridPatternProps> = ({
  size = 40,
  opacity = 0.1,
  color = 'rgba(255,255,255,0.1)',
}) => (
  <div 
    className="absolute inset-0 pointer-events-none"
    style={{
      opacity,
      backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
      backgroundSize: `${size}px ${size}px`,
    }}
  />
);

// ============================================
// DOT PATTERN
// ============================================
interface DotPatternProps {
  size?: number;
  opacity?: number;
}

export const DotPattern: React.FC<DotPatternProps> = ({
  size = 32,
  opacity = 0.05,
}) => (
  <div 
    className="absolute inset-0 pointer-events-none"
    style={{
      opacity,
      backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
      backgroundSize: `${size}px ${size}px`,
    }}
  />
);

// ============================================
// ANIMATED GRADIENT BACKGROUND
// ============================================
interface AnimatedGradientBgProps {
  colors?: string[];
  duration?: number;
  className?: string;
}

export const AnimatedGradientBg: React.FC<AnimatedGradientBgProps> = ({
  colors = ['#f59e0b', '#f97316', '#ea580c'],
  duration = 10,
  className = '',
}) => (
  <motion.div
    className={`absolute inset-0 ${className}`}
    animate={{
      background: [
        `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)`,
        `linear-gradient(135deg, ${colors[1]} 0%, ${colors[2]} 50%, ${colors[0]} 100%)`,
        `linear-gradient(135deg, ${colors[2]} 0%, ${colors[0]} 50%, ${colors[1]} 100%)`,
      ],
    }}
    transition={{ duration, repeat: Infinity, repeatType: 'reverse' }}
  />
);

// ============================================
// MESH GRADIENT BACKGROUND
// ============================================
interface MeshGradientBgProps {
  className?: string;
}

export const MeshGradientBg: React.FC<MeshGradientBgProps> = ({
  className = '',
}) => (
  <div className={`absolute inset-0 ${className}`}>
    {/* Base gradient */}
    <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600" />
    
    {/* Animated orbs */}
    <GradientOrb 
      className="-top-32 -left-32" 
      colors={['#ec4899', '#8b5cf6']} 
      size={400} 
    />
    <GradientOrb 
      className="-bottom-32 -right-32" 
      colors={['#06b6d4', '#3b82f6']} 
      size={350} 
    />
    <GradientOrb 
      className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" 
      colors={['#fbbf24', '#f97316']} 
      size={500} 
    />
    
    {/* Particles */}
    <FloatingParticles count={30} />
    
    {/* Grid overlay */}
    <GridPattern size={40} opacity={0.1} />
    
    {/* Bottom fade */}
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-50 dark:to-gray-900" />
  </div>
);

// ============================================
// HERO BACKGROUND WRAPPER
// ============================================
interface HeroBackgroundProps {
  children: React.ReactNode;
  variant?: 'yellow' | 'blue' | 'purple' | 'green' | 'red' | 'gradient';
  className?: string;
  showParticles?: boolean;
  showGrid?: boolean;
  showOrbs?: boolean;
}

const variantColors: Record<string, string[]> = {
  yellow: ['#f59e0b', '#f97316', '#ea580c'],
  blue: ['#3b82f6', '#0ea5e9', '#06b6d4'],
  purple: ['#8b5cf6', '#a855f7', '#d946ef'],
  green: ['#22c55e', '#10b981', '#14b8a6'],
  red: ['#ef4444', '#f43f5e', '#e11d48'],
  gradient: ['#f59e0b', '#f97316', '#ea580c'],
};

const variantOrbs: Record<string, { colors1: string[]; colors2: string[]; colors3: string[] }> = {
  yellow: { colors1: ['#ec4899', '#8b5cf6'], colors2: ['#06b6d4', '#3b82f6'], colors3: ['#fbbf24', '#f97316'] },
  blue: { colors1: ['#8b5cf6', '#3b82f6'], colors2: ['#22c55e', '#06b6d4'], colors3: ['#0ea5e9', '#3b82f6'] },
  purple: { colors1: ['#ec4899', '#d946ef'], colors2: ['#8b5cf6', '#3b82f6'], colors3: ['#a855f7', '#8b5cf6'] },
  green: { colors1: ['#06b6d4', '#0ea5e9'], colors2: ['#22c55e', '#10b981'], colors3: ['#14b8a6', '#22c55e'] },
  red: { colors1: ['#f97316', '#f59e0b'], colors2: ['#ec4899', '#f43f5e'], colors3: ['#ef4444', '#e11d48'] },
  gradient: { colors1: ['#ec4899', '#8b5cf6'], colors2: ['#06b6d4', '#3b82f6'], colors3: ['#fbbf24', '#f97316'] },
};

export const HeroBackground: React.FC<HeroBackgroundProps> = ({
  children,
  variant = 'yellow',
  className = '',
  showParticles = true,
  showGrid = true,
  showOrbs = true,
}) => {
  const colors = variantColors[variant] || variantColors.yellow;
  const orbs = variantOrbs[variant] || variantOrbs.yellow;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Animated gradient base */}
      <AnimatedGradientBg colors={colors} />
      
      {/* Orbs */}
      {showOrbs && (
        <>
          <GradientOrb className="-top-32 -left-32" colors={orbs.colors1} size={400} />
          <GradientOrb className="-bottom-32 -right-32" colors={orbs.colors2} size={350} />
          <GradientOrb className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" colors={orbs.colors3} size={500} />
        </>
      )}
      
      {/* Particles */}
      {showParticles && <FloatingParticles count={30} />}
      
      {/* Grid overlay */}
      {showGrid && <GridPattern size={40} opacity={0.1} />}
      
      {/* Bottom fade to page */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-50 dark:to-gray-900" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

// ============================================
// 3D TILT CARD
// ============================================
interface Tilt3DCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  glare?: boolean;
}

export const Tilt3DCard: React.FC<Tilt3DCardProps> = ({
  children,
  className = '',
  intensity = 15,
  glare = true,
}) => {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);
  const [transform, setTransform] = React.useState({ rotateX: 0, rotateY: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    const rotateXValue = (mouseY / (rect.height / 2)) * -intensity;
    const rotateYValue = (mouseX / (rect.width / 2)) * intensity;
    
    setTransform({ rotateX: rotateXValue, rotateY: rotateYValue });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTransform({ rotateX: 0, rotateY: 0 });
  };

  return (
    <motion.div
      ref={cardRef}
      className={`relative ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX: transform.rotateX,
        rotateY: transform.rotateY,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
    >
      {children}
      {glare && isHovered && (
        <div className="absolute inset-0 pointer-events-none rounded-[inherit] bg-gradient-to-br from-white/25 via-transparent to-transparent opacity-60" />
      )}
    </motion.div>
  );
};

// Export all
export default {
  FloatingParticles,
  GradientOrb,
  GridPattern,
  DotPattern,
  AnimatedGradientBg,
  MeshGradientBg,
  HeroBackground,
  Tilt3DCard,
};

// ============================================
// SYNCHRONIZED 3D BACKGROUND
// For homepage with perfectly synced animations
// ============================================
interface Synced3DBackgroundProps {
  className?: string;
}

export const Synced3DBackground: React.FC<Synced3DBackgroundProps> = ({ className = '' }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Base animated gradient */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, rgba(251,191,36,0.4) 0%, rgba(245,158,11,0.3) 25%, rgba(59,130,246,0.25) 50%, rgba(168,85,247,0.3) 75%, rgba(236,72,153,0.25) 100%)',
          backgroundSize: '400% 400%',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      
      {/* Layer 1: Large rotating gradient sphere - VERY VISIBLE */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(251,191,36,0.8) 0%, rgba(245,158,11,0.5) 30%, rgba(249,115,22,0.3) 60%, transparent 80%)',
          filter: 'blur(25px)',
        }}
        animate={{
          rotate: [0, 360],
          scale: [1, 1.2, 1],
        }}
        transition={{
          rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
          scale: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
        }}
      />
      
      {/* Layer 2: Floating orb - Blue/Purple - BRIGHTER */}
      <motion.div
        className="absolute -top-10 -right-10 w-[450px] h-[450px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.8) 0%, rgba(139,92,246,0.6) 40%, rgba(99,102,241,0.4) 60%, transparent 80%)',
          filter: 'blur(30px)',
        }}
        animate={{
          x: [0, 70, 0],
          y: [0, 50, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Layer 3: Floating orb - Pink/Magenta - BRIGHTER */}
      <motion.div
        className="absolute bottom-10 left-1/4 w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(236,72,153,0.8) 0%, rgba(219,39,119,0.6) 40%, rgba(168,85,247,0.4) 60%, transparent 80%)',
          filter: 'blur(25px)',
        }}
        animate={{
          x: [0, -50, 0],
          y: [0, -60, 0],
          scale: [1, 1.25, 1],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5,
        }}
      />
      
      {/* Layer 4: Floating orb - Cyan/Teal */}
      <motion.div
        className="absolute top-1/3 right-1/3 w-[350px] h-[350px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(6,182,212,0.7) 0%, rgba(20,184,166,0.5) 40%, rgba(34,197,94,0.3) 60%, transparent 80%)',
          filter: 'blur(25px)',
        }}
        animate={{
          x: [0, 40, 0],
          y: [0, 60, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
      />
      
      {/* Layer 5: Extra orb - Orange/Red */}
      <motion.div
        className="absolute bottom-1/4 right-10 w-[350px] h-[350px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(249,115,22,0.6) 0%, rgba(239,68,68,0.4) 40%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        animate={{
          x: [0, -40, 0],
          y: [0, 50, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 3,
        }}
      />
      
      {/* Sparkle particles - MORE VISIBLE */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 3 + (i % 4),
              height: 3 + (i % 4),
              left: `${5 + (i * 3.2)}%`,
              top: `${10 + ((i * 11) % 80)}%`,
              background: i % 3 === 0 ? 'rgba(251,191,36,0.9)' : i % 3 === 1 ? 'rgba(59,130,246,0.9)' : 'rgba(236,72,153,0.9)',
              boxShadow: i % 3 === 0 ? '0 0 10px rgba(251,191,36,0.8)' : i % 3 === 1 ? '0 0 10px rgba(59,130,246,0.8)' : '0 0 10px rgba(236,72,153,0.8)',
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0.3, 1, 0.3],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: 4 + (i % 3),
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
      
      {/* Glowing rays */}
      <div className="absolute inset-0">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              width: '60%',
              height: '2px',
              left: '20%',
              top: `${20 + i * 12}%`,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), rgba(251,191,36,0.6), rgba(255,255,255,0.4), transparent)',
              transform: `rotate(${-10 + i * 5}deg)`,
              borderRadius: '50%',
            }}
            animate={{
              opacity: [0, 0.8, 0],
              scaleX: [0.3, 1.2, 0.3],
              x: ['-20%', '20%', '-20%'],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.8,
            }}
          />
        ))}
      </div>
      
      {/* Animated grid overlay */}
      <motion.div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
        animate={{
          backgroundPosition: ['0px 0px', '50px 50px'],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      
      {/* Floating geometric shapes */}
      <motion.div
        className="absolute top-20 left-20 w-16 h-16 border-2 border-yellow-400/40 rounded-lg"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{
          rotateX: [0, 360],
          rotateY: [0, 360],
          rotateZ: [0, 180],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      
      <motion.div
        className="absolute bottom-32 right-32 w-12 h-12 border-2 border-pink-400/40"
        style={{ 
          clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
        }}
        animate={{
          rotate: [0, 360],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      <motion.div
        className="absolute top-1/2 right-20 w-20 h-20 border-2 border-blue-400/40 rounded-full"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
};

// ============================================
// FLOATING 3D CUBE
// ============================================
// ============================================
// PAGE ANIMATED BACKGROUND
// Full-page animated background that covers entire page (fixed position)
// For use behind all sections on homepage
// ============================================
export const PageAnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Subtle base gradient */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(59,130,246,0.06) 50%, rgba(168,85,247,0.08) 100%)',
          backgroundSize: '400% 400%',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      
      {/* Large ambient orb - Yellow/Amber - Top Left */}
      <motion.div
        className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(251,191,36,0.25) 0%, rgba(245,158,11,0.15) 40%, transparent 70%)',
          filter: 'blur(60px)',
        }}
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Large ambient orb - Blue/Purple - Bottom Right */}
      <motion.div
        className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, rgba(139,92,246,0.12) 40%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        animate={{
          x: [0, -40, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
      />
      
      {/* Medium orb - Pink - Middle Left */}
      <motion.div
        className="absolute top-1/3 -left-20 w-[350px] h-[350px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(236,72,153,0.18) 0%, rgba(219,39,119,0.1) 40%, transparent 70%)',
          filter: 'blur(50px)',
        }}
        animate={{
          x: [0, 60, 0],
          y: [0, -40, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      />
      
      {/* Medium orb - Cyan/Teal - Top Right */}
      <motion.div
        className="absolute top-1/4 right-1/4 w-[300px] h-[300px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, rgba(20,184,166,0.08) 40%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        animate={{
          x: [0, -30, 0],
          y: [0, 40, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 3,
        }}
      />
      
      {/* Small floating orb - Orange - Center */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-[200px] h-[200px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 60%)',
          filter: 'blur(30px)',
          transform: 'translate(-50%, -50%)',
        }}
        animate={{
          x: ['-50%', 'calc(-50% + 80px)', '-50%'],
          y: ['-50%', 'calc(-50% - 60px)', '-50%'],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 5,
        }}
      />
      
      {/* Very subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '100px 100px',
        }}
      />
      
      {/* Floating particles - subtle */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={`page-particle-${i}`}
            className="absolute rounded-full"
            style={{
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              left: `${10 + (i * 5.5)}%`,
              top: `${15 + ((i * 17) % 70)}%`,
              background: i % 3 === 0 ? 'rgba(251,191,36,0.4)' : i % 3 === 1 ? 'rgba(59,130,246,0.4)' : 'rgba(236,72,153,0.4)',
              boxShadow: i % 3 === 0 ? '0 0 6px rgba(251,191,36,0.3)' : i % 3 === 1 ? '0 0 6px rgba(59,130,246,0.3)' : '0 0 6px rgba(236,72,153,0.3)',
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 8 + (i % 5) * 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.3,
            }}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================
// SECTIONS ANIMATED BACKGROUND
// Beautiful 3D animated background for content sections (below hero)
// More visible and elegant than PageAnimatedBackground
// ============================================
export const SectionsAnimatedBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Base solid background matching theme - prevents gray appearance */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" />
      
      {/* Base gradient with smooth animation */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(30,64,175,0.03) 0%, rgba(251,191,36,0.05) 25%, rgba(139,92,246,0.04) 50%, rgba(6,182,212,0.05) 75%, rgba(236,72,153,0.03) 100%)',
        }}
      />
      
      {/* Dark mode enhanced overlay for richer colors */}
      <div className="absolute inset-0 hidden dark:block bg-gradient-to-br from-blue-950/30 via-transparent to-purple-950/20" />
      
      {/* Animated mesh gradient overlay */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(251,191,36,0.15) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 80% 50%, rgba(59,130,246,0.12) 0%, transparent 50%), radial-gradient(ellipse 70% 45% at 20% 80%, rgba(236,72,153,0.1) 0%, transparent 50%)',
        }}
        animate={{
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Large floating orb 1 - Golden/Amber - Top */}
      <motion.div
        className="absolute -top-20 left-1/4 w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(251,191,36,0.35) 0%, rgba(245,158,11,0.2) 35%, rgba(249,115,22,0.1) 60%, transparent 80%)',
          filter: 'blur(40px)',
        }}
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Large floating orb 2 - Blue/Indigo - Right */}
      <motion.div
        className="absolute top-1/4 -right-20 w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, rgba(99,102,241,0.18) 40%, rgba(139,92,246,0.08) 65%, transparent 85%)',
          filter: 'blur(35px)',
        }}
        animate={{
          x: [0, -80, 0],
          y: [0, 80, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
      />

      {/* Medium floating orb 3 - Pink/Magenta - Bottom Left */}
      <motion.div
        className="absolute bottom-1/4 -left-10 w-[450px] h-[450px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(236,72,153,0.28) 0%, rgba(219,39,119,0.15) 40%, rgba(168,85,247,0.08) 65%, transparent 85%)',
          filter: 'blur(30px)',
        }}
        animate={{
          x: [0, 60, 0],
          y: [0, -70, 0],
          scale: [1, 1.18, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      />

      {/* Medium floating orb 4 - Cyan/Teal - Center */}
      <motion.div
        className="absolute top-1/2 left-1/3 w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(6,182,212,0.25) 0%, rgba(20,184,166,0.12) 45%, transparent 75%)',
          filter: 'blur(25px)',
        }}
        animate={{
          x: [0, 50, -30, 0],
          y: [0, -40, 40, 0],
          scale: [1, 1.1, 1.15, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 3,
        }}
      />

      {/* Small accent orb - Orange/Red - Bottom Right */}
      <motion.div
        className="absolute bottom-10 right-1/4 w-[300px] h-[300px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(249,115,22,0.22) 0%, rgba(239,68,68,0.1) 50%, transparent 75%)',
          filter: 'blur(25px)',
        }}
        animate={{
          x: [0, -40, 20, 0],
          y: [0, 30, -20, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 4,
        }}
      />

      {/* Floating 3D geometric shapes */}
      {/* Rotating cube outline */}
      <motion.div
        className="absolute top-20 right-20 w-16 h-16 sm:w-20 sm:h-20"
        style={{
          transformStyle: 'preserve-3d',
          perspective: '1000px',
        }}
        animate={{
          rotateX: [0, 360],
          rotateY: [0, 360],
          rotateZ: [0, 180],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <div className="absolute inset-0 border-2 border-yellow-400/30 rounded-lg" 
          style={{ transform: 'translateZ(10px)' }} />
        <div className="absolute inset-0 border-2 border-blue-400/20 rounded-lg"
          style={{ transform: 'translateZ(-10px) rotateY(180deg)' }} />
      </motion.div>

      {/* Floating triangle */}
      <motion.div
        className="absolute bottom-32 right-32 w-12 h-12 sm:w-16 sm:h-16"
        style={{
          clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
          background: 'linear-gradient(135deg, rgba(236,72,153,0.3) 0%, rgba(168,85,247,0.2) 100%)',
          border: '2px solid rgba(236,72,153,0.4)',
        }}
        animate={{
          rotate: [0, 360],
          scale: [1, 1.3, 1],
        }}
        transition={{
          rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
          scale: { duration: 8, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      {/* Floating circle ring */}
      <motion.div
        className="absolute top-1/2 right-16 w-16 h-16 sm:w-24 sm:h-24 rounded-full border-2 border-blue-400/40"
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Diamond shape */}
      <motion.div
        className="absolute top-1/3 left-16 w-10 h-10 sm:w-14 sm:h-14"
        style={{
          background: 'linear-gradient(135deg, rgba(6,182,212,0.3) 0%, rgba(34,197,94,0.2) 100%)',
          transform: 'rotate(45deg)',
        }}
        animate={{
          y: [0, -30, 0],
          opacity: [0.5, 0.9, 0.5],
          rotate: [45, 135, 45],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Glowing particles scattered across */}
      <div className="absolute inset-0">
        {[...Array(25)].map((_, i) => {
          const colors = [
            { bg: 'rgba(251,191,36,0.8)', shadow: 'rgba(251,191,36,0.6)' },
            { bg: 'rgba(59,130,246,0.8)', shadow: 'rgba(59,130,246,0.6)' },
            { bg: 'rgba(236,72,153,0.8)', shadow: 'rgba(236,72,153,0.6)' },
            { bg: 'rgba(6,182,212,0.8)', shadow: 'rgba(6,182,212,0.6)' },
            { bg: 'rgba(168,85,247,0.8)', shadow: 'rgba(168,85,247,0.6)' },
          ];
          const color = colors[i % colors.length];
          return (
            <motion.div
              key={`section-particle-${i}`}
              className="absolute rounded-full"
              style={{
                width: 3 + (i % 4),
                height: 3 + (i % 4),
                left: `${4 + (i * 3.8)}%`,
                top: `${8 + ((i * 13) % 85)}%`,
                background: color.bg,
                boxShadow: `0 0 12px ${color.shadow}`,
              }}
              animate={{
                y: [0, -40, 0],
                x: [0, (i % 2 === 0 ? 15 : -15), 0],
                opacity: [0.3, 0.9, 0.3],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 6 + (i % 6) * 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.2,
              }}
            />
          );
        })}
      </div>

      {/* Animated light streaks */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={`streak-${i}`}
            className="absolute h-[2px] rounded-full"
            style={{
              width: '40%',
              left: '30%',
              top: `${20 + i * 20}%`,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), rgba(251,191,36,0.6), rgba(255,255,255,0.4), transparent)',
            }}
            animate={{
              x: ['-100%', '100%'],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 1.5,
            }}
          />
        ))}
      </div>

      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Noise texture for depth */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
        }}
      />
    </div>
  );
};

export const Floating3DCube: React.FC<{ className?: string; size?: number }> = ({ 
  className = '', 
  size = 80 
}) => {
  return (
    <motion.div
      className={`absolute ${className}`}
      style={{
        width: size,
        height: size,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      animate={{
        rotateX: [0, 360],
        rotateY: [0, 360],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      {/* Cube faces */}
      {['front', 'back', 'left', 'right', 'top', 'bottom'].map((face, i) => {
        const transforms: Record<string, string> = {
          front: `translateZ(${size/2}px)`,
          back: `translateZ(${-size/2}px) rotateY(180deg)`,
          left: `translateX(${-size/2}px) rotateY(-90deg)`,
          right: `translateX(${size/2}px) rotateY(90deg)`,
          top: `translateY(${-size/2}px) rotateX(90deg)`,
          bottom: `translateY(${size/2}px) rotateX(-90deg)`,
        };
        
        return (
          <div
            key={face}
            className="absolute w-full h-full border border-white/20 bg-white/5 backdrop-blur-sm"
            style={{
              transform: transforms[face],
              backfaceVisibility: 'visible',
            }}
          />
        );
      })}
    </motion.div>
  );
};

