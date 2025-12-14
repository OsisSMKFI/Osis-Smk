'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { SOCIAL_MEDIA_CONFIG } from '@/lib/socialMediaConfig';
import { useSocialMediaData } from '@/lib/hooks/useSocialMediaData';
import Image from 'next/image';

// Floating social icons component
const FloatingIcon = ({ icon, color, delay, className }: { icon: string; color: string; delay: number; className?: string }) => (
  <motion.div
    className={`absolute text-4xl md:text-6xl opacity-10 ${className}`}
    initial={{ y: 0 }}
    animate={{ y: [-10, 10, -10] }}
    transition={{ duration: 4, repeat: Infinity, delay }}
    style={{ color }}
  >
    <i className={icon} />
  </motion.div>
);

// Platform card with hover effects
const PlatformCard = ({ 
  platform, 
  icon, 
  url, 
  followers, 
  gradient, 
  description,
  isActive,
  index 
}: {
  platform: string;
  icon: string;
  url: string;
  followers: string | number;
  gradient: string;
  description: string;
  isActive: boolean;
  index: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`
        relative overflow-hidden rounded-3xl p-8 md:p-10 
        bg-gradient-to-br ${gradient}
        transform transition-all duration-500 ease-out
        ${isHovered ? 'scale-[1.02] shadow-2xl' : 'shadow-lg'}
      `}>
        {/* Animated background circles */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full"
            animate={{ scale: isHovered ? 1.5 : 1 }}
            transition={{ duration: 0.5 }}
          />
          <motion.div
            className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full"
            animate={{ scale: isHovered ? 1.3 : 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Icon */}
          <motion.div
            className="mb-6"
            animate={{ rotate: isHovered ? 360 : 0 }}
            transition={{ duration: 0.6 }}
          >
            <i className={`${icon} text-5xl md:text-6xl text-white drop-shadow-lg`} />
          </motion.div>

          {/* Platform name */}
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">{platform}</h3>
          
          {/* Description */}
          <p className="text-white/80 text-sm md:text-base mb-6 line-clamp-2">{description}</p>

          {/* Stats */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-white">{followers}</div>
              <div className="text-white/60 text-sm">
                {platform === 'YouTube' ? 'Subscribers' : 'Followers'}
              </div>
            </div>
            
            {/* Arrow */}
            <motion.div
              className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center"
              animate={{ x: isHovered ? 5 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <i className="fas fa-arrow-right text-white text-lg" />
            </motion.div>
          </div>

          {/* Status badge */}
          {!isActive && (
            <div className="absolute top-4 right-4 px-3 py-1 bg-white/20 rounded-full text-xs text-white/80">
              Coming Soon
            </div>
          )}
        </div>
      </div>
    </motion.a>
  );
};

// Stat counter with animation
const AnimatedCounter = ({ value, label, icon, color }: { value: string | number; label: string; icon: string; color: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    
    const numValue = typeof value === 'string' ? parseInt(value.replace(/\D/g, '')) || 0 : value;
    const duration = 2000;
    const steps = 60;
    const increment = numValue / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= numValue) {
        setCount(numValue);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, isVisible]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <motion.div
      ref={ref}
      className="text-center p-6"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={isVisible ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5 }}
    >
      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${color}`}>
        <i className={`${icon} text-2xl text-white`} />
      </div>
      <div className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
        {typeof value === 'string' && value.includes('+') 
          ? `${formatNumber(count)}+`
          : formatNumber(count)
        }
      </div>
      <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">{label}</div>
    </motion.div>
  );
};

// Content preview card
const ContentPreview = ({ 
  title, 
  platform, 
  thumbnail, 
  url,
  metric 
}: { 
  title: string; 
  platform: string; 
  thumbnail?: string; 
  url?: string;
  metric?: string | number;
}) => (
  <motion.a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className="group block bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
    whileHover={{ y: -5 }}
  >
    {/* Thumbnail */}
    <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 overflow-hidden">
      {thumbnail ? (
        <Image
          src={thumbnail}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          unoptimized
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <i className={`fab fa-${platform.toLowerCase()} text-5xl text-gray-300 dark:text-gray-500`} />
        </div>
      )}
      
      {/* Platform badge */}
      <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg">
        <i className={`fab fa-${platform.toLowerCase()} text-white text-sm`} />
      </div>

      {/* Metric badge */}
      {metric && (
        <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-white text-xs font-medium">
          {typeof metric === 'number' ? metric.toLocaleString() : metric}
        </div>
      )}
    </div>

    {/* Title */}
    <div className="p-4">
      <p className="text-gray-900 dark:text-white font-medium text-sm line-clamp-2 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
        {title}
      </p>
    </div>
  </motion.a>
);

// Main component
const ClientOurSocialMediaPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'all' | 'instagram' | 'youtube' | 'tiktok' | 'spotify'>('all');
  const { instagramPosts, youtubeVideos, spotifyContent, tiktokVideos, loading } = useSocialMediaData();

  const socialPlatforms = [
    {
      platform: 'Instagram',
      icon: 'fab fa-instagram',
      description: t('socialMediaPage.instagramDesc') || 'Follow our journey through photos and stories',
      url: SOCIAL_MEDIA_CONFIG.instagram.url,
      gradient: 'from-purple-600 via-pink-600 to-orange-500',
      followers: SOCIAL_MEDIA_CONFIG.instagram.followers,
      isActive: SOCIAL_MEDIA_CONFIG.instagram.isActive
    },
    {
      platform: 'YouTube',
      icon: 'fab fa-youtube',
      description: t('socialMediaPage.youtubeDesc') || 'Watch our videos and subscribe for more',
      url: SOCIAL_MEDIA_CONFIG.youtube.url,
      gradient: 'from-red-600 to-red-500',
      followers: SOCIAL_MEDIA_CONFIG.youtube.subscribers,
      isActive: SOCIAL_MEDIA_CONFIG.youtube.isActive
    },
    {
      platform: 'TikTok',
      icon: 'fab fa-tiktok',
      description: t('socialMediaPage.tiktokDesc') || 'Short videos, big moments',
      url: SOCIAL_MEDIA_CONFIG.tiktok.url,
      gradient: 'from-gray-900 via-pink-600 to-cyan-400',
      followers: SOCIAL_MEDIA_CONFIG.tiktok.followers,
      isActive: SOCIAL_MEDIA_CONFIG.tiktok.isActive
    },
    {
      platform: 'Spotify',
      icon: 'fab fa-spotify',
      description: t('socialMediaPage.spotifyDesc') || 'Listen to our podcasts and playlists',
      url: SOCIAL_MEDIA_CONFIG.spotify.url,
      gradient: 'from-green-600 to-green-500',
      followers: SOCIAL_MEDIA_CONFIG.spotify.followers,
      isActive: SOCIAL_MEDIA_CONFIG.spotify.isActive
    }
  ];

  // Combined content for previews
  const allContent = React.useMemo(() => {
    const items: any[] = [];

    (instagramPosts || []).forEach((p: any) => {
      items.push({
        id: p.id || Math.random().toString(),
        platform: 'Instagram',
        title: p.caption || p.title || 'Instagram Post',
        thumbnail: p.image || p.thumbnail || p.media_url,
        url: p.url || p.permalink,
        metric: (p.likes || 0) + (p.comments || 0)
      });
    });

    (youtubeVideos || []).forEach((v: any) => {
      const thumb = v.thumbnail || (Array.isArray(v.thumbnails) ? v.thumbnails[0]?.url : undefined);
      items.push({
        id: v.id || Math.random().toString(),
        platform: 'YouTube',
        title: v.title || 'YouTube Video',
        thumbnail: thumb,
        url: v.url || (v.id ? `https://youtube.com/watch?v=${v.id}` : undefined),
        metric: v.views || v.viewCount
      });
    });

    (tiktokVideos || []).forEach((t: any) => {
      items.push({
        id: t.id || Math.random().toString(),
        platform: 'TikTok',
        title: t.caption || t.title || 'TikTok Video',
        thumbnail: t.thumbnail || t.cover,
        url: t.url || t.shareUrl,
        metric: t.playCount || t.views
      });
    });

    return items.slice(0, 12);
  }, [instagramPosts, youtubeVideos, tiktokVideos]);

  const filteredContent = activeTab === 'all' 
    ? allContent 
    : allContent.filter(c => c.platform.toLowerCase() === activeTab);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[60vh] md:min-h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500">
          {/* Floating icons */}
          <FloatingIcon icon="fab fa-instagram" color="#E1306C" delay={0} className="top-[10%] left-[10%]" />
          <FloatingIcon icon="fab fa-youtube" color="#FF0000" delay={0.5} className="top-[20%] right-[15%]" />
          <FloatingIcon icon="fab fa-tiktok" color="#000000" delay={1} className="bottom-[30%] left-[20%]" />
          <FloatingIcon icon="fab fa-spotify" color="#1DB954" delay={1.5} className="bottom-[20%] right-[10%]" />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-50 dark:to-gray-900" />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="inline-block mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="w-20 h-20 md:w-24 md:h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto">
                <i className="fas fa-hashtag text-4xl md:text-5xl text-white" />
              </div>
            </motion.div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
              {t('socialMediaPage.title') || 'Connect With Us'}
            </h1>
            
            <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto mb-10">
              {t('socialMediaPage.subtitle') || 'Follow our journey across all social platforms'}
            </p>

            {/* Quick follow buttons */}
            <motion.div
              className="flex flex-wrap justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {socialPlatforms.map((p) => (
                <motion.a
                  key={p.platform}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full border border-white/20 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <i className={`${p.icon} text-white text-xl`} />
                  <span className="text-white font-medium hidden sm:inline">{p.platform}</span>
                </motion.a>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
        >
          <i className="fas fa-chevron-down text-white/60 text-2xl" />
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-24 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our Community
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Growing every day with your support
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <AnimatedCounter 
              value={SOCIAL_MEDIA_CONFIG.instagram.followers} 
              label="Instagram" 
              icon="fab fa-instagram"
              color="bg-gradient-to-br from-purple-500 to-pink-500"
            />
            <AnimatedCounter 
              value={SOCIAL_MEDIA_CONFIG.youtube.subscribers} 
              label="YouTube" 
              icon="fab fa-youtube"
              color="bg-red-500"
            />
            <AnimatedCounter 
              value={SOCIAL_MEDIA_CONFIG.tiktok.followers} 
              label="TikTok" 
              icon="fab fa-tiktok"
              color="bg-gray-900 dark:bg-gray-700"
            />
            <AnimatedCounter 
              value={SOCIAL_MEDIA_CONFIG.spotify.followers} 
              label="Spotify" 
              icon="fab fa-spotify"
              color="bg-green-500"
            />
          </div>
        </div>
      </section>

      {/* Platform Cards */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Our Platforms
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Pick your favorite platform and follow along
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {socialPlatforms.map((platform, index) => (
              <PlatformCard key={platform.platform} {...platform} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Latest Content */}
      {allContent.length > 0 && (
        <section className="py-16 md:py-24 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Latest Content
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-8">
                Fresh posts from our social channels
              </p>

              {/* Tab filters */}
              <div className="flex flex-wrap justify-center gap-2">
                {['all', 'instagram', 'youtube', 'tiktok', 'spotify'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as typeof activeTab)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      activeTab === tab
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {filteredContent.map((content) => (
                  <ContentPreview key={content.id} {...content} />
                ))}
              </motion.div>
            </AnimatePresence>

            {loading && (
              <div className="flex justify-center py-12">
                <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            className="relative max-w-4xl mx-auto bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 rounded-3xl p-10 md:p-16 text-center overflow-hidden"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                className="inline-block mb-6"
              >
                <i className="fas fa-heart text-5xl text-white" />
              </motion.div>

              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Be Part of Our Story
              </h2>
              <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
                Join our growing community and never miss an update. Follow us on your favorite platform!
              </p>

              <div className="flex flex-wrap justify-center gap-3">
                {socialPlatforms.map((p) => (
                  <motion.a
                    key={p.platform}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-white text-gray-900 rounded-full font-semibold hover:bg-yellow-50 transition-all duration-300 flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <i className={p.icon} />
                    <span>{p.platform}</span>
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ClientOurSocialMediaPage;
