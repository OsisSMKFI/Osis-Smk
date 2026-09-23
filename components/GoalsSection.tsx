'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { getPageContentBatch } from '@/lib/pageContent';

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
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

interface GoalCardProps {
  icon: string;
  title: string;
  description: string;
  accentColor: string;
}

const GoalCard: React.FC<GoalCardProps> = ({ icon, title, description, accentColor }) => {
  return (
    <motion.div
      className="group relative"
      variants={itemVariants}
    >
      <div className="relative bg-white dark:bg-slate-900 rounded-xl p-6 sm:p-8 h-full border border-gray-200 dark:border-slate-700 transition-shadow duration-200 hover:shadow-lg">
        <div className={`inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 ${accentColor} rounded-2xl mb-5 sm:mb-6 text-white shadow-md`}>
          <span className="text-2xl sm:text-3xl">{icon}</span>
        </div>
        <h4 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
          {title}
        </h4>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
          {description}
        </p>
        <div className={`mt-5 sm:mt-6 h-1 ${accentColor} rounded-full`} />
      </div>
    </motion.div>
  );
};

const GoalsSection: React.FC = () => {
  const { t } = useTranslation();
  const [content, setContent] = useState<Record<string, string>>({});

  useEffect(() => {
    const keys = [
      'home_goals_title', 'home_goals_desc',
      'home_goal1_title', 'home_goal1_desc',
      'home_goal2_title', 'home_goal2_desc',
      'home_goal3_title', 'home_goal3_desc',
      'home_goal4_title', 'home_goal4_desc',
      'home_goal5_title', 'home_goal5_desc',
      'home_goal6_title', 'home_goal6_desc',
      'home_goals_cta_title', 'home_goals_cta_desc',
    ];
    const fallbacks: Record<string, string> = {
      home_goals_title: t('goals.forumTitle'),
      home_goals_desc: t('goals.forumDesc'),
      home_goal1_title: t('goals.goal1Title'),
      home_goal1_desc: t('goals.goal1Desc'),
      home_goal2_title: t('goals.goal2Title'),
      home_goal2_desc: t('goals.goal2Desc'),
      home_goal3_title: t('goals.goal3Title'),
      home_goal3_desc: t('goals.goal3Desc'),
      home_goal4_title: t('goals.goal4Title'),
      home_goal4_desc: t('goals.goal4Desc'),
      home_goal5_title: t('goals.goal5Title'),
      home_goal5_desc: t('goals.goal5Desc'),
      home_goal6_title: t('goals.goal6Title'),
      home_goal6_desc: t('goals.goal6Desc'),
      home_goals_cta_title: t('goals.joinUs'),
      home_goals_cta_desc: t('goals.joinUsDesc'),
    };
    getPageContentBatch(keys, fallbacks).then(setContent);
  }, [t]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <motion.div
        className="text-center mb-12 sm:mb-16"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
      >
        <div className="relative mb-6 sm:mb-8 w-full max-w-4xl mx-auto aspect-video rounded-2xl overflow-hidden shadow-lg">
          <Image
            src="/images/our-goals-placeholder.png"
            alt="Our Goals"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1024px"
            className="object-cover"
            priority
          />
        </div>

        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-xl sm:rounded-2xl p-6 sm:p-8 max-w-4xl mx-auto border border-gray-200 dark:border-slate-700">
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-yellow-600 dark:text-yellow-400 mb-3 sm:mb-4">
            {content.home_goals_title || t('goals.forumTitle')}
          </h3>
          <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg leading-relaxed">
            {content.home_goals_desc || t('goals.forumDesc')}
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
        <GoalCard icon="🎓" title={content.home_goal1_title || t('goals.goal1Title')} description={content.home_goal1_desc || t('goals.goal1Desc')} accentColor="bg-blue-500" />
        <GoalCard icon="❤️" title={content.home_goal2_title || t('goals.goal2Title')} description={content.home_goal2_desc || t('goals.goal2Desc')} accentColor="bg-green-500" />
        <GoalCard icon="👥" title={content.home_goal3_title || t('goals.goal3Title')} description={content.home_goal3_desc || t('goals.goal3Desc')} accentColor="bg-purple-500" />
        <GoalCard icon="💡" title={content.home_goal4_title || t('goals.goal4Title')} description={content.home_goal4_desc || t('goals.goal4Desc')} accentColor="bg-yellow-500" />
        <GoalCard icon="⭐" title={content.home_goal5_title || t('goals.goal5Title')} description={content.home_goal5_desc || t('goals.goal5Desc')} accentColor="bg-red-500" />
        <GoalCard icon="🎯" title={content.home_goal6_title || t('goals.goal6Title')} description={content.home_goal6_desc || t('goals.goal6Desc')} accentColor="bg-indigo-500" />
      </motion.div>

      {/* Call to Action */}
      <motion.div
        className="text-center mt-16"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-8 max-w-2xl mx-auto border border-gray-200 dark:border-slate-700">
          <h4 className="text-2xl font-semibold text-yellow-600 dark:text-yellow-400 mb-4">
            {content.home_goals_cta_title || t('goals.joinUs')}
          </h4>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            {content.home_goals_cta_desc || t('goals.joinUsDesc')}
          </p>
          <Link href="/about">
            <button
              type="button"
              className="bg-yellow-400 hover:bg-yellow-500 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-gray-900 dark:text-gray-900 font-semibold py-3 px-8 rounded-full shadow-md transition-colors duration-200"
            >
              {t('common.learnMore')}
            </button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default GoalsSection;
