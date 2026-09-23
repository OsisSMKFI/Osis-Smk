'use client';

import { useEffect, useState, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { getPageContentBatch } from '@/lib/pageContent';
import { fetchGlobalBackground, type GlobalBackgroundConfig } from '@/lib/adminSettings.client';

function DynamicHeroInternal() {
  const { t, language } = useTranslation();
  const [content, setContent] = useState<Record<string, string>>({
    title: '',
    subtitle: '',
    description: '',
  });
  const [loading, setLoading] = useState(true);
  const [bg, setBg] = useState<GlobalBackgroundConfig>({ mode: 'gradient' });

  useEffect(() => {
    async function loadContent() {
      try {
        const [pageData, bgData] = await Promise.all([
          getPageContentBatch([
            'home_hero_title',
            'home_hero_subtitle',
            'home_hero_description',
          ]),
          fetchGlobalBackground()
        ]);

        setContent(prev => ({
          ...prev,
          title: pageData.home_hero_title || prev.title,
          subtitle: pageData.home_hero_subtitle || prev.subtitle,
          description: pageData.home_hero_description || prev.description,
        }));
        if (bgData && bgData.mode) {
          setBg(bgData);
        }
      } catch {
        // Silent fail for background loading
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, []);

  const backgroundStyle = (() => {
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
      {bg.imageUrl && (
        bg.imageStyle === 'contain' ? (
          <ContainBackground bg={bg} />
        ) : bg.imageStyle === 'smart-fit' ? (
          <SmartFitBackground bg={bg} />
        ) : (
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

      <div className="container mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="max-w-5xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="heading-hero text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold mb-3 xs:mb-4 sm:mb-6 text-white dark:text-gray-100 leading-[1.15] xs:leading-[1.1] sm:leading-tight text-center drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]"
          >
            {displayTitle}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="inline-block mb-4 xs:mb-5 sm:mb-6 lg:mb-8"
          >
            <p className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-semibold text-yellow-300 dark:text-yellow-300 px-3 xs:px-4 sm:px-6 lg:px-8 py-1.5 xs:py-2 sm:py-2.5 rounded-full bg-white/30 sm:bg-white/25 dark:bg-gray-700/50 backdrop-blur-md border border-white/40 dark:border-gray-600/40 text-center drop-shadow-lg cursor-default">
              {displaySubtitle}
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-[0.7rem] xs:text-xs sm:text-sm md:text-base lg:text-lg text-blue-50 dark:text-gray-100 mb-6 xs:mb-7 sm:mb-8 lg:mb-10 xl:mb-12 max-w-3xl mx-auto leading-relaxed px-3 xs:px-4 text-center drop-shadow-md"
          >
            {displayDescription}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-2.5 xs:gap-3 sm:gap-4 justify-center items-stretch sm:items-center px-3 xs:px-4"
          >
            <a
              href="/about"
              className="px-6 sm:px-8 py-2.5 sm:py-3.5 bg-yellow-400 hover:bg-yellow-500 dark:bg-yellow-500 dark:hover:bg-yellow-600 text-gray-900 dark:text-gray-900 font-bold rounded-full transition-colors duration-200 shadow-lg text-sm sm:text-base text-center min-h-[44px] flex items-center justify-center"
            >
              {labelAbout}
            </a>
            <a
              href="/gallery"
              className="px-6 sm:px-8 py-2.5 sm:py-3.5 bg-white/15 hover:bg-white/25 dark:bg-gray-700/50 dark:hover:bg-gray-600/50 backdrop-blur-md text-white dark:text-gray-100 font-bold rounded-full border-2 border-white/40 dark:border-gray-600/50 transition-colors duration-200 shadow-lg text-sm sm:text-base text-center min-h-[44px] flex items-center justify-center"
            >
              {labelGallery}
            </a>
          </motion.div>
        </div>
      </div>

      {/* Simple scroll indicator */}
      <div className="hidden sm:block absolute bottom-6 sm:bottom-10 left-1/2 transform -translate-x-1/2">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="w-6 h-10 rounded-full border-2 border-white/50 flex items-start justify-center p-2"
        >
          <div className="w-1 h-3 bg-white/70 rounded-full animate-bounce" />
        </motion.div>
      </div>
    </section>
  );
}

const DynamicHero = memo(DynamicHeroInternal);
export default DynamicHero;

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
