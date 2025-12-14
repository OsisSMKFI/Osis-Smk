'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useScroll, useTransform } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { SOCIAL_MEDIA_CONFIG } from '@/lib/socialMediaConfig';
import { fetchSocialMediaConfig, type SocialMediaFullConfig } from '@/lib/socialMediaConfig.client';
import { useSocialMediaData } from '@/lib/hooks/useSocialMediaData';
import Image from 'next/image';

// ============================================
// SOUND EFFECTS HOOK
// ============================================
const useSoundEffects = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current && typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playHoverSound = useCallback(() => {
    if (!isSoundEnabled) return;
    const ctx = initAudioContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  }, [isSoundEnabled, initAudioContext]);

  const playClickSound = useCallback(() => {
    if (!isSoundEnabled) return;
    const ctx = initAudioContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.setValueAtTime(600, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
    
    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
  }, [isSoundEnabled, initAudioContext]);

  const playSuccessSound = useCallback(() => {
    if (!isSoundEnabled) return;
    const ctx = initAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.2);
      
      oscillator.start(ctx.currentTime + i * 0.1);
      oscillator.stop(ctx.currentTime + i * 0.1 + 0.2);
    });
  }, [isSoundEnabled, initAudioContext]);

  return { playHoverSound, playClickSound, playSuccessSound, isSoundEnabled, setIsSoundEnabled };
};

