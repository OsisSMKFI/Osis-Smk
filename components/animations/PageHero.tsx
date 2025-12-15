'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AnimatedText, Floating } from './AnimatedSection';
import { 
  FloatingParticles, 
  GradientOrb, 
  GridPattern,
  AnimatedGradientBg 
} from './AnimatedBackground';

interface PageHeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: React.ReactNode;
  gradient?: 'yellow' | 'blue' | 'purple' | 'green' | 'red';
  particles?: boolean;
  fullHeight?: boolean;
}

const gradientClasses = {
  yellow: 'from-yellow-400 via-amber-400 to-yellow-500',
  blue: 'from-blue-400 via-cyan-400 to-blue-500',
  purple: 'from-purple-400 via-pink-400 to-purple-500',
  green: 'from-green-400 via-emerald-400 to-green-500',
  red: 'from-red-400 via-rose-400 to-red-500',
};

const bgGradientColors: Record<string, string[]> = {
  yellow: ['#f59e0b', '#f97316', '#ea580c'],
  blue: ['#3b82f6', '#0ea5e9', '#06b6d4'],
  purple: ['#8b5cf6', '#a855f7', '#d946ef'],
  green: ['#22c55e', '#10b981', '#14b8a6'],
  red: ['#ef4444', '#f43f5e', '#e11d48'],
};

const orbColors: Record<string, { c1: string[]; c2: string[]; c3: string[] }> = {
  yellow: { c1: ['#ec4899', '#8b5cf6'], c2: ['#06b6d4', '#3b82f6'], c3: ['#fbbf24', '#f97316'] },
  blue: { c1: ['#8b5cf6', '#3b82f6'], c2: ['#22c55e', '#06b6d4'], c3: ['#0ea5e9', '#3b82f6'] },
  purple: { c1: ['#ec4899', '#d946ef'], c2: ['#8b5cf6', '#3b82f6'], c3: ['#a855f7', '#8b5cf6'] },
  green: { c1: ['#06b6d4', '#0ea5e9'], c2: ['#22c55e', '#10b981'], c3: ['#14b8a6', '#22c55e'] },
  red: { c1: ['#f97316', '#f59e0b'], c2: ['#ec4899', '#f43f5e'], c3: ['#ef4444', '#e11d48'] },
};

export default function PageHero({
  title,
  subtitle,
  description,
  icon,
  gradient = 'yellow',
  particles = true,
  fullHeight = false,
}: PageHeroProps) {
  const colors = bgGradientColors[gradient] || bgGradientColors.yellow;
  const orbs = orbColors[gradient] || orbColors.yellow;

  return (
    <section className={`relative ${fullHeight ? 'min-h-screen' : 'min-h-[60vh]'} flex items-center justify-center overflow-hidden`}>
      {/* Animated gradient background */}
      <AnimatedGradientBg colors={colors} duration={10} />
      
      {/* Gradient orbs for 3D depth effect */}
      <GradientOrb className="-top-24 -left-24" colors={orbs.c1} size={300} blur={80} />
      <GradientOrb className="-bottom-24 -right-24" colors={orbs.c2} size={250} blur={70} />
      <GradientOrb className="top-1/3 right-1/4" colors={orbs.c3} size={200} blur={60} />
      
      {/* Grid pattern overlay */}
      <GridPattern size={50} opacity={0.08} />
      
      {/* Floating particles */}
      {particles && (
        <FloatingParticles count={25} color="bg-white/25" minSize={2} maxSize={5} />
      )}
      
      {/* Bottom fade to page */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-50 dark:to-gray-900 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto py-16">
        {/* Icon */}
        {icon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotateY: -180 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="mb-6"
          >
            <Floating duration={4} distance={8}>
              <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-xl">
                {icon}
              </div>
            </Floating>
          </motion.div>
        )}

        {/* Subtitle */}
        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-sm md:text-base uppercase tracking-widest text-white/90 mb-4 font-medium"
          >
            {subtitle}
          </motion.p>
        )}

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-white"
          style={{ textShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
        >
          <AnimatedText text={title} delay={0.3} />
        </motion.h1>

        {/* Description */}
        {description && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto"
          >
            {description}
          </motion.p>
        )}

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 rounded-full border-2 border-gray-400 dark:border-gray-600 flex items-start justify-center p-2"
          >
            <motion.div
              animate={{ opacity: [1, 0], y: [0, 12] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1 h-2 rounded-full bg-gray-400 dark:bg-gray-600"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
