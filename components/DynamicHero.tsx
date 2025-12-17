'use client';

import { useEffect, useState, useRef, memo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { getPageContent } from '@/lib/supabase/client';
import { fetchGlobalBackground, type GlobalBackgroundConfig } from '@/lib/adminSettings.client';

interface PageContentData {
  page_key: string;
  content_value: string;
  content_type: string;
}

function DynamicHeroInternal() {
  const { t, language } = useTranslation();
  const [content, setContent] = useState<Record<string, string>>({
    title: '',
    subtitle: '',
    description: '',
  });
  const [loading, setLoading] = useState(true);
  const [bg, setBg] = useState<GlobalBackgroundConfig>({ mode: 'gradient' }); // Default gradient instead of 'none'

  useEffect(() => {
    async function loadContent() {
      try {
        const [pageData, bgData] = await Promise.all([
          getPageContent('home'),
          fetchGlobalBackground()
        ]);
        
        const contentMap: Record<string, string> = {};
        
        pageData.forEach((item: PageContentData) => {
          if (item.page_key === 'home_hero_title') {
            contentMap.title = item.content_value;
          } else if (item.page_key === 'home_hero_subtitle') {
            contentMap.subtitle = item.content_value;
          } else if (item.page_key === 'home_hero_description') {
            contentMap.description = item.content_value;
          }
        });

        setContent(prev => ({ ...prev, ...contentMap }));
        // Only update bg if fetch was successful and has valid data
        if (bgData && bgData.mode) {
          setBg(bgData);
        }
      } catch (error) {
        // Silent fail for background loading
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, []);

  // Determine if hero should render background
  // Hero always renders its own background (like /about page)
  // Don't rely on body background
  const shouldRenderHeroBg = true;
  
  // Calculate background style (non-image modes). If an imageUrl exists we let the image layers handle it
  const backgroundStyle = (() => {
    // If we have an imageUrl at all, skip inline background so image divs show
    if (bg.imageUrl) return undefined;
    if (bg.mode === 'color' && bg.color) return { background: bg.color };
    if (bg.mode === 'gradient' && bg.gradient) return { background: bg.gradient };
    return { background: 'var(--gradient-bg)' };
  })();

  if (loading) {
    return (
      <section
        className="hero-section relative min-h-screen flex items-center justify-center overflow-hidden pt-16 md:pt-20"
        style={{ background: 'var(--gradient-bg)' }}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-40 h-40 rounded-full bg-gradient-to-br from-yellow-500/20 to-amber-600/20 blur-2xl animate-pulse" />
        </div>
        {/* Skeleton content */}
        <div className="space-y-6 text-center z-10 px-6 w-full max-w-3xl">
          <div className="h-10 bg-white/10 rounded-full mx-auto w-2/3 animate-pulse" />
          <div className="h-6 bg-white/10 rounded-full mx-auto w-1/2 animate-pulse" />
          <div className="h-20 bg-white/5 rounded-xl mx-auto w-full animate-pulse" />
        </div>
      </section>
    );
  }

  const displayTitle = language === 'id' ? (content.title || t('home.osisName')) : t('home.osisName');
  const displaySubtitle = language === 'id' ? (content.subtitle || t('home.subtitle')) : t('home.subtitle');
  const displayDescription = language === 'id' ? (content.description || t('home.description')) : t('home.description');
  const labelAbout = language === 'id' ? 'Tentang Kami' : 'About Us';
  const labelGallery = language === 'id' ? 'Lihat Galeri' : 'View Gallery';

  return (
    <section 
      data-component="hero"
      className={"hero-section relative min-h-screen flex items-center justify-center pb-16 sm:pb-20 lg:pb-24 " + (bg.imageStyle === 'cover' || !bg.imageUrl ? 'overflow-hidden' : 'overflow-visible')}
      style={{
        ...backgroundStyle,
        paddingTop: 'max(var(--nav-offset, 80px), env(safe-area-inset-top))'
      }}
    >
      {/* Image background (render if imageUrl present regardless of mode). Show a debug badge if dev and missing */}
      {bg.imageUrl && (
        bg.imageStyle === 'contain' ? (
          // Contain: image should not crop; overlay only covers the image box
          <ContainBackground bg={bg} />
        ) : bg.imageStyle === 'smart-fit' ? (
          // Smart fit: show full image (like contain) plus subtle blurred fill behind to avoid empty bars
          <SmartFitBackground bg={bg} />
        ) : (
          // 'cover' uses background-image to fill entire hero; overlay spans full container
          <>
            <div
              className="absolute inset-0 pointer-events-none z-0"
              style={{
                backgroundImage: `url(${bg.imageUrl})`,
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: bg.imagePosition || 'center',
                backgroundAttachment: bg.fixed ? 'fixed' : 'scroll'
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none z-0"
              style={{
                backgroundColor: bg.imageOverlayColor || 'rgba(0,0,0,0.55)',
                opacity: typeof bg.imageOverlayOpacity === 'number' ? bg.imageOverlayOpacity : 0.55
              }}
            />
          </>
        )
      )}
      {!bg.imageUrl && process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 left-2 z-20 bg-red-600 text-white text-xs px-2 py-1 rounded shadow">No imageUrl</div>
      )}

      {/* Content with animations */}
      <div className="container mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="max-w-5xl mx-auto">
          {/* Animated Title */}
          <motion.h1 
            initial={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="heading-hero text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold mb-3 xs:mb-4 sm:mb-6 text-white dark:text-gray-100 leading-[1.15] xs:leading-[1.1] sm:leading-tight text-center drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]"
          >
            {displayTitle}
          </motion.h1>

          {/* Animated Subtitle Badge */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, type: 'spring', stiffness: 200 }}
            className="inline-block mb-4 xs:mb-5 sm:mb-6 lg:mb-8"
          >
            <motion.p 
              whileHover={{ scale: 1.05 }}
              className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-semibold text-yellow-300 dark:text-yellow-300 px-3 xs:px-4 sm:px-6 lg:px-8 py-1.5 xs:py-2 sm:py-2.5 rounded-full bg-white/30 sm:bg-white/25 dark:bg-gray-700/50 backdrop-blur-md border border-white/40 dark:border-gray-600/40 text-center drop-shadow-lg cursor-default"
            >
              {displaySubtitle}
            </motion.p>
          </motion.div>

          {/* Animated Description */}
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="text-[0.7rem] xs:text-xs sm:text-sm md:text-base lg:text-lg text-blue-50 dark:text-gray-100 mb-6 xs:mb-7 sm:mb-8 lg:mb-10 xl:mb-12 max-w-3xl mx-auto leading-relaxed px-3 xs:px-4 text-center drop-shadow-md"
          >
            {displayDescription}
          </motion.p>

          {/* Animated CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="flex flex-col sm:flex-row gap-2.5 xs:gap-3 sm:gap-4 justify-center items-stretch sm:items-center px-3 xs:px-4"
          >
            <motion.a 
              href="/about" 
              whileHover={{ scale: 1.08, boxShadow: '0 20px 40px rgba(251, 191, 36, 0.4)' }}
              whileTap={{ scale: 0.95 }}
              className="px-6 sm:px-8 py-2.5 sm:py-3.5 bg-yellow-400 hover:bg-yellow-500 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-gray-900 dark:text-gray-900 font-bold rounded-full transition-colors duration-300 shadow-xl text-sm sm:text-base text-center min-h-[44px] flex items-center justify-center"
              aria-label="Learn more about us"
            >
              {labelAbout}
            </motion.a>
            <motion.a 
              href="/gallery" 
              whileHover={{ scale: 1.08, boxShadow: '0 20px 40px rgba(255, 255, 255, 0.2)' }}
              whileTap={{ scale: 0.95 }}
              className="px-6 sm:px-8 py-2.5 sm:py-3.5 bg-white/15 hover:bg-white/25 dark:bg-gray-700/50 dark:hover:bg-gray-600/50 backdrop-blur-md text-white dark:text-gray-100 font-bold rounded-full border-2 border-white/40 dark:border-gray-600/50 transition-colors duration-300 shadow-lg text-sm sm:text-base text-center min-h-[44px] flex items-center justify-center"
              aria-label="View our photo gallery"
            >
              {labelGallery}
            </motion.a>
          </motion.div>
        </div>
      </div>

      {/* Animated Scroll indicator */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="hidden sm:block absolute bottom-6 sm:bottom-10 left-1/2 transform -translate-x-1/2"
      >
        <motion.div 
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-6 h-10 rounded-full border-2 border-white/50 flex items-start justify-center p-2"
        >
          <motion.div 
            animate={{ opacity: [1, 0.3, 1], y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-1 h-3 bg-white/70 rounded-full" 
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

const DynamicHero = memo(DynamicHeroInternal);
export default DynamicHero;

// Separate components to keep main hero readable
interface BgProps { bg: GlobalBackgroundConfig }

function ContainBackground({ bg }: BgProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [dims, setDims] = useState<{w:number;h:number}|null>(null);
  const measure = () => {
    if (imgRef.current) {
      const r = imgRef.current.getBoundingClientRect();
      setDims({ w: r.width, h: r.height });
    }
  };
  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0" style={{ height: 'calc(100vh - 5rem - 3rem)' }}>
      <div className="relative flex items-center justify-center max-h-full">
        <img
          ref={imgRef}
          src={bg.imageUrl}
          alt=""
          className="object-contain max-h-full w-auto max-w-[95vw]"
          style={{ objectPosition: bg.imagePosition || 'center' }}
          onLoad={measure}
        />
        {bg.imageOverlayScope !== 'image' && (
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: bg.imageOverlayColor || 'rgba(0,0,0,0.3)',
              opacity: typeof bg.imageOverlayOpacity === 'number' ? bg.imageOverlayOpacity : 0.3
            }}
          />
        )}
        {bg.imageOverlayScope === 'image' && dims && (
          <div
            className="absolute"
            style={{
              width: dims.w,
              height: dims.h,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: bg.imageOverlayColor || 'rgba(0,0,0,0.3)',
              opacity: typeof bg.imageOverlayOpacity === 'number' ? bg.imageOverlayOpacity : 0.3
            }}
          />
        )}
      </div>
    </div>
  );
}

function SmartFitBackground({ bg }: BgProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [dims, setDims] = useState<{w:number;h:number}|null>(null);
  const measure = () => {
    if (imgRef.current) {
      const r = imgRef.current.getBoundingClientRect();
      setDims({ w: r.width, h: r.height });
    }
  };
  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0" style={{ height: 'calc(100vh - 5rem - 3rem)' }}>
      {/* Blurred fill layer */}
      <div
        className="absolute inset-0 scale-110 blur-2xl opacity-40"
        style={{
          backgroundImage: `url(${bg.imageUrl})`,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: bg.imagePosition || 'center'
        }}
      />
      <div className="relative flex items-center justify-center">
        <img
          ref={imgRef}
          src={bg.imageUrl}
          alt=""
          className="object-contain max-h-full w-auto max-w-[95vw]"
          style={{ objectPosition: bg.imagePosition || 'center' }}
          onLoad={measure}
        />
        {bg.imageOverlayScope !== 'image' && (
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: bg.imageOverlayColor || 'rgba(0,0,0,0.3)',
              opacity: typeof bg.imageOverlayOpacity === 'number' ? bg.imageOverlayOpacity : 0.3
            }}
          />
        )}
        {bg.imageOverlayScope === 'image' && dims && (
          <div
            className="absolute"
            style={{
              width: dims.w,
              height: dims.h,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: bg.imageOverlayColor || 'rgba(0,0,0,0.3)',
              opacity: typeof bg.imageOverlayOpacity === 'number' ? bg.imageOverlayOpacity : 0.3
            }}
          />
        )}
      </div>
    </div>
  );
}
