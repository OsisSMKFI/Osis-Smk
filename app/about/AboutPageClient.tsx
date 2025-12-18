"use client";

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { motion, useScroll, useTransform } from 'framer-motion';
import { apiFetch, safeJson } from '@/lib/safeFetch';
import TeamMemberModal from '@/components/TeamMemberModal';
import { useTranslation } from '@/hooks/useTranslation';
import type { TeamMember } from '@/components/about/types';

// Dynamic imports for 3D components (prevent SSR issues)
const HeroSection3D = dynamic(
  () => import('@/components/about/AboutSections').then(mod => mod.HeroSection3D),
  { ssr: false, loading: () => <HeroFallback /> }
);

const StorySection = dynamic(
  () => import('@/components/about/AboutSections').then(mod => mod.StorySection),
  { ssr: false, loading: () => <SectionFallback /> }
);

const SymbolSection = dynamic(
  () => import('@/components/about/AboutSections').then(mod => mod.SymbolSection),
  { ssr: false, loading: () => <SectionFallback /> }
);

const InteractiveLogo3D = dynamic(
  () => import('@/components/about/InteractiveLogo3D'),
  { ssr: false, loading: () => <SectionFallback /> }
);

const TeamSection = dynamic(
  () => import('@/components/about/AboutSections').then(mod => mod.TeamSection),
  { ssr: false, loading: () => <SectionFallback /> }
);

const CustomCursor = dynamic(
  () => import('@/components/about/Effects').then(mod => mod.CustomCursor),
  { ssr: false }
);

const SoundProvider = dynamic(
  () => import('@/components/about/SoundEffects').then(mod => mod.SoundProvider),
  { ssr: false }
);

const SoundToggle = dynamic(
  () => import('@/components/about/SoundEffects').then(mod => mod.SoundToggle),
  { ssr: false }
);

// Fallback components
function HeroFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Memuat halaman...</p>
      </div>
    </div>
  );
}

function SectionFallback() {
  return (
    <div className="py-32 flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="text-center">
        <div className="w-10 h-10 border-3 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400 text-sm">Memuat...</p>
      </div>
    </div>
  );
}

