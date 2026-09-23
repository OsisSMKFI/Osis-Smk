'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { getPageContentBatch } from '@/lib/pageContent';

const VisionCard: React.FC = () => {
  const { t } = useTranslation();
  const [content, setContent] = useState<Record<string, string>>({});

  useEffect(() => {
    getPageContentBatch(
      ['site_vision_text', 'site_vision_hl1', 'site_vision_part2', 'site_vision_hl2', 'site_vision_part3', 'site_vision_hl3'],
      {
        site_vision_text: t('vision.visionPart1'),
        site_vision_hl1: t('vision.visionHighlight1'),
        site_vision_part2: t('vision.visionPart2'),
        site_vision_hl2: t('vision.visionHighlight2'),
        site_vision_part3: t('vision.visionPart3'),
        site_vision_hl3: t('vision.visionHighlight3'),
      }
    ).then(setContent);
  }, [t]);

  const p1 = content.site_vision_text || t('vision.visionPart1');
  const hl1 = content.site_vision_hl1 || t('vision.visionHighlight1');
  const p2 = content.site_vision_part2 || t('vision.visionPart2');
  const hl2 = content.site_vision_hl2 || t('vision.visionHighlight2');
  const p3 = content.site_vision_part3 || t('vision.visionPart3');
  const hl3 = content.site_vision_hl3 || t('vision.visionHighlight3');

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
            <span className="text-gray-800 dark:text-gray-100">{p1}</span>
            {' '}
            <span className="text-yellow-600 dark:text-yellow-400 font-bold">{hl1}</span>
            {' '}
            <span className="text-gray-800 dark:text-gray-100">{p2}</span>
            {' '}
            <span className="text-yellow-600 dark:text-yellow-400 font-bold">{hl2}</span>
            {' '}
            <span className="text-gray-800 dark:text-gray-100">{p3}</span>
            {' '}
            <span className="text-yellow-600 dark:text-yellow-400 font-bold">{hl3}</span>
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
