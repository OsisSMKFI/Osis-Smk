'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface PageHeroProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: React.ReactNode;
  gradient?: 'yellow' | 'blue' | 'purple' | 'green' | 'red';
  fullHeight?: boolean;
}

const bgColors: Record<string, string> = {
  yellow: 'from-amber-500 to-amber-600',
  blue: 'from-blue-500 to-blue-600',
  purple: 'from-purple-500 to-purple-600',
  green: 'from-emerald-500 to-emerald-600',
  red: 'from-red-500 to-red-600',
};

export default function PageHero({
  title,
  subtitle,
  description,
  icon,
  gradient = 'yellow',
  fullHeight = false,
}: PageHeroProps) {
  const bg = bgColors[gradient] || bgColors.yellow;

  return (
    <section className={`relative ${fullHeight ? 'min-h-screen' : 'min-h-[50vh] md:min-h-[60vh]'} flex items-center justify-center overflow-hidden`}>
      {/* Solid gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${bg}`} />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto py-16 md:py-20">
        {icon && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-5 text-white/90"
          >
            {icon}
          </motion.div>
        )}

        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="text-xs md:text-sm uppercase tracking-widest text-white/80 mb-3 font-medium"
          >
            {subtitle}
          </motion.p>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 text-white leading-tight"
        >
          {title}
        </motion.h1>

        {description && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-base md:text-lg text-white/80 max-w-xl mx-auto leading-relaxed"
          >
            {description}
          </motion.p>
        )}
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-50 dark:from-gray-900 to-transparent pointer-events-none" />
    </section>
  );
}