// Vision & Mission Section
function VisionMissionSection() {
  const { t } = useTranslation();
  
  return (
    <section className="relative py-32 overflow-hidden bg-gradient-to-b from-gray-100 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(to right, rgba(251, 191, 36, 0.5) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(251, 191, 36, 0.5) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 text-yellow-600 dark:text-yellow-400 text-sm font-medium tracking-widest uppercase mb-4">
            <span className="w-8 h-px bg-yellow-500 dark:bg-yellow-400" />
            {t('about.visionMissionLabel') || 'Visi & Misi'}
            <span className="w-8 h-px bg-yellow-500 dark:bg-yellow-400" />
          </span>
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            {t('about.visionTitle') || 'Arah'}{' '}
            <span className="text-yellow-500 dark:text-yellow-400">{t('about.visionTitleHighlight') || 'Langkah Kami'}</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Vision Card */}
          <motion.div
            className="group relative"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-3xl blur-lg opacity-20 group-hover:opacity-40 transition duration-500" />
            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 md:p-10 border border-yellow-500/20 h-full shadow-lg dark:shadow-none">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-yellow-500/30">
                  🎯
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {t('about.visionLabel') || 'Visi'}
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                {t('about.visionContent') || 'Menjadi organisasi siswa yang unggul, inovatif, dan berkarakter islami dalam membentuk generasi pemimpin masa depan yang berwawasan teknologi dan berjiwa kepemimpinan.'}
              </p>
            </div>
          </motion.div>

          {/* Mission Card */}
          <motion.div
            className="group relative"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-3xl blur-lg opacity-20 group-hover:opacity-40 transition duration-500" />
            <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 md:p-10 border border-blue-500/20 h-full shadow-lg dark:shadow-none">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-blue-500/30">
                  🚀
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {t('about.missionLabel') || 'Misi'}
                </h3>
              </div>
              <ul className="space-y-4">
                {[
                  t('about.mission1') || 'Mengembangkan potensi kepemimpinan siswa melalui berbagai kegiatan organisasi',
                  t('about.mission2') || 'Menumbuhkan kreativitas dan inovasi dalam setiap program kerja',
                  t('about.mission3') || 'Menanamkan nilai-nilai keislaman dalam setiap aktivitas',
                  t('about.mission4') || 'Membangun kerjasama yang solid antar anggota dan stakeholder'
                ].map((mission, index) => (
                  <motion.li 
                    key={index}
                    className="flex items-start gap-3 text-gray-600 dark:text-gray-300"
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-bold mt-0.5">
                      {index + 1}
                    </span>
                    <span>{mission}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Achievement item type
interface AchievementItem {
  year: string;
  title: string;
  description: string;
  icon: string;
}

// Achievements Section - replaces duplicate stats
function AchievementsSection() {
  const { t } = useTranslation();
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Default achievements from translations
  const defaultAchievements: AchievementItem[] = [
    {
      year: '2024',
      title: t('about.achieve1Title'),
      description: t('about.achieve1Desc'),
      icon: '🚀',
    },
    {
      year: '2024',
      title: t('about.achieve2Title'),
      description: t('about.achieve2Desc'),
      icon: '💻',
    },
    {
      year: '2025',
      title: t('about.achieve3Title'),
      description: t('about.achieve3Desc'),
      icon: '🎯',
    },
  ];

  useEffect(() => {
    async function fetchAchievements() {
      try {
        const res = await fetch('/api/public/achievements');
        if (res.ok) {
          const data = await res.json();
          if (data.achievements && data.achievements.length > 0 && data.source === 'database') {
            setAchievements(data.achievements);
          } else {
            setAchievements(defaultAchievements);
          }
        } else {
          setAchievements(defaultAchievements);
        }
      } catch {
        setAchievements(defaultAchievements);
      } finally {
        setLoading(false);
      }
    }
    fetchAchievements();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Show default while loading
  const displayAchievements = loading ? defaultAchievements : achievements;

  return (
    <section className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-br from-gray-100 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Background accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/10 dark:bg-yellow-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl" />
      
      <div className="relative z-10 max-w-5xl mx-auto px-4">
        {/* Section Header */}
        <motion.div
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-flex items-center gap-2 text-yellow-600 dark:text-yellow-400 text-xs tracking-widest uppercase mb-4">
            <span className="w-8 h-px bg-yellow-500 dark:bg-yellow-400" />
            {t('about.achievementsLabel')}
            <span className="w-8 h-px bg-yellow-500 dark:bg-yellow-400" />
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white">
            {t('about.achievementsTitle')} <span className="text-yellow-500 dark:text-yellow-400">{t('about.achievementsTitleHighlight')}</span>
          </h2>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-yellow-500 via-amber-500 to-transparent dark:from-yellow-400 dark:via-amber-500" />
          
          {displayAchievements.map((item, index) => (
            <motion.div
              key={index}
              className={`relative flex items-start mb-8 md:mb-12 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
            >
              {/* Dot */}
              <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-4 h-4 bg-yellow-500 dark:bg-yellow-400 rounded-full border-4 border-gray-100 dark:border-gray-900 z-10" />
              
              {/* Content */}
              <div className={`ml-12 md:ml-0 md:w-[45%] ${index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                <span className="inline-block px-3 py-1 bg-yellow-500/10 dark:bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 text-xs font-bold rounded-full mb-2">
                  {item.year}
                </span>
                <h3 className={`text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2 ${index % 2 === 0 ? 'md:justify-end' : ''}`}>
                  <span className="text-2xl">{item.icon}</span>
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base leading-relaxed">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Values Section
function ValuesSection() {
  const { t } = useTranslation();
  
  const values = [
    {
      icon: '💡',
      title: t('about.valueInnovation') || 'Inovasi',
      description: t('about.valueInnovationDesc') || 'Selalu mencari cara baru dan kreatif dalam setiap kegiatan',
      color: 'from-yellow-400 to-orange-500'
    },
    {
      icon: '🤝',
      title: t('about.valueIntegrity') || 'Integritas',
      description: t('about.valueIntegrityDesc') || 'Menjunjung tinggi kejujuran dan tanggung jawab',
      color: 'from-blue-400 to-indigo-500'
    },
    {
      icon: '🌟',
      title: t('about.valueExcellence') || 'Keunggulan',
      description: t('about.valueExcellenceDesc') || 'Berusaha memberikan yang terbaik dalam setiap aspek',
      color: 'from-purple-400 to-pink-500'
    },
    {
      icon: '🕌',
      title: t('about.valueIslamic') || 'Islami',
      description: t('about.valueIslamicDesc') || 'Berlandaskan nilai-nilai keislaman dalam setiap tindakan',
      color: 'from-green-400 to-emerald-500'
    }
  ];

  return (
    <section className="relative py-32 overflow-hidden bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-flex items-center gap-2 text-yellow-600 dark:text-yellow-400 text-sm font-medium tracking-widest uppercase mb-4">
            ✨ {t('about.valuesLabel') || 'Nilai-Nilai Kami'}
          </span>
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white">
            {t('about.valuesTitle') || 'Prinsip'}{' '}
            <span className="text-yellow-500">{t('about.valuesTitleHighlight') || 'yang Kami Pegang'}</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, index) => (
            <motion.div
              key={index}
              className="group relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${value.color} rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500`} />
              <div className="relative bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 h-full transition-all duration-300 group-hover:-translate-y-1">
                <div className={`w-14 h-14 bg-gradient-to-r ${value.color} rounded-xl flex items-center justify-center text-2xl mb-4 shadow-lg`}>
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {value.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {value.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Footer CTA Section
function FooterCTASection() {
  const { t } = useTranslation();

  return (
    <section className="relative py-32 overflow-hidden bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-400/30 dark:bg-yellow-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-400/30 dark:bg-amber-500/20 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            {t('about.ctaTitle') || 'Bergabung'}{' '}
            <span className="text-yellow-600 dark:text-yellow-400">{t('about.ctaTitleHighlight') || 'Bersama Kami'}</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
            {t('about.ctaDescription') || 'Mari bersama-sama membangun organisasi yang lebih baik dan menciptakan dampak positif bagi sekolah dan masyarakat.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.a
              href="/register"
              className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-gray-900 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/30"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="relative z-10">{t('about.ctaButton') || 'Daftar Sekarang'}</span>
              <span className="ml-2">→</span>
            </motion.a>
            <motion.a
              href="/info"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-gray-800 dark:text-white border border-gray-300 dark:border-white/30 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {t('about.ctaSecondaryButton') || 'Lihat Info Terkini'}
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default function AboutPageClient() {
  const { t } = useTranslation();

  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [coreTeam, setCoreTeam] = useState<TeamMember[] | null>(null);
  const [koordinatorSekbid, setKoordinatorSekbid] = useState<TeamMember[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch team members
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiFetch('/api/members?active=true');
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await safeJson(res, { url: '/api/members?active=true', method: 'GET' });
        const data = json.members || [];
        
        const mapped = (data || []).map((m: any) => ({
          id: String(m.id),
          name: m.name || m.nama || 'Unknown',
          position: m.role || m.jabatan || 'Anggota',
          image: m.photo_url || m.foto_url || '/images/placeholder.svg',
          description: m.quote || m.quotes || t('about.coreDataPending') || 'Data sedang diperbarui',
          ttl: m.ttl || '-',
          alamat: m.alamat || '-',
          motto: m.motto || '-',
          sekbidId: m.sekbid_id,
        }));

        // Tim Inti: Filter berdasarkan posisi exact match
        const core = mapped.filter((m: any) => {
          const pos = (m.position || '').toLowerCase();
          // Hanya posisi Tim Inti yang spesifik
          return ['ketua osis', 'wakil ketua', 'sekretaris', 'bendahara'].includes(pos);
        });

        // Koordinator Sekbid: anggota dengan sekbid_id 1-6 yang rolenya adalah koordinator
        const koordinator = mapped.filter((m: any) => {
          const pos = (m.position || '').trim().toLowerCase();
          const hasSekbid = m.sekbidId !== null && m.sekbidId >= 1 && m.sekbidId <= 6;
          // Hanya yang memiliki role koordinator/kepala sekbid
          return hasSekbid && (pos.includes('koordinator') || pos.includes('kepala') || pos.includes('ketua sekbid'));
        });

        if (mounted) {
          setCoreTeam(core);
          setKoordinatorSekbid(koordinator);
        }
      } catch {
        if (mounted) setFetchError('Gagal memuat data anggota. Silakan refresh halaman.');
      }
    })();
    return () => { mounted = false; };
  }, [t]);

  const openModal = (member: TeamMember) => setSelectedMember(member);
  const closeModal = () => setSelectedMember(null);

  // Logo elements data with proper translations
  const logoElements = [
    { 
      icon: '💻', 
      title: t('about.symbolTech') || 'Simbol Teknologi', 
      description: t('about.symbolTechDesc') || 'Merepresentasikan identitas SMK Informatika sebagai sekolah berbasis teknologi dan digital yang terus berinovasi.', 
      color: '#3b82f6',
      gradient: 'bg-gradient-to-r from-blue-500 to-indigo-600' 
    },
    { 
      icon: '🎓', 
      title: t('about.symbolEducation') || 'Pendidikan Berkualitas', 
      description: t('about.symbolEducationDesc') || 'Melambangkan komitmen sekolah dalam memberikan pendidikan informatika yang berkualitas dan relevan dengan industri.', 
      color: '#10b981',
      gradient: 'bg-gradient-to-r from-green-500 to-emerald-600' 
    },
    { 
      icon: '🌟', 
      title: t('about.symbolCreativity') || 'Kreativitas & Inovasi', 
      description: t('about.symbolCreativityDesc') || 'Mendorong siswa untuk berpikir kreatif, inovatif, dan berani menciptakan solusi teknologi masa depan.', 
      color: '#a855f7',
      gradient: 'bg-gradient-to-r from-purple-500 to-pink-600' 
    },
    { 
      icon: '🤝', 
      title: t('about.symbolCollaboration') || 'Kolaborasi', 
      description: t('about.symbolCollaborationDesc') || 'Menekankan pentingnya kerja sama tim dalam mengembangkan proyek dan mencapai tujuan bersama.', 
      color: '#f97316',
      gradient: 'bg-gradient-to-r from-orange-500 to-red-600' 
    },
    { 
      icon: '🚀', 
      title: t('about.symbolVision') || 'Visi Masa Depan', 
      description: t('about.symbolVisionDesc') || 'Mempersiapkan siswa menjadi profesional IT yang siap menghadapi tantangan era digital dan industri 4.0.', 
      color: '#eab308',
      gradient: 'bg-gradient-to-r from-yellow-500 to-amber-600' 
    },
    { 
      icon: '📖', 
      title: t('about.symbolIslamic') || 'Nilai Islami', 
      description: t('about.symbolIslamicDesc') || 'Mengintegrasikan nilai-nilai Islam dalam setiap aspek pembelajaran dan pengembangan karakter siswa.', 
      color: '#14b8a6',
      gradient: 'bg-gradient-to-r from-teal-500 to-cyan-600' 
    }
  ];

  return (
    <SoundProvider>
      <div className="min-h-screen bg-white dark:bg-gray-900 overflow-x-hidden scroll-smooth">
        {/* Custom Cursor - Desktop only */}
        {isClient && <CustomCursor />}
        
        {/* Sound Toggle removed - handled by GlobalFloatingControls in layout */}

        {/* Hero Section with 3D */}
        {isClient && (
          <HeroSection3D
            title={`${t('about.heroTitle1') || 'Tentang'} ${t('about.heroTitle2') || 'DIRGANTARA 2025'}`}
            subtitle={`${t('about.heroSubtitle1') || 'Mengenal lebih dekat'} ${t('about.heroSubtitle2') || 'OSIS SMK Informatika - Dirgantara'}`}
            scrollText={t('about.scrollText') || 'Scroll untuk menjelajahi'}
          />
        )}

        {/* Achievements Section */}
        <AchievementsSection />

        {/* Story Section - Cerita Dirgantara */}
        {isClient && (
          <StorySection
            title={t('about.storyTitle1') || 'Cerita'}
            highlightTitle={t('about.storyTitle2') || 'Dirgantara'}
            philosophyTitle={t('about.philosophyTitle') || 'Filosofi Nama'}
            philosophyHighlight={t('about.philosophyHighlight') || 'Dirgantara'}
            philosophyContent={{
              part1: t('about.philosophyPart1') || 'Nama',
              nameHighlight: t('about.philosophyNameHighlight') || '"Dirgantara"',
              part2: t('about.philosophyPart2') || 'diambil dari kata dalam bahasa Indonesia yang berarti',
              skyHighlight: t('about.philosophySkyHighlight') || '"angkasa" atau "langit"',
              part3: t('about.philosophyPart3') || '. Nama ini mencerminkan visi kami yang tinggi dan luas seperti langit.'
            }}
            descriptions={[
              t('about.philosophyDesc1') || 'Sebagai organisasi siswa, kami berkomitmen untuk mengembangkan kepemimpinan, kreativitas, dan nilai-nilai keislaman dalam setiap kegiatan.',
              t('about.philosophyDesc2') || 'Dengan semangat yang membara seperti matahari, kami terus bergerak maju menuju masa depan yang lebih cerah.'
            ]}
          />
        )}

        {/* Vision & Mission Section */}
        <VisionMissionSection />

        {/* Values Section */}
        <ValuesSection />

        {/* Logo Reveal 3D Section - Interactive like igloo.inc */}
        {isClient && (
          <InteractiveLogo3D
            logoSrc="/images/logo-2.png"
            logoAlt={t('navbar.logoAlt') || 'Logo OSIS SMK Informatika'}
            sectionTitle={t('about.symbolLogoTitle') || 'Filosofi Logo SMK Informatika'}
            sectionSubtitle={t('about.symbolSubtitle') || 'Setiap elemen dalam logo OSIS memiliki filosofi dan makna yang mendalam'}
            elements={logoElements}
          />
        )}

        {/* Core Team Section */}
        {isClient && (
          <TeamSection
            title={t('about.coreTeamTitle1') || 'Pengurus'}
            highlightTitle={t('about.coreTeamTitle2') || 'Inti'}
            subtitle={t('about.coreTeamSubtitle') || 'Para pemimpin yang menggerakkan roda organisasi dengan dedikasi tinggi'}
            warningText={t('about.coreTeamWarning') || 'Data anggota dimuat secara real-time dari database'}
            warningColor="yellow"
            members={coreTeam || []}
            onMemberClick={openModal}
            gridCols={4}
          />
        )}

        {/* Koordinator Sekbid Section */}
        {isClient && koordinatorSekbid && koordinatorSekbid.length > 0 && (
          <TeamSection
            title={t('about.deptHeadsTitle1') || 'Koordinator'}
            highlightTitle={t('about.deptHeadsTitle2') || 'Sekbid'}
            subtitle={t('about.deptHeadsSubtitle') || 'Para koordinator yang memimpin setiap seksi bidang'}
            warningText={t('about.deptHeadsWarning') || 'Data koordinator dimuat dari database'}
            warningColor="blue"
            members={koordinatorSekbid}
            onMemberClick={openModal}
            gridCols={3}
            colorVariant={true}
          />
        )}

        {/* Footer CTA Section */}
        <FooterCTASection />

        {/* Error State */}
        {fetchError && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
              <p className="font-medium">{fetchError}</p>
            </div>
          </div>
        )}

        {/* Team Member Modal */}
        {selectedMember && (
          <TeamMemberModal 
            member={selectedMember} 
            isOpen={!!selectedMember} 
            onClose={closeModal} 
          />
        )}
      </div>
    </SoundProvider>
  );
}