// ============================================
// 3D TILT CARD COMPONENT
// ============================================
const Tilt3DCard = ({ 
  children, 
  className = '',
  intensity = 15,
}: { 
  children: React.ReactNode; 
  className?: string;
  intensity?: number;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
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
    
    const rotateXValue = (mouseY / (rect.height / 2)) * -intensity;
    const rotateYValue = (mouseX / (rect.width / 2)) * intensity;
    
    rotateX.set(rotateXValue);
    rotateY.set(rotateYValue);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      className={`relative ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: rotateXSpring,
        rotateY: rotateYSpring,
        transformStyle: 'preserve-3d',
      }}
    >
      {children}
      {isHovered && (
        <div className="absolute inset-0 pointer-events-none rounded-[inherit] bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-50" />
      )}
    </motion.div>
  );
};

// ============================================
// FLOATING PARTICLES
// ============================================
const FloatingParticles = () => {
  const particles = useMemo(() => 
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      size: Math.random() * 4 + 2,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 5,
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-white/30"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

// ============================================
// GRADIENT ORB
// ============================================
const GradientOrb = ({ 
  className, 
  colors, 
  size = 300,
}: { 
  className?: string; 
  colors: string[]; 
  size?: number;
}) => (
  <motion.div
    className={`absolute rounded-full pointer-events-none blur-3xl ${className}`}
    style={{
      width: size,
      height: size,
      background: `linear-gradient(135deg, ${colors.join(', ')})`,
      opacity: 0.6,
    }}
    animate={{
      scale: [1, 1.2, 1],
      x: [0, 20, 0],
      y: [0, -15, 0],
    }}
    transition={{
      duration: 8,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  />
);

// ============================================
// 3D PLATFORM CARD
// ============================================
const PlatformCard3D = ({ 
  platform, 
  icon, 
  url, 
  followers, 
  gradient, 
  description,
  username,
  isActive,
  index 
}: {
  platform: string;
  icon: string;
  url: string;
  followers: string | number;
  gradient: string;
  description: string;
  username?: string;
  isActive: boolean;
  index: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const formatFollowers = (num: number | string) => {
    const value = typeof num === 'string' ? parseInt(num) : num;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
    >
      <Tilt3DCard intensity={8} className="h-full">
        <motion.a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative block h-full"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className={`
            relative overflow-hidden rounded-3xl p-6 md:p-8 h-full min-h-[300px]
            bg-gradient-to-br ${gradient}
            shadow-xl hover:shadow-2xl transition-shadow duration-500
          `}>
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                className="absolute -right-16 -top-16 w-48 h-48 bg-white/10 rounded-full blur-2xl"
                animate={{ 
                  scale: isHovered ? 1.5 : 1,
                  rotate: isHovered ? 90 : 0,
                }}
                transition={{ duration: 0.6 }}
              />
              <motion.div
                className="absolute -left-16 -bottom-16 w-40 h-40 bg-white/10 rounded-full blur-xl"
                animate={{ 
                  scale: isHovered ? 1.3 : 1,
                }}
                transition={{ duration: 0.6, delay: 0.1 }}
              />
              
              {/* Grid pattern */}
              <div 
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <motion.div
                  animate={{ 
                    rotateY: isHovered ? 360 : 0,
                    scale: isHovered ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                    <i className={`${icon} text-2xl md:text-3xl text-white drop-shadow-lg`} />
                  </div>
                </motion.div>

                {!isActive ? (
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium text-white/90">
                    Coming Soon
                  </span>
                ) : (
                  <motion.span 
                    className="px-3 py-1 bg-green-500/40 backdrop-blur-sm rounded-full text-xs font-medium text-white flex items-center gap-1.5"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    Active
                  </motion.span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-1">{platform}</h3>
                {username && (
                  <p className="text-white/70 text-sm mb-3 truncate">{username}</p>
                )}
                <p className="text-white/80 text-sm md:text-base line-clamp-2">{description}</p>
              </div>

              {/* Footer */}
              <div className="flex items-end justify-between mt-6 pt-4 border-t border-white/20">
                <div>
                  <motion.div 
                    className="text-3xl md:text-4xl font-bold text-white"
                    animate={isHovered ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {formatFollowers(followers)}
                  </motion.div>
                  <div className="text-white/60 text-sm">
                    {platform === 'YouTube' ? 'Subscribers' : 'Followers'}
                  </div>
                </div>
                
                <motion.div
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/20 backdrop-blur-sm rounded-full"
                  animate={{ x: isHovered ? 5 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="text-white text-sm font-medium hidden sm:inline">Follow</span>
                  <i className="fas fa-arrow-right text-white" />
                </motion.div>
              </div>
            </div>

            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full pointer-events-none"
              animate={isHovered ? { translateX: '100%' } : { translateX: '-100%' }}
              transition={{ duration: 0.6 }}
            />
          </div>
        </motion.a>
      </Tilt3DCard>
    </motion.div>
  );
};

// ============================================
// ANIMATED COUNTER
// ============================================
const AnimatedCounter = ({ 
  value, 
  label, 
  icon, 
  gradient,
  delay = 0 
}: { 
  value: string | number; 
  label: string; 
  icon: string; 
  gradient: string;
  delay?: number;
}) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
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
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <Tilt3DCard intensity={6} className="h-full">
        <div className="relative p-6 md:p-8 rounded-3xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow overflow-hidden group">
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
          
          <motion.div
            className={`inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${gradient} mb-4 shadow-lg`}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <i className={`${icon} text-xl md:text-2xl text-white`} />
          </motion.div>
          
          <div className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-2">
            {formatNumber(count)}
          </div>
          
          <div className="text-gray-500 dark:text-gray-400 text-sm font-medium">{label}</div>
        </div>
      </Tilt3DCard>
    </motion.div>
  );
};

// ============================================
// CONTENT PREVIEW CARD
// ============================================
const ContentPreviewCard = ({ 
  title, 
  platform, 
  thumbnail, 
  url,
  metric,
  index 
}: { 
  title: string; 
  platform: string; 
  thumbnail?: string; 
  url?: string;
  metric?: string | number;
  index: number;
}) => {
  const platformColors: Record<string, string> = {
    Instagram: 'from-purple-500 via-pink-500 to-orange-500',
    YouTube: 'from-red-500 to-red-600',
    TikTok: 'from-gray-900 via-pink-500 to-cyan-400',
    Spotify: 'from-green-500 to-green-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Tilt3DCard intensity={10}>
        <motion.a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="group block bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
          whileHover={{ y: -8 }}
        >
          <div className="relative aspect-square overflow-hidden">
            {thumbnail ? (
              <Image
                src={thumbnail}
                alt={title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                unoptimized
              />
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br ${platformColors[platform] || 'from-gray-400 to-gray-500'} flex items-center justify-center`}>
                <motion.i 
                  className={`fab fa-${platform.toLowerCase()} text-5xl md:text-6xl text-white/80`}
                  whileHover={{ scale: 1.2, rotate: 10 }}
                />
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <motion.div 
              className={`absolute top-3 left-3 px-2.5 py-1.5 bg-gradient-to-r ${platformColors[platform] || 'from-gray-500 to-gray-600'} rounded-lg shadow-lg`}
              whileHover={{ scale: 1.1 }}
            >
              <i className={`fab fa-${platform.toLowerCase()} text-white text-sm`} />
            </motion.div>

            {metric !== undefined && metric !== null && (
              <div className="absolute bottom-3 right-3 px-2.5 py-1.5 bg-black/70 backdrop-blur-sm rounded-lg text-white text-xs font-medium flex items-center gap-1">
                <i className="fas fa-eye text-[10px]" />
                {typeof metric === 'number' ? metric.toLocaleString() : metric}
              </div>
            )}

            {(platform === 'YouTube' || platform === 'TikTok') && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                whileHover={{ scale: 1.1 }}
              >
                <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-xl">
                  <i className="fas fa-play text-gray-900 text-lg ml-1" />
                </div>
              </motion.div>
            )}
          </div>

          <div className="p-4">
            <p className="text-gray-900 dark:text-white font-medium text-sm line-clamp-2 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
              {title}
            </p>
          </div>
        </motion.a>
      </Tilt3DCard>
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const ClientOurSocialMediaPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'all' | 'instagram' | 'youtube' | 'tiktok' | 'spotify'>('all');
  const { instagramPosts, youtubeVideos, tiktokVideos, loading } = useSocialMediaData();
  
  const [config, setConfig] = useState<SocialMediaFullConfig>(SOCIAL_MEDIA_CONFIG);
  const [configLoading, setConfigLoading] = useState(true);
  
  // Sound effects
  const { playHoverSound, playClickSound, playSuccessSound, isSoundEnabled, setIsSoundEnabled } = useSoundEffects();
  
  // Scroll progress for parallax
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const dynamicConfig = await fetchSocialMediaConfig();
        setConfig(dynamicConfig);
      } catch (error) {
        console.error('Failed to load social media config:', error);
        setConfig(SOCIAL_MEDIA_CONFIG);
      } finally {
        setConfigLoading(false);
      }
    };
    loadConfig();
  }, []);

  const socialPlatforms = useMemo(() => [
    {
      platform: 'Instagram',
      icon: 'fab fa-instagram',
      description: t('socialMediaPage.instagramDesc') || 'Follow our journey through photos and stories',
      url: config.instagram.url,
      gradient: 'from-purple-600 via-pink-600 to-orange-500',
      followers: config.instagram.followers,
      username: config.instagram.username,
      isActive: config.instagram.isActive
    },
    {
      platform: 'YouTube',
      icon: 'fab fa-youtube',
      description: t('socialMediaPage.youtubeDesc') || 'Watch our videos and subscribe for more',
      url: config.youtube.url,
      gradient: 'from-red-600 to-red-500',
      followers: config.youtube.subscribers,
      username: config.youtube.channelName,
      isActive: config.youtube.isActive
    },
    {
      platform: 'TikTok',
      icon: 'fab fa-tiktok',
      description: t('socialMediaPage.tiktokDesc') || 'Short videos, big moments',
      url: config.tiktok.url,
      gradient: 'from-gray-900 via-pink-600 to-cyan-400',
      followers: config.tiktok.followers,
      username: config.tiktok.username,
      isActive: config.tiktok.isActive
    },
    {
      platform: 'Spotify',
      icon: 'fab fa-spotify',
      description: t('socialMediaPage.spotifyDesc') || 'Listen to our podcasts and playlists',
      url: config.spotify.url,
      gradient: 'from-green-600 to-green-500',
      followers: config.spotify.followers,
      username: config.spotify.username,
      isActive: config.spotify.isActive
    }
  ], [config, t]);

  const allContent = useMemo(() => {
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

  const totalFollowers = useMemo(() => {
    return (
      config.instagram.followers +
      config.youtube.subscribers +
      config.tiktok.followers +
      config.spotify.followers
    );
  }, [config]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      {/* Sound Toggle Button */}
      <motion.button
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-white dark:bg-gray-800 shadow-xl flex items-center justify-center border border-gray-200 dark:border-gray-700 hover:scale-110 transition-transform"
        onClick={() => {
          setIsSoundEnabled(!isSoundEnabled);
          playClickSound();
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        title={isSoundEnabled ? 'Mute sounds' : 'Enable sounds'}
      >
        <i className={`fas ${isSoundEnabled ? 'fa-volume-up text-yellow-500' : 'fa-volume-mute text-gray-400'} text-xl`} />
      </motion.button>

      {/* HERO SECTION */}
      <motion.section 
        className="relative min-h-[85vh] md:min-h-screen flex items-center justify-center overflow-hidden"
        style={{ opacity: heroOpacity, scale: heroScale }}
      >
        {/* Animated background */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600"
            animate={{
              background: [
                'linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ea580c 100%)',
                'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #f59e0b 100%)',
                'linear-gradient(135deg, #ea580c 0%, #f59e0b 50%, #f97316 100%)',
              ],
            }}
            transition={{ duration: 10, repeat: Infinity, repeatType: 'reverse' }}
          />
          
          <GradientOrb className="-top-32 -left-32" colors={['#ec4899', '#8b5cf6']} size={400} />
          <GradientOrb className="-bottom-32 -right-32" colors={['#06b6d4', '#3b82f6']} size={350} />
          <GradientOrb className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" colors={['#fbbf24', '#f97316']} size={500} />
        </div>

        <FloatingParticles />

        {/* Grid overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-50 dark:to-gray-900" />

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 text-center py-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Social Icons */}
            <motion.div 
              className="flex justify-center gap-3 md:gap-5 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {[
                { icon: 'fab fa-instagram', gradient: 'from-purple-500 via-pink-500 to-orange-500' },
                { icon: 'fab fa-youtube', gradient: 'from-red-500 to-red-600' },
                { icon: 'fab fa-tiktok', gradient: 'from-gray-800 via-pink-500 to-cyan-400' },
                { icon: 'fab fa-spotify', gradient: 'from-green-500 to-green-600' },
              ].map((item, i) => (
                <motion.div
                  key={item.icon}
                  initial={{ scale: 0, rotateY: -180 }}
                  animate={{ scale: 1, rotateY: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 * i }}
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  className="relative"
                >
                  <div className={`absolute inset-0 rounded-xl blur-lg bg-gradient-to-br ${item.gradient} opacity-60`} />
                  <div className={`relative w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-xl`}>
                    <i className={`${item.icon} text-xl md:text-2xl text-white`} />
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Title */}
            <motion.h1 
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white mb-6 tracking-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{ textShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
            >
              {t('socialMediaPage.title') || 'Connect With Us'}
            </motion.h1>
            
            <motion.p 
              className="text-lg sm:text-xl md:text-2xl text-white/90 max-w-2xl mx-auto mb-10 px-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {t('socialMediaPage.subtitle') || 'Follow our journey across all social platforms'}
            </motion.p>

            {/* Total followers pill */}
            <motion.div
              className="inline-flex items-center gap-3 px-6 py-3 bg-white/15 backdrop-blur-md rounded-full border border-white/25 mb-10"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <span className="text-white/80">Total Community</span>
              <span className="text-2xl font-bold text-white">{totalFollowers.toLocaleString()}+</span>
            </motion.div>

            {/* Platform buttons */}
            <motion.div
              className="flex flex-wrap justify-center gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              {socialPlatforms.map((p, i) => (
                <motion.a
                  key={p.platform}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-3 bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-full border border-white/25 transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                >
                  <i className={`${p.icon} text-white text-lg`} />
                  <span className="text-white font-medium text-sm md:text-base">{p.platform}</span>
                </motion.a>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-white/60 text-xs uppercase tracking-widest">Scroll</span>
            <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
              <motion.div
                className="w-1.5 h-1.5 bg-white rounded-full"
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* STATS SECTION */}
      <section className="py-16 md:py-24 bg-white dark:bg-gray-800 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-yellow-100 dark:bg-yellow-900/20 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-orange-100 dark:bg-orange-900/20 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center mb-12 md:mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.span 
              className="inline-block px-4 py-1.5 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 rounded-full text-sm font-medium mb-4"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              Our Community
            </motion.span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Growing Every Day
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Join our amazing community across all platforms
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
            <AnimatedCounter 
              value={config.instagram.followers} 
              label="Instagram" 
              icon="fab fa-instagram"
              gradient="from-purple-500 via-pink-500 to-orange-500"
              delay={0}
            />
            <AnimatedCounter 
              value={config.youtube.subscribers} 
              label="YouTube" 
              icon="fab fa-youtube"
              gradient="from-red-500 to-red-600"
              delay={0.1}
            />
            <AnimatedCounter 
              value={config.tiktok.followers} 
              label="TikTok" 
              icon="fab fa-tiktok"
              gradient="from-gray-700 to-gray-900"
              delay={0.2}
            />
            <AnimatedCounter 
              value={config.spotify.followers} 
              label="Spotify" 
              icon="fab fa-spotify"
              gradient="from-green-500 to-green-600"
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* PLATFORM CARDS */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-5 dark:opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="text-center mb-12 md:mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.span 
              className="inline-block px-4 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium mb-4"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              Our Platforms
            </motion.span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Follow Us Everywhere
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Pick your favorite platform and stay connected
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
            {socialPlatforms.map((platform, index) => (
              <PlatformCard3D key={platform.platform} {...platform} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* LATEST CONTENT */}
      {(allContent.length > 0 || loading) && (
        <section className="py-16 md:py-24 bg-white dark:bg-gray-800 relative overflow-hidden">
          <div className="absolute top-1/2 left-0 w-64 h-64 bg-purple-100 dark:bg-purple-900/20 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <div className="absolute top-1/4 right-0 w-64 h-64 bg-pink-100 dark:bg-pink-900/20 rounded-full translate-x-1/2 blur-3xl" />
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <motion.span 
                className="inline-block px-4 py-1.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium mb-4"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
              >
                Latest Content
              </motion.span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Fresh From Our Feed
              </h2>
              <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto mb-8">
                Check out our latest posts and videos
              </p>

              {/* Tab filters */}
              <div className="flex flex-wrap justify-center gap-2">
                {['all', 'instagram', 'youtube', 'tiktok', 'spotify'].map((tab) => (
                  <motion.button
                    key={tab}
                    onClick={() => setActiveTab(tab as typeof activeTab)}
                    className={`px-4 md:px-5 py-2 md:py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                      activeTab === tab
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg shadow-yellow-500/30'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  key="loading"
                  className="flex justify-center py-16"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-yellow-200 dark:border-yellow-900 rounded-full" />
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                </motion.div>
              ) : filteredContent.length > 0 ? (
                <motion.div
                  key={activeTab}
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {filteredContent.map((content, index) => (
                    <ContentPreviewCard key={content.id} {...content} index={index} />
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  className="text-center py-16"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-photo-video text-3xl text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">No content available yet</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* CTA SECTION */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Tilt3DCard intensity={5} className="max-w-4xl mx-auto">
              <div className="relative bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600 rounded-3xl p-8 md:p-12 lg:p-16 text-center overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
                  <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
                  <FloatingParticles />
                </div>

                <div className="relative z-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                  >
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <motion.i 
                        className="fas fa-heart text-4xl text-white"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </div>
                  </motion.div>

                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                    Be Part of Our Story
                  </h2>
                  <p className="text-white/80 text-base md:text-lg mb-8 max-w-xl mx-auto">
                    Join our growing community and never miss an update!
                  </p>

                  <div className="flex flex-wrap justify-center gap-3 md:gap-4">
                    {socialPlatforms.map((p, i) => (
                      <motion.a
                        key={p.platform}
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 md:px-6 py-3 bg-white text-gray-900 rounded-full font-semibold hover:bg-yellow-50 transition-all duration-300 flex items-center gap-2 shadow-lg"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                      >
                        <i className={p.icon} />
                        <span>{p.platform}</span>
                      </motion.a>
                    ))}
                  </div>
                </div>
              </div>
            </Tilt3DCard>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ClientOurSocialMediaPage;
