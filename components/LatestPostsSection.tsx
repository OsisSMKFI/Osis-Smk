'use client';

import AnimatedSection from './AnimatedSection';
import Link from 'next/link';
import { FaArrowRight } from 'react-icons/fa';
import { PostCard } from './cards/PostCard';
import { useHomePageContext } from '@/contexts/HomePageDataContext';
import { useTranslation } from '@/hooks/useTranslation';

export default function LatestPostsSection() {
  const { t } = useTranslation();
  const { posts, loading } = useHomePageContext();

  if (loading) {
    return (
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto mb-12" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-4">
                  <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (posts.length === 0) {
    return null; // Don't show section if no posts
  }

  return (
    <AnimatedSection id="latest-posts">
      <section data-component="latest-posts" className="py-20 relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="heading-primary text-5xl md:text-6xl lg:text-7xl text-gray-900 dark:text-gray-100 mb-6">
              {t('posts.title')} <span className="text-yellow-600 dark:text-yellow-400">{t('posts.latest')}</span>
            </h2>
            <div className="flex justify-center items-center space-x-4 mb-8">
              <div className="w-16 h-0.5 bg-yellow-400" />
              <div className="w-4 h-4 bg-yellow-400 rounded-full" />
              <div className="w-16 h-0.5 bg-yellow-400" />
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {t('posts.description')}
            </p>
          </div>

          {/* Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto mb-12">
            {posts.map((post, index) => (
              <PostCard key={post.id} post={post as any} index={index} />
            ))}
          </div>

          {/* View All Button */}
          <div className="text-center">
            <Link
              href="/posts"
              className="inline-flex items-center gap-2 px-8 py-4 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold rounded-full transition-colors duration-200 shadow-md"
            >
              {t('posts.viewAllNews')}
              <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
}
