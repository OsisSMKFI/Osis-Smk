'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { motion, type Variants, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

// 3D Goal Card Component with interactive tilt
interface GoalCardProps {
  icon: string;
  title: string;
  description: string;
  accentColor: string;
  delay?: number;
}

const GoalCard: React.FC<GoalCardProps> = ({ icon, title, description, accentColor, delay = 0 }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // 3D tilt values
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  
  // Spring physics for smooth animation
  const springConfig = { stiffness: 200, damping: 25 };
  const rotateXSpring = useSpring(rotateX, springConfig);
  const rotateYSpring = useSpring(rotateY, springConfig);
  
  // Icon float animation
  const iconY = useTransform(rotateXSpring, [-15, 15], [5, -5]);
  const iconScale = useSpring(isHovered ? 1.15 : 1, springConfig);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    const tiltIntensity = 12;
    const newRotateY = (mouseX / (rect.width / 2)) * tiltIntensity;
    const newRotateX = -(mouseY / (rect.height / 2)) * tiltIntensity;
    
    rotateX.set(newRotateX);
    rotateY.set(newRotateY);
    
    // Update glare position
    const glareXPos = ((e.clientX - rect.left) / rect.width) * 100;
    const glareYPos = ((e.clientY - rect.top) / rect.height) * 100;
    glareX.set(glareXPos);
    glareY.set(glareYPos);
  };
  
  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
    setIsHovered(false);
  };
  
  return (
    <motion.div 
      className="group relative"
      variants={itemVariants}
      style={{ perspective: 1000 }}
    >
      <motion.div
        ref={cardRef}
        className="relative bg-white/90 dark:bg-slate-900/80 backdrop-blur-md rounded-xl p-6 sm:p-8 h-full border border-gray-200 dark:border-slate-700 overflow-hidden cursor-pointer"
        style={{
          rotateX: rotateXSpring,
          rotateY: rotateYSpring,
          transformStyle: 'preserve-3d',
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        whileTap={{ scale: 0.98 }}
      >
        {/* Animated border glow on hover */}
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${accentColor}40, transparent, ${accentColor}40)`,
            opacity: isHovered ? 1 : 0,
          }}
          animate={{ opacity: isHovered ? 0.5 : 0 }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Glare effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{
            background: `radial-gradient(circle at ${glareX.get()}% ${glareY.get()}%, rgba(255,255,255,0.25) 0%, transparent 50%)`,
            opacity: isHovered ? 1 : 0,
          }}
        />
        
        {/* 3D Floating Icon */}
        <motion.div 
          className={`inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 ${accentColor} rounded-2xl mb-5 sm:mb-6 text-white shadow-lg relative z-10`}
          style={{ 
            y: iconY,
            scale: iconScale,
            transformStyle: 'preserve-3d',
            transform: 'translateZ(30px)',
          }}
        >
          <span className="text-2xl sm:text-3xl">{icon}</span>
        </motion.div>
        
        {/* Title with 3D depth */}
        <motion.h4 
          className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 transition-colors duration-300 relative z-10"
          style={{ transform: 'translateZ(20px)' }}
          animate={{ color: isHovered ? '#ca8a04' : '' }}
        >
          {title}
        </motion.h4>
        
        {/* Description */}
        <motion.p 
          className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base relative z-10"
          style={{ transform: 'translateZ(10px)' }}
        >
          {description}
        </motion.p>
        
        {/* Animated progress bar */}
        <motion.div 
          className={`mt-5 sm:mt-6 h-1 ${accentColor} rounded-full relative overflow-hidden`}
          style={{ transform: 'translateZ(15px)' }}
        >
          <motion.div
            className="absolute inset-0 bg-white/30"
            initial={{ x: '-100%' }}
            animate={{ x: isHovered ? '100%' : '-100%' }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />
        </motion.div>
        
        {/* Floating particles on hover */}
        {isHovered && (
          <>
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute w-2 h-2 ${accentColor} rounded-full opacity-60`}
                initial={{ 
                  x: Math.random() * 100, 
                  y: Math.random() * 100,
                  scale: 0 
                }}
                animate={{ 
                  y: [0, -30, 0],
                  x: [0, Math.random() * 20 - 10, 0],
                  scale: [0, 1, 0],
                  opacity: [0, 0.8, 0]
                }}
                transition={{ 
                  duration: 1.5, 
                  delay: i * 0.2,
                  repeat: Infinity,
                  repeatType: 'loop'
                }}
                style={{ 
                  left: `${20 + i * 20}%`,
                  bottom: '20%'
                }}
              />
            ))}
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

const GoalsSection: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <motion.div 
        className="text-center mb-12 sm:mb-16"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.div 
          className="relative mb-6 sm:mb-8 w-full max-w-4xl mx-auto aspect-video rounded-2xl overflow-hidden shadow-2xl"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.3 }}
        >
          <Image 
            src="/images/our-goals-placeholder.png" 
            alt="Our Goals"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1024px"
            className="object-cover" 
            priority
          />
        </motion.div>
        
        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md rounded-xl sm:rounded-2xl p-6 sm:p-8 max-w-4xl mx-auto border border-gray-200 dark:border-slate-700">
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-yellow-600 dark:text-yellow-400 mb-3 sm:mb-4">
            {t('goals.forumTitle')}
          </h3>
          <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg leading-relaxed">
            {t('goals.forumDesc')}
          </p>
        </div>
      </motion.div>

      {/* Goals Grid - Using 3D Interactive Cards */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
      >
        <GoalCard
          icon="🎓"
          title={t('goals.goal1Title')}
          description={t('goals.goal1Desc')}
          accentColor="bg-blue-500"
          delay={0}
        />
        <GoalCard
          icon="❤️"
          title={t('goals.goal2Title')}
          description={t('goals.goal2Desc')}
          accentColor="bg-green-500"
          delay={0.1}
        />
        <GoalCard
          icon="👥"
          title={t('goals.goal3Title')}
          description={t('goals.goal3Desc')}
          accentColor="bg-purple-500"
          delay={0.2}
        />
        <GoalCard
          icon="💡"
          title={t('goals.goal4Title')}
          description={t('goals.goal4Desc')}
          accentColor="bg-yellow-500"
          delay={0.3}
        />
        <GoalCard
          icon="⭐"
          title={t('goals.goal5Title')}
          description={t('goals.goal5Desc')}
          accentColor="bg-red-500"
          delay={0.4}
        />
        <GoalCard
          icon="🎯"
          title={t('goals.goal6Title')}
          description={t('goals.goal6Desc')}
          accentColor="bg-indigo-500"
          delay={0.5}
        />
      </motion.div>

      {/* Call to Action */}
      <motion.div 
        className="text-center mt-16"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <motion.div 
          className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-8 max-w-2xl mx-auto border border-gray-200 dark:border-slate-700"
          whileHover={{ scale: 1.02 }}
        >
          <h4 className="text-2xl font-semibold text-yellow-600 dark:text-yellow-400 mb-4">
            {t('goals.joinUs')}
          </h4>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            {t('goals.joinUsDesc')}
          </p>
          <motion.button 
            type="button"
            className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 dark:from-yellow-500 dark:to-amber-600 dark:hover:from-yellow-600 dark:hover:to-amber-700 text-slate-900 dark:text-gray-900 font-semibold py-3 px-8 rounded-full shadow-lg transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {t('common.learnMore')}
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default GoalsSection;