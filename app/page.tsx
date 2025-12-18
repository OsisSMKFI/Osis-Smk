import { STATIC_METADATA } from '@/lib/metadata-helper';
import DynamicHero from '@/components/DynamicHero';
import VisionCard from '@/components/VisionCard';
import GoalsSection from '@/components/GoalsSection';
import LatestPostsSection from '@/components/LatestPostsSection';
import AnnouncementsWidget from '@/components/AnnouncementsWidget';
import PollsWidget from '@/components/PollsWidget';
import { HomePageDataProvider } from '@/contexts/HomePageDataContext';
import { SectionsAnimatedBackground } from '@/components/animations/AnimatedBackground';

export const metadata = STATIC_METADATA.home;

export default function Home() {
  return (
    <HomePageDataProvider>
      <main className="min-h-screen">
        {/* Hero Section - has its own admin-controlled background image */}
        <DynamicHero />
        
        {/* Content Sections Wrapper - with animated 3D background */}
        <div className="relative">
          {/* Animated 3D Background - only for sections below hero */}
          <SectionsAnimatedBackground />
          
          {/* All content sections */}
          <div className="relative z-[1]">
            <div id="vision" className="scroll-mt-16">
              <section className="py-8 sm:py-12 lg:py-16 relative overflow-hidden">
                <VisionCard />
              </section>
            </div>

            <div id="mission" className="scroll-mt-16">
              <section className="py-8 sm:py-12 lg:py-16">
                <GoalsSection />
              </section>
            </div>

            <section className="py-8 sm:py-12 lg:py-16">
              <LatestPostsSection />
            </section>
            
            <section className="py-8 sm:py-12 lg:py-16">
              <AnnouncementsWidget />
            </section>
            
            <section className="py-8 sm:py-12 lg:py-16">
              <PollsWidget />
            </section>
          </div>
        </div>
      </main>
    </HomePageDataProvider>
  );
}
