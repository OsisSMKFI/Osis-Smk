'use client';

import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';

const VisionCard: React.FC = () => {
  const { t } = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // 3D tilt effect
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  
  const springConfig = { stiffness: 200, damping: 25 };
  const rotateXSpring = useSpring(rotateX, springConfig);
  const rotateYSpring = useSpring(rotateY, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    rotateX.set((mouseY / (rect.height / 2)) * -10);
    rotateY.set((mouseX / (rect.width / 2)) * 10);
    glareX.set(((e.clientX - rect.left) / rect.width) * 100);
    glareY.set(((e.clientY - rect.top) / rect.height) * 100);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    rotateX.set(0);
    rotateY.set(0);
    glareX.set(50);
    glareY.set(50);
  };
  
  return (
    <motion.div 
      ref={cardRef}
      className="relative max-w-5xl mx-auto group px-4 sm:px-6"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: '1000px',
      }}
    >
      {/* Enhanced background decorations */}
      <motion.div 
        className="absolute -top-4 sm:-top-8 -left-4 sm:-left-8 w-20 sm:w-32 h-20 sm:h-32 bg-gradient-to-br from-yellow-400/20 to-amber-500/20 rounded-full blur-2xl"
        animate={{ 
          scale: isHovered ? 1.3 : 1,
          x: isHovered ? 10 : 0,
        }}
        transition={{ duration: 0.5 }}
      />
      <motion.div 
        className="absolute -bottom-4 sm:-bottom-8 -right-4 sm:-right-8 w-24 sm:w-40 h-24 sm:h-40 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full blur-2xl"
        animate={{ 
          scale: isHovered ? 1.3 : 1,
          x: isHovered ? -10 : 0,
        }}
        transition={{ duration: 0.5 }}
      />
      <div className="absolute top-1/2 -left-2 sm:-left-4 w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-br from-purple-400/15 to-pink-500/15 rounded-full blur-xl animate-pulse" />
      <div className="absolute top-1/4 -right-3 sm:-right-6 w-12 sm:w-20 h-12 sm:h-20 bg-gradient-to-br from-green-400/15 to-emerald-500/15 rounded-full blur-lg animate-pulse delay-1000" />
      
      <motion.div 
        className="relative card-gradient dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-10 lg:p-16 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm overflow-hidden"
        style={{
          rotateX: rotateXSpring,
          rotateY: rotateYSpring,
          transformStyle: 'preserve-3d',
        }}
        whileHover={{ scale: 1.02, boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.3)' }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        
        {/* Floating background elements */}
        <div className="absolute top-8 right-8 w-20 h-20 bg-gradient-to-br from-yellow-400/10 to-amber-500/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-1000" />
        <div className="absolute bottom-8 left-8 w-16 h-16 bg-gradient-to-br from-blue-400/10 to-indigo-500/10 rounded-full blur-lg group-hover:scale-125 transition-transform duration-700 delay-300" />
        
        {/* Enhanced quote icon */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="relative">
            <div className="bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
              <span className="text-white text-2xl sm:text-3xl">💬</span>
            </div>
            
            {/* Glow effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700 scale-150" />
            
            {/* Pulse ring */}
            <div className="absolute inset-0 rounded-2xl border-2 border-yellow-400/30 group-hover:scale-125 group-hover:border-yellow-400/50 transition-all duration-500" />
          </div>
        </div>

        {/* Enhanced vision text */}
        <blockquote className="text-center relative z-10">
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-medium text-gray-800 dark:text-gray-100 leading-relaxed mb-6 sm:mb-8 group-hover:scale-105 transition-transform duration-500">
            <span className="text-yellow-600 dark:text-yellow-400 font-bold text-3xl sm:text-4xl md:text-5xl">"</span>
            <span className="inline-block group-hover:text-yellow-700 dark:group-hover:text-yellow-300 transition-colors duration-300">
              {t('vision.visionPart1')}
            </span>
            {' '}
            <span className="text-yellow-600 dark:text-yellow-400 font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent hover:from-yellow-500 hover:to-amber-600 transition-all duration-300">
              {t('vision.visionHighlight1')}
            </span>
            {' '}
            <span className="inline-block group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300">
              {t('vision.visionPart2')}
            </span>
            {' '}
            <span className="text-blue-600 dark:text-blue-400 font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent hover:from-blue-500 hover:to-indigo-600 transition-all duration-300">
              {t('vision.visionHighlight2')}
            </span>
            {' '}
            <span className="inline-block group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300">
              {t('vision.visionPart3')}
            </span>
            {' '}
            <span className="text-green-600 dark:text-green-400 font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent hover:from-green-500 hover:to-emerald-600 transition-all duration-300">
              {t('vision.visionHighlight3')}
            </span>
            <span className="text-yellow-600 dark:text-yellow-400 font-bold text-3xl sm:text-4xl md:text-5xl">"</span>
          </p>
        </blockquote>

        {/* Enhanced decorative elements */}
        <div className="flex justify-center items-center mt-8 sm:mt-12 space-x-3 sm:space-x-6 relative z-10">
          <div className="flex space-x-1 sm:space-x-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-400 rounded-full group-hover:scale-125 transition-transform duration-300" />
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-amber-500 rounded-full group-hover:scale-125 transition-transform duration-300 delay-100" />
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-600 rounded-full group-hover:scale-125 transition-transform duration-300 delay-200" />
          </div>
          <div className="w-10 sm:w-16 h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent group-hover:w-12 sm:group-hover:w-20 transition-all duration-500" />
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full group-hover:scale-125 group-hover:rotate-180 transition-all duration-500" />
          <div className="w-10 sm:w-16 h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent group-hover:w-12 sm:group-hover:w-20 transition-all duration-500" />
          <div className="flex space-x-1 sm:space-x-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-400 rounded-full group-hover:scale-125 transition-transform duration-300 delay-200" />
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-indigo-500 rounded-full group-hover:scale-125 transition-transform duration-300 delay-100" />
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-600 rounded-full group-hover:scale-125 transition-transform duration-300" />
          </div>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-yellow-400/5 via-transparent to-blue-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-3xl" />
        
        {/* 3D Glare effect */}
        {isHovered && (
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-3xl"
            style={{
              background: `radial-gradient(circle at ${glareX.get()}% ${glareY.get()}%, rgba(255,255,255,0.3) 0%, transparent 50%)`,
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
};

export default VisionCard;