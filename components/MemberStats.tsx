'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

interface StatsData {
  totalMembers: number;
  ketuaCount: number;
  coreTeamCount: number;
  koordinatorCount: number;
  anggotaSekbidCount: number;
  departments: number;
}

interface StatItem {
  labelKey: string;
  count: number;
  icon: string;
  color: string;
  bgColor: string;
}

const MemberStats: React.FC = () => {
  const { t } = useTranslation();
  const [animatedStats, setAnimatedStats] = useState<Record<string, number>>({});
  const [isVisible, setIsVisible] = useState(false);
  const [statsData, setStatsData] = useState<StatsData>({
    totalMembers: 0,
    ketuaCount: 0,
    coreTeamCount: 0,
    koordinatorCount: 0,
    anggotaSekbidCount: 0,
    departments: 6,
  });
  const [isLoading, setIsLoading] = useState(true);
  const statsRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  // Fetch stats from API
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        if (data.success && data.stats) {
          setStatsData({
            totalMembers: data.stats.totalMembers || 0,
            ketuaCount: data.stats.ketuaCount || 0,
            coreTeamCount: data.stats.coreTeamCount || 0,
            koordinatorCount: data.stats.koordinatorCount || 0,
            anggotaSekbidCount: data.stats.anggotaSekbidCount || 0,
            departments: data.stats.departments || 6,
          });
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  // Calculate Pengurus Inti (Ketua + Core Team)
  const pengurusIntiCount = statsData.ketuaCount + statsData.coreTeamCount;

  // Build stats array dynamically from API data
  const stats: StatItem[] = [
    {
      labelKey: 'memberStats.totalMembers',
      count: statsData.totalMembers,
      icon: 'fas fa-users',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      labelKey: 'memberStats.coreTeam',
      count: pengurusIntiCount,
      icon: 'fas fa-user-tie',
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    },
    {
      labelKey: 'memberStats.departmentHeads',
      count: statsData.koordinatorCount,
      icon: 'fas fa-user-cog',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30'
    },
    {
      labelKey: 'memberStats.sekbidMembers',
      count: statsData.anggotaSekbidCount,
      icon: 'fas fa-user-friends',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30'
    }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible && !isLoading && !hasAnimated.current) {
          setIsVisible(true);
          hasAnimated.current = true;
          // Delay the animation start to ensure state is updated
          setTimeout(() => {
            startCountAnimation();
          }, 100);
        }
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, [isLoading]);

  // Also trigger animation if already visible when data loads
  useEffect(() => {
    if (!isLoading && isVisible && !hasAnimated.current) {
      hasAnimated.current = true;
      startCountAnimation();
    }
  }, [isLoading, isVisible]);

  const startCountAnimation = () => {
    stats.forEach((stat) => {
      if (stat.count === 0) {
        setAnimatedStats(prev => ({ ...prev, [stat.labelKey]: 0 }));
        return;
      }
      let current = 0;
      const increment = Math.max(stat.count / 50, 0.5); // Slower animation, min increment
      const timer = setInterval(() => {
        current += increment;
        if (current >= stat.count) {
          current = stat.count;
          clearInterval(timer);
        }
        setAnimatedStats(prev => ({ 
          ...prev, 
          [stat.labelKey]: Math.floor(current) 
        }));
      }, 30);
    });
  };

  return (
    <div ref={statsRef} className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 md:p-12 mb-16">
      <h3 className="text-3xl md:text-4xl font-bold text-center text-gray-800 dark:text-white mb-12">
        {t('memberStats.title')}
      </h3>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const total = statsData.totalMembers || 1; // Prevent division by zero
            const percentage = stat.labelKey === 'memberStats.totalMembers' 
              ? 100 
              : Math.round((stat.count / total) * 100);
            return (
            <div 
              key={stat.labelKey}
              className={`text-center p-6 rounded-2xl ${stat.bgColor} transform hover:scale-105 transition-all duration-500 group cursor-pointer`}
              style={{ 
                animationDelay: `${index * 100}ms`,
                animation: isVisible ? 'fadeInUp 0.6s ease-out forwards' : 'none'
              }}
            >
              {/* Icon with Pulse Effect */}
              <div className="relative inline-block mb-4">
                <i className={`${stat.icon} text-4xl ${stat.color} group-hover:scale-110 transition-transform duration-300`}></i>
                
                {/* Pulse Ring */}
                <div className={`absolute inset-0 rounded-full ${stat.color.replace('text-', 'border-')} border-2 opacity-0 group-hover:opacity-100 animate-ping`} />
              </div>

              {/* Animated Counter */}
              <div className={`text-4xl md:text-5xl font-bold ${stat.color} mb-2 transition-all duration-300`}>
                {animatedStats[stat.labelKey] ?? 0}
              </div>

              {/* Label */}
              <p className="text-gray-600 dark:text-gray-300 font-medium text-sm">
                {t(stat.labelKey)}
              </p>

              {/* Progress Bar */}
              <div className="mt-4 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-3 ${stat.color.replace('text-', 'bg-')} rounded-full transition-all duration-2000 ease-out`}
                  style={{ 
                    width: isVisible ? `${percentage}%` : '0%' 
                  }}
                />
              </div>

              {/* Percentage */}
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                {isVisible ? `${percentage}%` : '0%'} dari total
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Organization Chart Preview */}
      <div className="mt-12 text-center">
        <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
          Struktur Organisasi
        </h4>
        
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-full font-semibold">
            <i className="fas fa-crown mr-2"></i>
            {t('memberStats.chairman')}
          </div>
          <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-full font-semibold">
            <i className="fas fa-users mr-2"></i>
            {t('memberStats.coreBoard')}
          </div>
          <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-4 py-2 rounded-full font-semibold">
            <i className="fas fa-sitemap mr-2"></i>
            {t('memberStats.departmentHeads')}
          </div>
          <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-4 py-2 rounded-full font-semibold">
            <i className="fas fa-tasks mr-2"></i>
            {t('memberStats.sectionDivisions')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberStats;