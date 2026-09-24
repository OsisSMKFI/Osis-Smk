'use client';

import { useEffect, useState } from 'react';
import { apiFetch, safeJson } from '@/lib/safeFetch';
import { FaNewspaper, FaCalendar, FaEye, FaArrowRight } from 'react-icons/fa';
import MediaRenderer from '@/components/MediaRenderer';
import ContentInteractions from '@/components/ContentInteractions';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  featured_image?: string;
  status: string;
  is_featured: boolean;
  published_at: string;
  created_at: string;
  views: number;
}

interface PostsPageClientProps {
  initialPosts?: Post[];
}

export default function PostsPageClient({ initialPosts = [] }: PostsPageClientProps = {}) {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [loading, setLoading] = useState(initialPosts.length === 0);
  const [filter, setFilter] = useState<'all' | 'featured'>('all');

  useEffect(() => {
    if (initialPosts.length > 0 && filter === 'all') {
      setLoading(false);
      return;
    }
    const fetchPosts = async () => {
      try {
        const url = filter === 'featured' 
          ? '/api/posts?featured=true&limit=24'
          : '/api/posts?limit=24';
        const response = await apiFetch(url);
        if (response.ok) {
          const data = await safeJson(response, { url, method: 'GET' });
          setPosts(data.posts || []);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [filter, initialPosts.length]);

  if (loading) {
    return (
      <div className="page-content">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('posts.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-yellow-500 to-amber-600 text-white overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <FaNewspaper className="text-6xl mx-auto mb-6" />
            <h1 className="text-5xl font-bold mb-6">
              {t('posts.title')}
            </h1>
            <p className="text-xl text-blue-100">
              {t('posts.description')}
            </p>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="sticky top-16 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {t('posts.allNews')}
              </button>
              <button
                onClick={() => setFilter('featured')}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  filter === 'featured'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {t('posts.featured')}
              </button>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {posts.length} {t('posts.title').toLowerCase()}
            </div>
          </div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="container mx-auto px-4 py-12">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <FaNewspaper className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500">{t('posts.noNews')}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article
                key={post.id}
                className="group bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden"
              >
                {/* Featured Image - Always show with fallback */}
                <Link href={`/posts/${post.slug}`} className="relative h-56 w-full overflow-hidden block">
                  <MediaRenderer
                    src={post.featured_image || ''}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    controlsForVideo={false}
                    autoPlay={false}
                    loop
                    muted
                  />
                  {post.is_featured && (
                    <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-10">
                      UNGGULAN
                    </div>
                  )}
                  {/* Video indicator badge */}
                  {post.featured_image && /\.(mp4|webm|ogg)$/i.test(post.featured_image) && (
                    <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 z-10">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                      VIDEO
                    </div>
                  )}
                </Link>

                <div className="p-6">
                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <div className="flex items-center gap-1">
                      <FaCalendar className="text-xs" />
                      {new Date(post.published_at || post.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="flex items-center gap-1">
                      <FaEye className="text-xs" />
                      {post.views || 0}
                    </div>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-bold mb-3 text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {post.title}
                  </h2>

                  {/* Excerpt */}
                  {post.excerpt && (
                    <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}

                  {/* Read More Button */}
                  <Link
                    href={`/posts/${post.slug}`}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors group"
                  >
                    {t('posts.readMore')}
                    <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  
                  {/* Interactions */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <ContentInteractions
                      contentId={post.id}
                      contentType="post"
                      contentTitle={post.title}
                      contentUrl={`/posts/${post.slug}`}
                      initialLikes={0}
                      initialComments={0}
                      isLiked={false}
                      mode="list"
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
