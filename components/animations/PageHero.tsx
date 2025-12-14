'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AnimatedText, Floating } from './AnimatedSection';

interface PageHeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: React.ReactNode;
  gradient?: 'yellow' | 'blue' | 'purple' | 'green' | 'red';
  particles?: boolean;
}

const gradientClasses = {
  yellow: 'from-yellow-400 via-amber-400 to-yellow-500',
  blue: 'from-blue-400 via-cyan-400 to-blue-500',
  purple: 'from-purple-400 via-pink-400 to-purple-500',
  green: 'from-green-400 via-emerald-400 to-green-500',
  red: 'from-red-400 via-rose-400 to-red-500',
};

const bgGradientClasses = {
  yellow: 'from-yellow-500/10 via-amber-500/5 to-transparent',
  blue: 'from-blue-500/10 via-cyan-500/5 to-transparent',
  purple: 'from-purple-500/10 via-pink-500/5 to-transparent',
  green: 'from-green-500/10 via-emerald-500/5 to-transparent',
  red: 'from-red-500/10 via-rose-500/5 to-transparent',
};

export default function PageHero({
  title,
  subtitle,
  description,
  icon,
  gradient = 'yellow',
  particles = true,
}: PageHeroProps) {
  return (
    <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-b ${bgGradientClasses[gradient]} dark:from-slate-900 dark:to-slate-800`} />
      
      {/* Animated particles */}
      {particles && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <Floating key={i} duration={3 + Math.random() * 2} distance={20 + Math.random() * 20}>
              <motion.div
                className="absolute w-2 h-2 rounded-full bg-yellow-400/20"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  opacity: [0.2, 0.5, 0.2],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            </Floating>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        {/* Icon */}
        {icon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <Floating duration={4} distance={8}>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400/20 to-amber-500/20 backdrop-blur-sm border border-yellow-400/20">
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
            className="text-sm md:text-base uppercase tracking-widest text-yellow-500 dark:text-yellow-400 mb-4 font-medium"
          >
            {subtitle}
          </motion.p>
        )}

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r ${gradientClasses[gradient]} bg-clip-text text-transparent`}
        >
          <AnimatedText text={title} delay={0.3} />
        </motion.h1>

        {/* Description */}
        {description && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
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
