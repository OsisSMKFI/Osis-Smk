import { STATIC_METADATA } from '@/lib/metadata-helper';
import DynamicHero from '@/components/DynamicHero';
import VisionCard from '@/components/VisionCard';
import GoalsSection from '@/components/GoalsSection';
import LatestPostsSection from '@/components/LatestPostsSection';
import AnnouncementsWidget from '@/components/AnnouncementsWidget';
import PollsWidget from '@/components/PollsWidget';
import { HomePageDataProvider } from '@/contexts/HomePageDataContext';
import {
  getPublicPageContent,
  getPublicPosts,
  getPublicAnnouncements,
  getPublicPolls,
} from '@/lib/publicData';

export const metadata = STATIC_METADATA.home;
export const revalidate = 60;

const HERO_KEYS = ['home_hero_title', 'home_hero_subtitle', 'home_hero_description'] as const;
const VISION_KEYS = [
  'site_vision_text',
  'site_vision_hl1',
  'site_vision_part2',
  'site_vision_hl2',
  'site_vision_part3',
  'site_vision_hl3',
] as const;
const GOALS_KEYS = [
  'home_goals_title',
  'home_goals_desc',
  'home_goal1_title',
  'home_goal1_desc',
  'home_goal2_title',
  'home_goal2_desc',
  'home_goal3_title',
  'home_goal3_desc',
  'home_goal4_title',
  'home_goal4_desc',
  'home_goal5_title',
  'home_goal5_desc',
  'home_goal6_title',
  'home_goal6_desc',
  'home_goals_cta_title',
  'home_goals_cta_desc',
] as const;

function pickKeys(map: Record<string, string>, keys: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of keys) {
    if (map[key]) out[key] = map[key];
  }
  return out;
}

export default async function Home() {
  let pageContent: Record<string, string> = {};
  let posts: any[] = [];
  let announcements: any[] = [];
  let polls: any[] = [];

  try {
    const [content, postData, announcementData, pollData] = await Promise.all([
      getPublicPageContent(),
      getPublicPosts(3),
      getPublicAnnouncements(5),
      getPublicPolls(30),
    ]);
    pageContent = content;
    posts = postData;
    announcements = announcementData;
    polls = pollData;
  } catch {
    // ISR soft-fail: render with client fallbacks
  }

  return (
    <HomePageDataProvider
      initial={{
        posts: posts as any,
        announcements: announcements as any,
        polls: polls as any,
      }}
    >
      <main className="min-h-screen">
        <DynamicHero initialContent={pickKeys(pageContent, HERO_KEYS)} />

        <div className="relative z-[1]">
          <div id="vision" className="scroll-mt-16">
            <section className="py-8 sm:py-12 lg:py-16 relative overflow-hidden">
              <VisionCard initialContent={pickKeys(pageContent, VISION_KEYS)} />
            </section>
          </div>

          <div id="mission" className="scroll-mt-16">
            <section className="py-8 sm:py-12 lg:py-16">
              <GoalsSection initialContent={pickKeys(pageContent, GOALS_KEYS)} />
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
