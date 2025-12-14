"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
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

const TeamSection = dynamic(
  () => import('@/components/about/AboutSections').then(mod => mod.TeamSection),
  { ssr: false, loading: () => <SectionFallback /> }
);

// Fallback components
function HeroFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

function SectionFallback() {
  return (
    <div className="py-20 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function AboutPage() {
  const { t } = useTranslation();

  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [coreTeam, setCoreTeam] = useState<TeamMember[] | null>(null);
  const [koordinatorSekbid, setKoordinatorSekbid] = useState<TeamMember[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Check if we're on client side
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
          description: m.quote || m.quotes || t('about.coreDataPending'),
          ttl: m.ttl || '-',
          alamat: m.alamat || '-',
          motto: m.motto || '-',
        }));

        // Filter core team members
        const core = mapped.filter((m: any) => {
          const pos = (m.position || '').toLowerCase();
          return (
            pos === 'ketua osis' ||
            pos === 'wakil ketua' ||
            pos === 'sekretaris' ||
            pos === 'bendahara' ||
            pos === (t('about.positionChairman') || '').toLowerCase() ||
            pos === (t('about.positionViceChairman') || '').toLowerCase() ||
            pos === (t('about.positionSecretary') || '').toLowerCase() ||
            pos === (t('about.positionTreasurer') || '').toLowerCase()
          );
        });

        // Filter koordinator sekbid
        const koordinator = mapped.filter((m: any) => {
          const pos = (m.position || '').trim().toLowerCase();
          return pos === 'koordinator sekbid' || pos === 'kepala departemen';
        });

        if (mounted) {
          setCoreTeam(core);
          setKoordinatorSekbid(koordinator);
        }
      } catch (e) {
        if (mounted) setFetchError('Gagal memuat data anggota. Silakan refresh halaman.');
      }
    })();
    return () => { mounted = false; };
  }, [t]);

  const openModal = (member: TeamMember) => setSelectedMember(member);
  const closeModal = () => setSelectedMember(null);

  // Symbol data for the logo meaning section
  const symbolData = [
    {
      icon: '💻',
      title: t('about.symbolTech') || 'Teknologi',
      description: t('about.symbolTechDesc') || 'Melambangkan fokus pada teknologi dan informatika',
      gradient: 'bg-gradient-to-r from-blue-500 to-indigo-600'
    },
    {
      icon: '🎓',
      title: t('about.symbolEducation') || 'Pendidikan',
      description: t('about.symbolEducationDesc') || 'Komitmen pada pembelajaran dan pengembangan diri',
      gradient: 'bg-gradient-to-r from-green-500 to-emerald-600'
    },
    {
      icon: '🌟',
      title: t('about.symbolCreativity') || 'Kreativitas',
      description: t('about.symbolCreativityDesc') || 'Mendorong inovasi dan ide-ide baru',
      gradient: 'bg-gradient-to-r from-purple-500 to-pink-600'
    },
    {
      icon: '🤝',
      title: t('about.symbolCollaboration') || 'Kolaborasi',
      description: t('about.symbolCollaborationDesc') || 'Kerjasama tim yang solid dan saling mendukung',
      gradient: 'bg-gradient-to-r from-orange-500 to-red-600'
    },
    {
      icon: '🚀',
      title: t('about.symbolVision') || 'Visi',
      description: t('about.symbolVisionDesc') || 'Berwawasan ke depan dan siap menghadapi tantangan',
      gradient: 'bg-gradient-to-r from-yellow-500 to-amber-600'
    },
    {
      icon: '📖',
      title: t('about.symbolIslamic') || 'Nilai Islami',
      description: t('about.symbolIslamicDesc') || 'Berpegang teguh pada nilai-nilai keislaman',
      gradient: 'bg-gradient-to-r from-teal-500 to-cyan-600'
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 overflow-x-hidden">
      {/* Hero Section with 3D Background */}
      {isClient && (
        <HeroSection3D
          title={t('about.heroTitle') || 'Tentang Kami'}
          subtitle={t('about.heroSubtitle') || 'Organisasi Siswa Intra Sekolah SMK Informatika - Membentuk pemimpin masa depan yang berintegritas dan berwawasan teknologi'}
          scrollText={t('about.scrollText') || 'Scroll untuk menjelajahi'}
        />
      )}

      {/* Story Section - "Cerita Dirgantara" */}
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

      {/* Symbol/Logo Meaning Section */}
      {isClient && (
        <SymbolSection
          title={t('about.symbolTitle1') || 'Makna'}
          highlightTitle={t('about.symbolTitle2') || 'Logo'}
          subtitle={t('about.symbolSubtitle') || 'Setiap elemen dalam logo kami memiliki makna mendalam yang mencerminkan nilai-nilai organisasi'}
          logoSrc="/images/logo-2.png"
          logoAlt={t('navbar.logoAlt') || 'Logo OSIS'}
          logoCaption={t('about.symbolLogoCaption') || 'Logo resmi OSIS SMK Informatika'}
          logoTitle={t('about.symbolLogoTitle') || 'Elemen dalam Logo Kami'}
          symbols={symbolData}
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
          subtitle={t('about.deptHeadsSubtitle') || 'Para koordinator yang memimpin setiap seksi bidang dengan penuh tanggung jawab'}
          warningText={t('about.deptHeadsWarning') || 'Data koordinator dimuat dari database'}
          warningColor="blue"
          members={koordinatorSekbid}
          onMemberClick={openModal}
          gridCols={3}
          colorVariant={true}
        />
      )}

      {/* Error State */}
      {fetchError && (
        <div className="py-20 text-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 max-w-md mx-auto">
            <p className="text-red-600 dark:text-red-400 font-medium">{fetchError}</p>
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
  );
}
