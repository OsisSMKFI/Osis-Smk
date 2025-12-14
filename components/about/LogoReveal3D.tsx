'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import Image from 'next/image';

interface LogoElement {
  icon: string;
  title: string;
  description: string;
  color: string;
  gradient: string;
}

interface LogoReveal3DProps {
  logoSrc: string;
  logoAlt: string;
  sectionTitle: string;
  sectionSubtitle: string;
  elements: LogoElement[];
}

// Animated Element Card
function ElementCard({ 
  element, 
  index 
}: { 
  element: LogoElement; 
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={cardRef}
      className="relative group"
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.1,
        ease: [0.25, 0.1, 0.25, 1]
      }}
    >
      {/* Glow effect */}
      <div 
        className={`absolute -inset-2 rounded-3xl blur-xl transition-opacity duration-500 ${element.gradient} opacity-0 group-hover:opacity-30`}
      />
      
      {/* Card content */}
      <div className="relative bg-gray-800/60 backdrop-blur-xl rounded-2xl p-6 border border-white/10 overflow-hidden transition-all duration-500 group-hover:border-white/20 group-hover:-translate-y-2 h-full">
        {/* Background gradient */}
        <div className={`absolute inset-0 ${element.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-500`} />

        {/* Icon */}
        <motion.div 
          className={`relative w-16 h-16 mb-5 rounded-2xl ${element.gradient} flex items-center justify-center shadow-lg`}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <span className="text-3xl">{element.icon}</span>
        </motion.div>

        {/* Title */}
        <h3 className="relative text-xl font-bold text-white mb-3 group-hover:text-yellow-400 transition-colors duration-300">
          {element.title}
        </h3>

        {/* Description */}
        <p className="relative text-gray-400 leading-relaxed text-sm group-hover:text-gray-300 transition-colors duration-300">
          {element.description}
        </p>

        {/* Bottom line */}
        <motion.div 
          className={`absolute bottom-0 left-0 h-1 ${element.gradient}`}
          initial={{ width: 0 }}
          animate={isInView ? { width: '100%' } : { width: 0 }}
          transition={{ duration: 0.8, delay: index * 0.1 + 0.3 }}
        />
      </div>
    </motion.div>
  );
}

// Main Logo Reveal Component
export default function LogoReveal3D({ 
  logoSrc, 
  logoAlt, 
  sectionTitle, 
  sectionSubtitle,
  elements 
}: LogoReveal3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const isLogoInView = useInView(logoRef, { once: true, amount: 0.3 });
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start']
  });

  // Logo transformations
  const logoRotate = useTransform(scrollYProgress, [0, 0.3], [15, 0]);
  const logoScale = useTransform(scrollYProgress, [0, 0.3], [0.8, 1]);

  return (
    <section 
      ref={containerRef}
      className="relative py-24 md:py-32 bg-gray-900 overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-yellow-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-3xl" />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(251, 191, 36, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(251, 191, 36, 0.3) 1px, transparent 1px)`,
            backgroundSize: '80px 80px'
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.span 
            className="inline-flex items-center gap-3 text-yellow-400 text-sm font-medium tracking-widest uppercase mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <span className="w-12 h-px bg-yellow-400" />
            {sectionTitle}
            <span className="w-12 h-px bg-yellow-400" />
          </motion.span>
          <p className="text-gray-400 max-w-xl mx-auto">
            {sectionSubtitle}
          </p>
        </motion.div>

        {/* Logo Section */}
        <motion.div 
          ref={logoRef}
          className="flex justify-center items-center mb-20"
          initial={{ opacity: 0, scale: 0.5, rotateY: 180 }}
          animate={isLogoInView ? { 
            opacity: 1, 
            scale: 1, 
            rotateY: 0 
          } : { 
            opacity: 0, 
            scale: 0.5, 
            rotateY: 180 
          }}
          transition={{ 
            duration: 1.2,
            type: 'spring',
            stiffness: 100,
            damping: 15
          }}
          style={{ perspective: '1000px' }}
        >
          <motion.div 
            className="relative"
            style={{ 
              rotateX: logoRotate,
              scale: logoScale 
            }}
          >
            {/* Logo glow */}
            <div className="absolute -inset-8 bg-gradient-radial from-yellow-400/20 via-yellow-400/5 to-transparent rounded-full blur-2xl" />
            
            {/* Rotating ring */}
            <motion.div 
              className="absolute -inset-12 border-2 border-yellow-400/20 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div 
              className="absolute -inset-16 border border-yellow-400/10 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            />
            
            {/* Logo image */}
            <div className="relative w-48 h-48 md:w-64 md:h-64">
              <Image
                src={logoSrc}
                alt={logoAlt}
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
            
            {/* Floating particles around logo */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                style={{
                  left: '50%',
                  top: '50%',
                }}
                animate={{
                  x: [0, Math.cos(i * 60 * Math.PI / 180) * 100],
                  y: [0, Math.sin(i * 60 * Math.PI / 180) * 100],
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </motion.div>
        </motion.div>

        {/* Elements Title */}
        <motion.h2 
          className="text-3xl md:text-4xl font-bold text-center text-white mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Filosofi <span className="text-yellow-400">Logo</span>
        </motion.h2>

        {/* Elements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {elements.map((element, index) => (
            <ElementCard 
              key={index}
              element={element}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none" />
    </section>
  );
}
