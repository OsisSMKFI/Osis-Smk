"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { apiFetch, safeJson } from '@/lib/safeFetch';
import TeamMemberModal from '@/components/TeamMemberModal';
import { useTranslation } from '@/hooks/useTranslation';
import { getPageContentBatch } from '@/lib/pageContent';
import type { TeamMember } from '@/components/about/types';

const HeroSection3D = dynamic(
  () => import('@/components/about/AboutSections').then(mod => mod.HeroSection3D),
  { ssr: false, loading: () => <HeroFallback /> }
);

const StorySection = dynamic(
  () => import('@/components/about/AboutSections').then(mod => mod.StorySection),
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

const SoundProvider = dynamic(
  () => import('@/components/about/SoundEffects').then(mod => mod.SoundProvider),
  { ssr: false }
);

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

function VisionMissionSection({ db }: { db: Record<string, string> }) {
  const { t } = useTranslation();

  const visionContent = db['about_vision_content'] || t('about.visionContent') || 'Menjadi organisasi siswa yang unggul, inovatif, dan berkarakter islami dalam membentuk generasi pemimpin masa depan yang berwawasan teknologi dan berjiwa kepemimpinan.';
  const missionItems = [
    db['about_mission_1'] || t('about.mission1') || 'Mengembangkan potensi kepemimpinan siswa melalui berbagai kegiatan organisasi',
    db['about_mission_2'] || t('about.mission2') || 'Menumbuhkan kreativitas dan inovasi dalam setiap program kerja',
    db['about_mission_3'] || t('about.mission3') || 'Menanamkan nilai-nilai keislaman dalam setiap aktivitas',
    db['about_mission_4'] || t('about.mission4') || 'Membangun kerjasama yang solid antar anggota dan stakeholder',
  ].filter(Boolean);

  return (
    <section className="relative py-32 overflow-hidden bg-gray-50 dark:bg-gray-900">
      <div className="relative z-10 max-w-7xl mx-auto px-4">
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-2 text-yellow-600 dark:text-yellow-400 text-sm font-medium tracking-widest uppercase mb-4">
            <span className="w-8 h-px bg-yellow-500 dark:bg-yellow-400" />
            {db['about_visimisi_label'] || t('about.visionMissionLabel') || 'Visi & Misi'}
            <span className="w-8 h-px bg-yellow-500 dark:bg-yellow-400" />
          </span>
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            {db['about_visimisi_title'] || t('about.visionTitle') || 'Arah'}{' '}
            <span className="text-yellow-500 dark:text-yellow-400">{db['about_visimisi_title_hl'] || t('about.visionTitleHighlight') || 'Langkah Kami'}</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 md:p-10 border border-gray-200 dark:border-gray-700 h-full">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center text-white font-bold text-lg">V</div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {db['about_vision_label'] || t('about.visionLabel') || 'Visi'}
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">{visionContent}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 md:p-10 border border-gray-200 dark:border-gray-700 h-full">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">M</div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {db['about_mission_label'] || t('about.missionLabel') || 'Misi'}
                </h3>
              </div>
              <ul className="space-y-4">
                {missionItems.map((mission, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
                    <span className="flex-shrink-0 w-6 h-6 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-yellow-700 dark:text-yellow-400 text-xs font-bold mt-0.5">
                      {index + 1}
                    </span>
                    <span>{mission}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function AchievementsSection({ db }: { db: Record<string, string> }) {
  const { t } = useTranslation();
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAchievements() {
      try {
        const res = await fetch('/api/public/achievements');
        if (res.ok) {
          const data = await res.json();
          if (data.achievements && data.achievements.length > 0 && data.source === 'database') {
            setAchievements(data.achievements);
          }
        }
      } catch {}
      setLoading(false);
    }
    fetchAchievements();
  }, []);

  const fallback = [
    { year: '2024', title: t('about.achieve1Title'), description: t('about.achieve1Desc'), icon: '1' },
    { year: '2024', title: t('about.achieve2Title'), description: t('about.achieve2Desc'), icon: '2' },
    { year: '2025', title: t('about.achieve3Title'), description: t('about.achieve3Desc'), icon: '3' },
  ];

  const displayAchievements = loading ? fallback : (achievements.length > 0 ? achievements : fallback);

  return (
    <section className="relative py-20 md:py-28 overflow-hidden bg-white dark:bg-gray-900">
      <div className="relative z-10 max-w-5xl mx-auto px-4">
        <motion.div
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-flex items-center gap-2 text-yellow-600 dark:text-yellow-400 text-xs tracking-widest uppercase mb-4">
            <span className="w-8 h-px bg-yellow-500 dark:bg-yellow-400" />
            {db['about_achievements_label'] || t('about.achievementsLabel')}
            <span className="w-8 h-px bg-yellow-500 dark:bg-yellow-400" />
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white">
            {db['about_achievements_title'] || t('about.achievementsTitle')}{' '}
            <span className="text-yellow-500 dark:text-yellow-400">{db['about_achievements_title_hl'] || t('about.achievementsTitleHighlight')}</span>
          </h2>
        </motion.div>

        <div className="relative">
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
              <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-4 h-4 bg-yellow-500 dark:bg-yellow-400 rounded-full border-4 border-gray-100 dark:border-gray-900 z-10" />
              <div className={`ml-12 md:ml-0 md:w-[45%] ${index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                <span className="inline-block px-3 py-1 bg-yellow-500/10 dark:bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 text-xs font-bold rounded-full mb-2">
                  {item.year}
                </span>
                <h3 className={`text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2 ${index % 2 === 0 ? 'md:justify-end' : ''}`}>
                  <span className="text-2xl">{item.icon}</span>
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base leading-relaxed">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ValuesSection({ db }: { db: Record<string, string> }) {
  const { t } = useTranslation();

  const values = [
    {
      icon: db['about_value1_icon'] || '💡',
      title: db['about_value1_name'] || t('about.valueInnovation') || 'Inovasi',
      description: db['about_value1_desc'] || t('about.valueInnovationDesc') || 'Selalu mencari cara baru dan kreatif dalam setiap kegiatan',
      color: db['about_value1_color'] || 'from-yellow-400 to-orange-500',
    },
    {
      icon: db['about_value2_icon'] || '🤝',
      title: db['about_value2_name'] || t('about.valueIntegrity') || 'Integritas',
      description: db['about_value2_desc'] || t('about.valueIntegrityDesc') || 'Menjunjung tinggi kejujuran dan tanggung jawab',
      color: db['about_value2_color'] || 'from-blue-400 to-indigo-500',
    },
    {
      icon: db['about_value3_icon'] || '🌟',
      title: db['about_value3_name'] || t('about.valueExcellence') || 'Keunggulan',
      description: db['about_value3_desc'] || t('about.valueExcellenceDesc') || 'Berusaha memberikan yang terbaik dalam setiap aspek',
      color: db['about_value3_color'] || 'from-purple-400 to-pink-500',
    },
    {
      icon: db['about_value4_icon'] || '🕌',
      title: db['about_value4_name'] || t('about.valueIslamic') || 'Islami',
      description: db['about_value4_desc'] || t('about.valueIslamicDesc') || 'Berlandaskan nilai-nilai keislaman dalam setiap tindakan',
      color: db['about_value4_color'] || 'from-green-400 to-emerald-500',
    },
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
            ✨ {db['about_values_label'] || t('about.valuesLabel') || 'Nilai-Nilai Kami'}
          </span>
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white">
            {db['about_values_title'] || t('about.valuesTitle') || 'Prinsip'}{' '}
            <span className="text-yellow-500">{db['about_values_title_hl'] || t('about.valuesTitleHighlight') || 'yang Kami Pegang'}</span>
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
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{value.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{value.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FooterCTASection({ db }: { db: Record<string, string> }) {
  const { t } = useTranslation();

  return (
    <section className="relative py-32 overflow-hidden bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-400/30 dark:bg-yellow-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-400/30 dark:bg-amber-500/20 rounded-full blur-3xl" />
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            {db['about_cta_title'] || t('about.ctaTitle') || 'Bergabung'}{' '}
            <span className="text-yellow-600 dark:text-yellow-400">{db['about_cta_title_hl'] || t('about.ctaTitleHighlight') || 'Bersama Kami'}</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
            {db['about_cta_desc'] || t('about.ctaDescription') || 'Mari bersama-sama membangun organisasi yang lebih baik.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.a
              href="/register"
              className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-gray-900 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/30"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="relative z-10">{db['about_cta_button'] || t('about.ctaButton') || 'Daftar Sekarang'}</span>
              <span className="ml-2">→</span>
            </motion.a>
            <motion.a
              href="/info"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-gray-800 dark:text-white border border-gray-300 dark:border-white/30 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {db['about_cta_button2'] || t('about.ctaSecondaryButton') || 'Lihat Info Terkini'}
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default function AboutPageClient() {
  const { t } = useTranslation();
  const [db, setDb] = useState<Record<string, string>>({});
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [coreTeam, setCoreTeam] = useState<TeamMember[] | null>(null);
  const [koordinatorSekbid, setKoordinatorSekbid] = useState<TeamMember[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  const [logoElements, setLogoElements] = useState([
    { icon: '🏫', imageSrc: '/images/Fitrah Insani.svg', title: 'Fithrah Insani', description: 'Identitas OSIS yaitu SMK Informatika Fithrah Insani.', color: '#22c55e', gradient: 'bg-gradient-to-r from-green-500 to-emerald-600' },
    { icon: '⚡', imageSrc: '/images/Garis dan Titik.svg', title: 'Titik & Garis', description: 'Persatuan dalam perbedaan masing-masing anggota.', color: '#3b82f6', gradient: 'bg-gradient-to-r from-blue-500 to-indigo-600' },
    { icon: '🛡️', imageSrc: '/images/Perisai.svg', title: 'Perisai', description: 'Pelindung untuk melindungi seluruh anggotanya.', color: '#f59e0b', gradient: 'bg-gradient-to-r from-amber-500 to-yellow-600' },
    { icon: '✏️', imageSrc: '/images/Pensil dan pulpen.svg', title: 'Pensil & Pulpen', description: 'Anggota adalah seorang pelajar.', color: '#ef4444', gradient: 'bg-gradient-to-r from-red-500 to-rose-600' },
    { icon: '📸', imageSrc: '/images/kamera.svg', title: 'Kamera', description: 'Menegaskan pelajar yaitu pelajar multimedia.', color: '#a855f7', gradient: 'bg-gradient-to-r from-purple-500 to-violet-600' },
  ]);

  useEffect(() => {
    setIsClient(true);
    getPageContentBatch([
      'about_hero_title1', 'about_hero_title2', 'about_hero_subtitle1', 'about_hero_subtitle2', 'about_hero_scroll',
      'about_visimisi_label', 'about_visimisi_title', 'about_visimisi_title_hl',
      'about_vision_label', 'about_vision_content',
      'about_mission_label', 'about_mission_1', 'about_mission_2', 'about_mission_3', 'about_mission_4',
      'about_achievements_label', 'about_achievements_title', 'about_achievements_title_hl',
      'about_story_title1', 'about_story_title2',
      'about_philosophy_title', 'about_philosophy_hl',
      'about_philosophy_part1', 'about_philosophy_name_hl', 'about_philosophy_part2',
      'about_philosophy_sky_hl', 'about_philosophy_part3',
      'about_philosophy_desc1', 'about_philosophy_desc2',
      'about_values_label', 'about_values_title', 'about_values_title_hl',
      'about_value1_icon', 'about_value1_name', 'about_value1_desc', 'about_value1_color',
      'about_value2_icon', 'about_value2_name', 'about_value2_desc', 'about_value2_color',
      'about_value3_icon', 'about_value3_name', 'about_value3_desc', 'about_value3_color',
      'about_value4_icon', 'about_value4_name', 'about_value4_desc', 'about_value4_color',
      'about_cta_title', 'about_cta_title_hl', 'about_cta_desc', 'about_cta_button', 'about_cta_button2',
      'about_logo_title', 'about_logo_subtitle',
    ]).then(setDb);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/public/filosofi-logo');
        if (res.ok) {
          const data = await res.json();
          if (data.elements && data.elements.length > 0) {
            setLogoElements(data.elements);
          }
        }
      } catch {}
    })();
  }, []);

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
          description: m.quote || m.quotes || 'Data sedang diperbarui',
          ttl: m.ttl || '-',
          alamat: m.alamat || '-',
          motto: m.motto || '-',
          sekbidId: m.sekbid_id,
        }));

        const core = mapped.filter((m: any) => {
          const pos = (m.position || '').toLowerCase();
          return ['ketua osis', 'wakil ketua', 'sekretaris', 'bendahara'].includes(pos);
        });

        const koordinator = mapped.filter((m: any) => {
          const pos = (m.position || '').trim().toLowerCase();
          const hasSekbid = m.sekbidId !== null && typeof m.sekbidId === 'number' && m.sekbidId > 0;
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
  }, []);

  const openModal = (member: TeamMember) => setSelectedMember(member);
  const closeModal = () => setSelectedMember(null);

  return (
    <SoundProvider>
      <div className="min-h-screen bg-white dark:bg-gray-900 overflow-x-hidden scroll-smooth">
        {isClient && (
          <HeroSection3D
            title={`${db['about_hero_title1'] || t('about.heroTitle1') || 'Tentang'} ${db['about_hero_title2'] || t('about.heroTitle2') || 'DIRGANTARA 2025'}`}
            subtitle={`${db['about_hero_subtitle1'] || t('about.heroSubtitle1') || 'Mengenal lebih dekat'} ${db['about_hero_subtitle2'] || t('about.heroSubtitle2') || 'OSIS SMK Informatika - Dirgantara'}`}
            scrollText={db['about_hero_scroll'] || t('about.scrollText') || 'Scroll untuk menjelajahi'}
          />
        )}

        <AchievementsSection db={db} />

        {isClient && (
          <StorySection
            title={db['about_story_title1'] || t('about.storyTitle1') || 'Cerita'}
            highlightTitle={db['about_story_title2'] || t('about.storyTitle2') || 'Dirgantara'}
            philosophyTitle={db['about_philosophy_title'] || t('about.philosophyTitle') || 'Filosofi Nama'}
            philosophyHighlight={db['about_philosophy_hl'] || t('about.philosophyHighlight') || 'Dirgantara'}
            philosophyContent={{
              part1: db['about_philosophy_part1'] || t('about.philosophyPart1') || 'Nama',
              nameHighlight: db['about_philosophy_name_hl'] || t('about.philosophyNameHighlight') || '"Dirgantara"',
              part2: db['about_philosophy_part2'] || t('about.philosophyPart2') || 'diambil dari kata dalam bahasa Indonesia yang berarti',
              skyHighlight: db['about_philosophy_sky_hl'] || t('about.philosophySkyHighlight') || '"angkasa" atau "langit"',
              part3: db['about_philosophy_part3'] || t('about.philosophyPart3') || '. Nama ini mencerminkan visi kami yang tinggi dan luas seperti langit.'
            }}
            descriptions={[
              db['about_philosophy_desc1'] || t('about.philosophyDesc1') || 'Sebagai organisasi siswa, kami berkomitmen untuk mengembangkan kepemimpinan, kreativitas, dan nilai-nilai keislaman.',
              db['about_philosophy_desc2'] || t('about.philosophyDesc2') || 'Dengan semangat yang membara seperti matahari, kami terus bergerak maju menuju masa depan yang lebih cerah.'
            ]}
          />
        )}

        <VisionMissionSection db={db} />
        <ValuesSection db={db} />

        {isClient && (
          <InteractiveLogo3D
            logoSrc="/images/logo-2.png"
            logoAlt={db['about_logo_alt'] || t('navbar.logoAlt') || 'Logo OSIS SMK Informatika Fithrah Insani'}
            sectionTitle={db['about_logo_title'] || 'FILOSOFI LOGO OSIS'}
            sectionSubtitle={db['about_logo_subtitle'] || 'OSIS SMK INFORMATIKA FITHRAH INSANI - Setiap elemen dalam logo memiliki filosofi dan makna yang mendalam'}
            elements={logoElements}
          />
        )}

        {isClient && (
          <TeamSection
            title={db['about_core_title1'] || t('about.coreTeamTitle1') || 'Pengurus'}
            highlightTitle={db['about_core_title2'] || t('about.coreTeamTitle2') || 'Inti'}
            subtitle={db['about_core_subtitle'] || t('about.coreTeamSubtitle') || 'Para pemimpin yang menggerakkan roda organisasi'}
            warningText="✅ Data dimuat dari database"
            warningColor="green"
            members={coreTeam || []}
            onMemberClick={openModal}
            gridCols={4}
          />
        )}

        {isClient && koordinatorSekbid && koordinatorSekbid.length > 0 && (
          <TeamSection
            title={db['about_sekbid_title1'] || t('about.deptHeadsTitle1') || 'Koordinator'}
            highlightTitle={db['about_sekbid_title2'] || t('about.deptHeadsTitle2') || 'Sekbid'}
            subtitle={db['about_sekbid_subtitle'] || t('about.deptHeadsSubtitle') || 'Para koordinator yang memimpin setiap seksi bidang'}
            warningText="✅ Data dimuat dari database"
            warningColor="green"
            members={koordinatorSekbid}
            onMemberClick={openModal}
            gridCols={3}
            colorVariant={true}
          />
        )}

        <FooterCTASection db={db} />

        {fetchError && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
              <p className="font-medium">{fetchError}</p>
            </div>
          </div>
        )}

        {selectedMember && (
          <TeamMemberModal member={selectedMember} isOpen={!!selectedMember} onClose={closeModal} />
        )}
      </div>
    </SoundProvider>
  );
}
