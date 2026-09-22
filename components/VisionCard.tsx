'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';

const VisionCard: React.FC = () => {
  const { t } = useTranslation();

  return (
    <motion.div
      className="relative max-w-5xl mx-auto px-4 sm:px-6"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6 }}
    >
      <div
        data-component="vision-card"
        className="relative bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl shadow-lg p-6 sm:p-10 lg:p-16 border border-gray-200 dark:border-gray-700"
      >
        {/* Quote icon */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="bg-yellow-400 p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl shadow-lg">
            <span className="text-white text-2xl sm:text-3xl">&ldquo;</span>
          </div>
        </div>

        {/* Vision text */}
        <blockquote className="text-center relative z-10">
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-medium text-gray-800 dark:text-gray-100 leading-relaxed mb-6 sm:mb-8">
            <span className="text-yellow-600 dark:text-yellow-400 font-bold text-3xl sm:text-4xl md:text-5xl">&ldquo;</span>
            <span className="text-gray-800 dark:text-gray-100">{t('vision.visionPart1')}</span>
            {' '}
            <span className="text-yellow-600 dark:text-yellow-400 font-bold">{t('vision.visionHighlight1')}</span>
            {' '}
            <span className="text-gray-800 dark:text-gray-100">{t('vision.visionPart2')}</span>
            {' '}
            <span className="text-yellow-600 dark:text-yellow-400 font-bold">{t('vision.visionHighlight2')}</span>
            {' '}
            <span className="text-gray-800 dark:text-gray-100">{t('vision.visionPart3')}</span>
            {' '}
            <span className="text-yellow-600 dark:text-yellow-400 font-bold">{t('vision.visionHighlight3')}</span>
            <span className="text-yellow-600 dark:text-yellow-400 font-bold text-3xl sm:text-4xl md:text-5xl">&rdquo;</span>
          </p>
        </blockquote>

        {/* Decorative line */}
        <div className="flex justify-center items-center mt-8 sm:mt-12">
          <div className="w-16 h-0.5 bg-yellow-400 rounded-full" />
        </div>
      </div>
    </motion.div>
  );
};

export default VisionCard;
