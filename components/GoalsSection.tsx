'use client';

import React from 'react';
import Image from 'next/image';
import { motion, type Variants } from 'framer-motion';
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

      {/* Goals Grid */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
      >
        {/* Goal 1 */}
        <motion.div className="group relative" variants={itemVariants}>
          <motion.div 
            className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md rounded-lg sm:rounded-xl p-6 sm:p-8 h-full border border-gray-200 dark:border-slate-700 hover:border-yellow-400 dark:hover:border-yellow-400 transition-all duration-300"
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-blue-500 dark:bg-blue-600 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 text-white shadow-lg">
              <span className="text-xl sm:text-2xl">🎓</span>
            </div>
            <h4 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors duration-300">
              {t('goals.goal1Title')}
            </h4>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
              {t('goals.goal1Desc')}
            </p>
            <div className="mt-4 sm:mt-6 h-1 bg-blue-500 dark:bg-blue-500 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.div>
        </motion.div>

        {/* Goal 2 */}
        <motion.div className="group relative" variants={itemVariants}>
          <motion.div 
            className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md rounded-xl p-8 h-full border border-gray-200 dark:border-slate-700 hover:border-yellow-400 dark:hover:border-yellow-400 transition-all duration-300"
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 dark:bg-green-600 rounded-2xl mb-6 text-white shadow-lg">
              <span className="text-2xl">❤️</span>
            </div>
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors duration-300">
              {t('goals.goal2Title')}
            </h4>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('goals.goal2Desc')}
            </p>
            <div className="mt-6 h-1 bg-green-500 dark:bg-green-500 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.div>
        </motion.div>

        {/* Goal 3 */}
        <motion.div className="group relative" variants={itemVariants}>
          <motion.div 
            className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md rounded-xl p-8 h-full border border-gray-200 dark:border-slate-700 hover:border-yellow-400 dark:hover:border-yellow-400 transition-all duration-300"
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500 dark:bg-purple-600 rounded-2xl mb-6 text-white shadow-lg">
              <span className="text-2xl">👥</span>
            </div>
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors duration-300">
              {t('goals.goal3Title')}
            </h4>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('goals.goal3Desc')}
            </p>
            <div className="mt-6 h-1 bg-purple-500 dark:bg-purple-500 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.div>
        </motion.div>

        {/* Goal 4 */}
        <motion.div className="group relative" variants={itemVariants}>
          <motion.div 
            className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md rounded-xl p-8 h-full border border-gray-200 dark:border-slate-700 hover:border-yellow-400 dark:hover:border-yellow-400 transition-all duration-300"
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500 dark:bg-yellow-600 rounded-2xl mb-6 text-white shadow-lg">
              <span className="text-2xl">💡</span>
            </div>
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors duration-300">
              {t('goals.goal4Title')}
            </h4>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('goals.goal4Desc')}
            </p>
            <div className="mt-6 h-1 bg-yellow-500 dark:bg-yellow-500 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.div>
        </motion.div>

        {/* Goal 5 */}
        <motion.div className="group relative" variants={itemVariants}>
          <motion.div 
            className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md rounded-xl p-8 h-full border border-gray-200 dark:border-slate-700 hover:border-yellow-400 dark:hover:border-yellow-400 transition-all duration-300"
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500 dark:bg-red-600 rounded-2xl mb-6 text-white shadow-lg">
              <span className="text-2xl">⭐</span>
            </div>
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors duration-300">
              {t('goals.goal5Title')}
            </h4>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('goals.goal5Desc')}
            </p>
            <div className="mt-6 h-1 bg-red-500 dark:bg-red-500 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.div>
        </motion.div>

        {/* Goal 6 */}
        <motion.div className="group relative" variants={itemVariants}>
          <motion.div 
            className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-md rounded-xl p-8 h-full border border-gray-200 dark:border-slate-700 hover:border-yellow-400 dark:hover:border-yellow-400 transition-all duration-300"
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-500 dark:bg-indigo-600 rounded-2xl mb-6 text-white shadow-lg">
              <span className="text-2xl">🎯</span>
            </div>
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors duration-300">
              {t('goals.goal6Title')}
            </h4>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('goals.goal6Desc')}
            </p>
            <div className="mt-6 h-1 bg-indigo-500 dark:bg-indigo-500 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.div>
        </motion.div>
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