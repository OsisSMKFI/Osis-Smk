'use client';

import ProkerSection from '@/components/ProkerSection';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/animations/AnimatedSection';
import PageHero from '@/components/animations/PageHero';
import { FaTasks } from 'react-icons/fa';
import { useTranslation } from '@/hooks/useTranslation';

export default function BidangPage() {
  const { t } = useTranslation();
  
  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <PageHero
          title={t('proker.title')}
          subtitle="OSIS SMK Informatika"
          description={t('sekbid.prokerDescription')}
          icon={<FaTasks className="w-10 h-10 text-yellow-500" />}
          gradient="yellow"
        />
        
        <AnimatedSection variant="fadeUp" delay={0.2}>
          <ProkerSection />
        </AnimatedSection>
      </main>
    </>
  );
}
