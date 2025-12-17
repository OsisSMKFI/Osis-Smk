'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * AnimatedIcon Component - Modern 3D Animated Icon
 * 
 * 🎨 FITUR:
 * - Animasi 3D rotasi dengan perspective
 * - Glow effect yang berubah warna
 * - Hover interaction dengan scale
 * - Floating animation
 * - Gradient shadow
 * 
 * 📖 CARA PAKAI:
 * import AnimatedIcon from '@/components/AnimatedIcon';
 * <AnimatedIcon />
 * 
 * atau dengan props:
 * <AnimatedIcon size="lg" color="yellow" />
 */

interface AnimatedIconProps {
  /** Ukuran icon: sm, md, lg, xl */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Warna utama: yellow, blue, green, purple, red */
  color?: 'yellow' | 'blue' | 'green' | 'purple' | 'red';
  /** Tambahan className */
  className?: string;
}

const sizeMap = {
  sm: 'text-2xl',
  md: 'text-4xl',
  lg: 'text-5xl',
  xl: 'text-7xl'
};

const colorMap = {
  yellow: {
    text: 'text-yellow-500',
    glow: 'rgba(250, 204, 21, 0.6)',
    gradient: 'from-yellow-400 to-amber-600'
  },
  blue: {
    text: 'text-blue-500',
    glow: 'rgba(59, 130, 246, 0.6)',
    gradient: 'from-blue-400 to-indigo-600'
  },
  green: {
    text: 'text-green-500',
    glow: 'rgba(34, 197, 94, 0.6)',
    gradient: 'from-green-400 to-emerald-600'
  },
  purple: {
    text: 'text-purple-500',
    glow: 'rgba(168, 85, 247, 0.6)',
    gradient: 'from-purple-400 to-violet-600'
  },
  red: {
    text: 'text-red-500',
    glow: 'rgba(239, 68, 68, 0.6)',
    gradient: 'from-red-400 to-rose-600'
  }
};

const AnimatedIcon: React.FC<AnimatedIconProps> = ({ 
  size = 'lg', 
  color = 'yellow',
  className = ''
}) => {
  const sizeClass = sizeMap[size];
  const colorConfig = colorMap[color];

  return (
    <div className={`animated-icon-wrapper relative ${className}`}>
      {/* Glow Background Effect */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-r ${colorConfig.gradient} rounded-full blur-xl opacity-30`}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
      
      {/* Main Icon Container */}
      <motion.div
        className="animated-icon-container relative z-10"
        style={{ perspective: '1000px' }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* 3D Rotating Icon */}
        <motion.svg
          stroke="currentColor"
          fill="currentColor"
          strokeWidth="0"
          viewBox="0 0 576 512"
          className={`${sizeClass} ${colorConfig.text} mx-auto mb-4 drop-shadow-lg cursor-pointer`}
          height="1em"
          width="1em"
          xmlns="http://www.w3.org/2000/svg"
          animate={{
            rotateY: [0, 15, 0, -15, 0],
            rotateX: [0, 10, 0, -10, 0],
            y: [0, -8, 0, 8, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          style={{
            filter: `drop-shadow(0 0 20px ${colorConfig.glow})`,
            transformStyle: 'preserve-3d'
          }}
        >
          <path d="M576 240c0-23.63-12.95-44.04-32-55.12V32.01C544 23.26 537.02 0 512 0c-7.12 0-14.19 2.38-19.98 7.02l-85.03 68.03C364.28 109.19 310.66 128 256 128H64c-35.35 0-64 28.65-64 64v96c0 35.35 28.65 64 64 64h33.7c-1.39 10.48-2.18 21.14-2.18 32 0 39.77 9.26 77.35 25.56 110.94 5.19 10.69 16.52 17.06 28.4 17.06h74.28c26.05 0 41.69-29.84 25.9-50.56-16.4-21.52-26.15-48.36-26.15-77.44 0-11.11 1.62-21.79 4.41-32H256c54.66 0 108.28 18.81 150.98 52.95l85.03 68.03a32.023 32.023 0 0 0 19.98 7.02c24.92 0 32-22.78 32-32V295.13C563.05 284.04 576 263.63 576 240zm-96 141.42l-33.05-26.44C392.95 311.78 325.12 288 256 288v-96c69.12 0 136.95-23.78 190.95-66.98L480 98.58v282.84z" />
        </motion.svg>
      </motion.div>

      {/* Floating Particles Effect */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute w-2 h-2 rounded-full bg-gradient-to-r ${colorConfig.gradient}`}
          style={{
            top: `${20 + i * 30}%`,
            left: `${10 + i * 35}%`
          }}
          animate={{
            y: [-10, 10, -10],
            x: [-5, 5, -5],
            opacity: [0.3, 0.7, 0.3],
            scale: [0.8, 1.2, 0.8]
          }}
          transition={{
            duration: 2 + i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.3
          }}
        />
      ))}
    </div>
  );
};

export default AnimatedIcon;

/**
 * 🎯 CONTOH PENGGUNAAN:
 * 
 * 1. Import komponen:
 *    import AnimatedIcon from '@/components/AnimatedIcon';
 * 
 * 2. Gunakan di JSX:
 *    <AnimatedIcon />
 *    <AnimatedIcon size="xl" color="blue" />
 *    <AnimatedIcon size="md" color="purple" className="my-8" />
 * 
 * 3. Props yang tersedia:
 *    - size: 'sm' | 'md' | 'lg' | 'xl' (default: 'lg')
 *    - color: 'yellow' | 'blue' | 'green' | 'purple' | 'red' (default: 'yellow')
 *    - className: string (untuk styling tambahan)
 */
