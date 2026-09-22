import { STATIC_METADATA } from '@/lib/metadata-helper';
import DynamicHero from '@/components/DynamicHero';
import VisionCard from '@/components/VisionCard';
import GoalsSection from '@/components/GoalsSection';
import LatestPostsSection from '@/components/LatestPostsSection';
import AnnouncementsWidget from '@/components/AnnouncementsWidget';
import PollsWidget from '@/components/PollsWidget';
import { HomePageDataProvider } from '@/contexts/HomePageDataContext';

export const metadata = STATIC_METADATA.home;

export default function Home() {
  return (
    <HomePageDataProvider>
      <main className="min-h-screen">
        <DynamicHero />

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
      </main>
    </HomePageDataProvider>
  );
}
