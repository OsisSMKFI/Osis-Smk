'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { FaCalendar, FaEye } from 'react-icons/fa';
import { toPublicStorageUrl } from '@/lib/signedUrls';

interface Author {
  name: string;
  photo_url?: string | null;
}

interface Sekbid {
  name: string;
  icon: string;
  color: string;
}

interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  featured_image?: string | null;
  published_at: string;
  views: number;
  author?: Author | null;
  sekbid?: Sekbid | null;
}

interface PostCardProps {
  post: Post;
  index?: number;
}

export function PostCard({ post, index = 0 }: PostCardProps) {
  const fallbackImage = '/images/default-post.jpg';
  const imageUrl = toPublicStorageUrl(post.featured_image) || fallbackImage;
  const cardRef = useRef<HTMLDivElement>(null);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springConfig = { stiffness: 300, damping: 30 };
  const rotateXSpring = useSpring(rotateX, springConfig);
  const rotateYSpring = useSpring(rotateY, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    rotateX.set((mouseY / (rect.height / 2)) * -8);
    rotateY.set((mouseX / (rect.width / 2)) * 8);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  const blurDataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: rotateXSpring,
        rotateY: rotateYSpring,
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
      className="relative"
    >
      <Link
        href={`/posts/${post.slug}`}
        className="group block rounded-2xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300"
      >
        {/* Featured Image */}
        <div className="relative aspect-[16/9] overflow-hidden bg-gray-100 dark:bg-gray-800">
          <Image
            src={imageUrl}
            alt={post.title}
            fill
            priority={index === 0}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            placeholder="blur"
            blurDataURL={blurDataURL}
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== fallbackImage) {
                target.src = fallbackImage;
              }
            }}
          />

          {post.sekbid && (
            <div
              className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-white text-xs sm:text-sm font-semibold"
              style={{ backgroundColor: `${post.sekbid.color}E6` }}
            >
              <span className="hidden sm:inline">{post.sekbid.icon} </span>
              {post.sekbid.name}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 lg:p-7">
          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3">
            <div className="flex items-center gap-1.5">
              <FaCalendar className="text-yellow-500" />
              <span>{new Date(post.published_at).toLocaleDateString('id-ID', { 
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FaEye className="text-blue-500" />
              <span>{post.views.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors line-clamp-2 leading-tight">
            {post.title}
          </h3>

          {post.excerpt && (
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 leading-relaxed">
              {post.excerpt}
            </p>
          )}

          <div className="flex items-center gap-2.5 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700/50">
            {post.author?.photo_url ? (
              <Image
                src={post.author.photo_url}
                alt={post.author.name}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-yellow-400 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                {(post.author?.name || 'OSIS').charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
              {post.author?.name || 'OSIS'}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
