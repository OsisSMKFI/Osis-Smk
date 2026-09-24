'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaArrowRight, FaUsers } from 'react-icons/fa';
import PageHero from '@/components/animations/PageHero';
import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { useTranslation } from '@/hooks/useTranslation';

interface SekbidData {
  id: number;
  name: string;
  description: string | null;
  color: string;
  icon: string;
}

// Palette cycled by index — works for any DB id (not just 1-6)
const COLOR_PALETTE = [
  { gradient: 'from-green-400 to-emerald-500', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-700' },
  { gradient: 'from-blue-400 to-indigo-500', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-700' },
  { gradient: 'from-purple-400 to-pink-500', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-700' },
  { gradient: 'from-yellow-400 to-orange-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-700' },
  { gradient: 'from-teal-400 to-green-500', bg: 'bg-teal-50 dark:bg-teal-900/20', border: 'border-teal-200 dark:border-teal-700' },
  { gradient: 'from-cyan-400 to-blue-500', bg: 'bg-cyan-50 dark:bg-cyan-900/20', border: 'border-cyan-200 dark:border-cyan-700' },
];

const getColorClasses = (id: number, index: number) => {
  return COLOR_PALETTE[Math.abs(id || index) % COLOR_PALETTE.length];
};

interface SekbidPageClientProps {
  initialSekbid?: SekbidData[];
  initialProkerCounts?: Record<number, number>;
}

export default function SekbidPageClient({
  initialSekbid = [],
  initialProkerCounts = {},
}: SekbidPageClientProps = {}) {
  const { t } = useTranslation();
  const [sekbidData, setSekbidData] = useState<SekbidData[]>(initialSekbid);
  const [loading, setLoading] = useState(initialSekbid.length === 0);
  const [prokerCounts, setProkerCounts] = useState<Record<number, number>>(initialProkerCounts);

  useEffect(() => {
    if (initialSekbid.length > 0) {
      setLoading(false);
      return;
    }
    async function fetchData() {
      try {
        const { cachedGetJson } = await import('@/lib/clientCache');
        const sekbidDataRes = await cachedGetJson<any>('/api/sekbid');
        setSekbidData(sekbidDataRes.sekbid || []);

        const prokerData = await cachedGetJson<any>('/api/proker');
        const programs = prokerData.programs || prokerData.proker || [];
        const counts: Record<number, number> = {};
        programs.forEach((p: { sekbid_id?: number }) => {
          if (p.sekbid_id) {
            counts[p.sekbid_id] = (counts[p.sekbid_id] || 0) + 1;
          }
        });
        setProkerCounts(counts);
      } catch (error) {
        console.error('Error fetching sekbid data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Loading skeleton
  if (loading) {
    return (
      <main className="page-content bg-white dark:bg-gray-900 transition-colors duration-300 min-h-screen">
        <PageHero
          title="Sekretariat Bidang"
          subtitle="OSIS SMK Informatika"
          description={t('sekbidPage.subtitle')}
          icon={<FaUsers className="w-10 h-10 text-yellow-500" />}
          gradient="yellow"
        />
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {Array.from({ length: Math.max(sekbidData.length, 3) }).map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-content bg-white dark:bg-gray-900 transition-colors duration-300 min-h-screen">
      {/* Hero Section */}
      <PageHero
        title="Sekretariat Bidang"
        subtitle="OSIS SMK Informatika"
        description={t('sekbidPage.subtitle')}
        icon={<FaUsers className="w-10 h-10 text-yellow-500" />}
        gradient="yellow"
      />

      <AnimatedSection variant="fadeUp" delay={0.1}>
        <section className="py-16 relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-yellow-400/5 to-amber-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400/5 to-indigo-500/5 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-6 relative z-10">
            {/* Sekbid Grid with Stagger Animation */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
              }}
            >
              {sekbidData.map((sekbid, index) => {
                const colors = getColorClasses(sekbid.id, index);
                const prokerCount = prokerCounts[sekbid.id] || 0;
                const iconPath = sekbid.icon || `/icons/sekbid-${sekbid.id}.svg`;
                // Always prefer admin/DB values; only generic fallback when empty
                const displayName = (sekbid.name || '').trim() || `Sekbid ${sekbid.id}`;
                const description = (sekbid.description || '').trim() || 'Seksi bidang OSIS SMK Informatika';
                
                return (
                  <motion.div
                    key={sekbid.id}
                    variants={{
                      hidden: { opacity: 0, y: 30, scale: 0.95 },
                      visible: { opacity: 1, y: 0, scale: 1 },
                    }}
                    transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <Link 
                      href={`/sekbid/${sekbid.id}`}
                      className="group block h-full"
                    >
                      <motion.div 
                        className={`relative h-full rounded-2xl transition-all duration-300 overflow-hidden border-2 ${colors.border} ${colors.bg}`}
                        whileHover={{ scale: 1.03, y: -5 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* Gradient Header */}
                        <div className={`h-2 bg-gradient-to-r ${colors.gradient}`} />
                        
                        <div className="p-8">
                          {/* Icon */}
                          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${colors.gradient} text-white mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                            <img 
                              src={iconPath} 
                              alt={displayName} 
                              className="w-12 h-12 object-contain" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/icons/default.svg';
                              }}
                            />
                          </div>

                          {/* Sekbid Number */}
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-sm font-bold text-gray-500 dark:text-gray-400">SEKBID</span>
                            <span className={`text-2xl font-bold bg-gradient-to-r ${colors.gradient} bg-clip-text text-transparent`}>
                              {sekbid.id}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                            {displayName}
                          </h3>

                          {/* Description */}
                          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed line-clamp-3">
                            {description}
                          </p>

                          {/* Program Count */}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {prokerCount} {t('sekbidPage.programWork') || 'Program Kerja'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 group-hover:gap-4 transition-all">
                              <span className="text-sm font-semibold">{t('sekbidPage.viewDetail') || 'Lihat Detail'}</span>
                              <FaArrowRight className="text-sm" />
                            </div>
                          </div>
                        </div>

                        {/* Hover Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      </motion.div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Empty state */}
            {sekbidData.length === 0 && !loading && (
              <div className="text-center py-16">
                <FaUsers className="mx-auto text-6xl text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Belum ada data Sekbid
                </h3>
                <p className="text-gray-500 dark:text-gray-500">
                  Data sekretariat bidang akan segera ditambahkan
                </p>
              </div>
            )}
          </div>
        </section>
      </AnimatedSection>
    </main>
  );
}
