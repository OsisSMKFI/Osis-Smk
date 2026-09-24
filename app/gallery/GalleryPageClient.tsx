'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MediaRenderer, { isVideoSrc } from '@/components/MediaRenderer';
import {
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaImages,
  FaShare,
  FaExpand,
  FaCompress,
  FaPause,
  FaPlay,
  FaInfoCircle,
} from 'react-icons/fa';
import { FaWhatsapp, FaFacebookF, FaTwitter, FaLink } from 'react-icons/fa';
import PageHero from '@/components/animations/PageHero';
import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { useTranslation } from '@/hooks/useTranslation';
import { cachedGetJson } from '@/lib/clientCache';

interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  image_url?: string | null;
  video_url?: string | null;
  url?: string | null;
  created_at: string;
  event_id?: string | null;
  sekbid_id?: number | null;
}

interface EventItem {
  id: string;
  title: string;
  event_date?: string | null;
}

interface SekbidItem {
  id: number;
  name: string;
}

interface GalleryPageClientProps {
  initialGallery?: GalleryItem[];
  initialEvents?: EventItem[];
  initialSekbids?: SekbidItem[];
}

function mediaSrcOf(item?: GalleryItem | null): string {
  if (!item) return '';
  return item.image_url || item.video_url || item.url || '';
}

export default function GalleryPageClient({
  initialGallery = [],
  initialEvents = [],
  initialSekbids = [],
}: GalleryPageClientProps = {}) {
  const { t } = useTranslation();
  const [gallery, setGallery] = useState<GalleryItem[]>(initialGallery);
  const [loading, setLoading] = useState(initialGallery.length === 0);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [sekbidFilter, setSekbidFilter] = useState<'all' | number>('all');
  const [eventFilter, setEventFilter] = useState<'all' | string>('all');
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [sekbids, setSekbids] = useState<SekbidItem[]>(initialSekbids);
  const [showShare, setShowShare] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoPaused, setVideoPaused] = useState(false);
  const [copied, setCopied] = useState(false);
  const lightboxRef = useRef<HTMLDivElement | null>(null);
  const mediaAreaRef = useRef<HTMLDivElement | null>(null);

  const filteredGallery = gallery.filter(item => {
    const sekbidOk = sekbidFilter === 'all' ? true : item.sekbid_id === sekbidFilter;
    const eventOk = eventFilter === 'all' ? true : item.event_id === eventFilter;
    return sekbidOk && eventOk;
  });

  useEffect(() => {
    if (initialGallery.length > 0) {
      setLoading(false);
      return;
    }
    fetchGallery();
    if (initialEvents.length === 0) fetchEvents();
    if (initialSekbids.length === 0) fetchSekbids();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeLightbox = useCallback(() => {
    setSelectedImage(null);
    setShowShare(false);
    setShowInfo(false);
    setIsFullscreen(false);
    setVideoPaused(false);
    setCopied(false);
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  const nextImage = useCallback(() => {
    setSelectedImage(prev =>
      prev !== null && filteredGallery.length > 0
        ? (prev + 1) % filteredGallery.length
        : 0
    );
    setShowShare(false);
    setShowInfo(false);
    setVideoPaused(false);
  }, [filteredGallery.length]);

  const prevImage = useCallback(() => {
    setSelectedImage(prev =>
      prev !== null && filteredGallery.length > 0
        ? (prev - 1 + filteredGallery.length) % filteredGallery.length
        : 0
    );
    setShowShare(false);
    setShowInfo(false);
    setVideoPaused(false);
  }, [filteredGallery.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImage === null) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showShare) setShowShare(false);
        else if (showInfo) setShowInfo(false);
        else closeLightbox();
      }
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, showShare, showInfo, closeLightbox, nextImage, prevImage]);

  // Lock body scroll while lightbox open
  useEffect(() => {
    if (selectedImage === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [selectedImage]);

  // Track native fullscreen changes
  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const fetchGallery = async () => {
    try {
      const data = await cachedGetJson<any>('/api/gallery');
      const raw = data.gallery || [];
      const safe = raw.map((g: any, i: number) => {
        let id = g?.id;
        if (id === null || id === undefined || id === '') {
          const base = g?.image_url || g?.title || 'item';
          id = `gal-${i}-${base}`;
        }
        return { ...g, id };
      });
      setGallery(safe);
    } catch (error) {
      console.error('Error fetching gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const data = await cachedGetJson<any>('/api/events');
      const arr: EventItem[] = Array.isArray(data?.events) ? data.events : [];
      setEvents(arr.map(e => ({ id: e.id, title: e.title, event_date: e.event_date })));
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  const fetchSekbids = async () => {
    try {
      const data = await cachedGetJson<any>('/api/sekbid');
      const arr: SekbidItem[] = Array.isArray(data?.sekbid) ? data.sekbid : [];
      setSekbids(arr.map(s => ({ id: s.id, name: s.name })));
    } catch (err) {
      console.error('Error fetching sekbids:', err);
    }
  };

  const openLightbox = (index: number) => {
    setSelectedImage(index);
    setShowShare(false);
    setShowInfo(false);
    setVideoPaused(false);
    setCopied(false);
  };

  const current = selectedImage !== null ? filteredGallery[selectedImage] : null;
  const currentSrc = mediaSrcOf(current);
  const currentIsVideo = isVideoSrc(currentSrc);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      lightboxRef.current?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const toggleVideoPlay = () => {
    const v = mediaAreaRef.current?.querySelector('video');
    if (!v) return;
    if (v.paused) {
      v.play().then(() => setVideoPaused(false)).catch(() => {});
    } else {
      v.pause();
      setVideoPaused(true);
    }
  };

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/gallery`
    : '/gallery';
  const shareTitle = current?.title
    ? `${current.title} — Galeri OSIS SMK Fithrah Insani`
    : 'Galeri OSIS SMK Fithrah Insani';

  const openShare = (platform: 'whatsapp' | 'facebook' | 'twitter') => {
    const u = encodeURIComponent(shareUrl);
    const title = encodeURIComponent(shareTitle);
    let target = '';
    if (platform === 'whatsapp') target = `https://wa.me/?text=${title}%20${u}`;
    if (platform === 'facebook') target = `https://www.facebook.com/sharer/sharer.php?u=${u}`;
    if (platform === 'twitter') target = `https://twitter.com/intent/tweet?text=${title}&url=${u}`;
    if (target) window.open(target, '_blank', 'width=600,height=400');
    setShowShare(false);
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // noop
    }
  };

  const nativeShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title: shareTitle, url: shareUrl });
        setShowShare(false);
      } catch {
        // user cancelled
      }
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('gallery.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section with Animation */}
      <PageHero
        title={t('gallery.activities')}
        subtitle={t('gallery.documentation')}
        description={t('gallery.documentationDesc')}
        icon={<FaImages className="w-10 h-10 text-amber-500" />}
        gradient="purple"
      />

      {/* Filter Section (Event + Sekbid) */}
      <AnimatedSection variant="fadeUp" delay={0.1}>
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Event Filter */}
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">{t('gallery.eventOptional')}</label>
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value as any)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-amber-400"
              >
                <option value="all">{t('gallery.allEvents')}</option>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
            </div>
            {/* Sekbid Filter */}
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">{t('gallery.sekbidOptional')}</label>
            <select
              value={sekbidFilter}
              onChange={(e) => {
                const val = e.target.value;
                setSekbidFilter(val === 'all' ? 'all' : parseInt(val, 10));
              }}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-amber-400"
            >
              <option value="all">{t('gallery.allSekbid')}</option>
              {sekbids.map(sb => (
                <option key={sb.id} value={sb.id}>{sb.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Quick Sekbid Buttons - Elegant Tab Navigation Like People Page */}
        <div className="flex justify-center mt-6 px-4">
          {/* Desktop: Horizontal Tabs */}
          <div className="hidden sm:inline-flex items-center p-1.5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
            {/* All Tab */}
            <button
              onClick={() => setSekbidFilter('all')}
              className={`relative px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                sekbidFilter === 'all'
                  ? 'bg-amber-400 text-slate-900 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                {t('gallery.all')}
              </span>
            </button>
            
            {/* Divider */}
            <div className="w-px h-6 bg-gray-200 dark:bg-slate-600 mx-1" />
            
            {/* Sekbid Tabs */}
            {sekbids.map((sb) => {
              // Icons per sekbid: 🕌 Keagamaan, 👥 Kaderisasi, 📖 Akademik, 💡 Ekonomi, 🏥 Kesehatan, 💻 Kominfo
              const icons = ['🕌', '👥', '📖', '💡', '🏥', '💻'];
              const icon = icons[(sb.id - 1) % icons.length];
              
              return (
                <button
                  key={`sekbtn-${sb.id}`}
                  onClick={() => setSekbidFilter(sb.id)}
                  className={`relative px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    sekbidFilter === sb.id
                      ? 'bg-amber-400 text-slate-900 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title={sb.name}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="text-base">{icon}</span>
                    <span>{sb.id}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Mobile: Grid Layout */}
          <div className="sm:hidden w-full max-w-sm">
            <div className="grid grid-cols-4 gap-2 p-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
              {/* All Tab - Mobile */}
              <button
                onClick={() => setSekbidFilter('all')}
                className={`col-span-4 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  sekbidFilter === 'all'
                    ? 'bg-amber-400 text-slate-900 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  {t('gallery.all') || 'Semua'}
                </span>
              </button>
              
              {/* Sekbid Tabs - Mobile Grid (2 per row) */}
              {sekbids.map((sb) => {
                const icons = ['🕌', '👥', '📖', '💡', '🏥', '💻'];
                const icon = icons[(sb.id - 1) % icons.length];
                const shortLabel = sb.name?.split('-')[1]?.trim() || `Sekbid ${sb.id}`;
                
                return (
                  <button
                    key={`sekbtn-mobile-${sb.id}`}
                    onClick={() => setSekbidFilter(sb.id)}
                    className={`col-span-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 ${
                      sekbidFilter === sb.id
                        ? 'bg-amber-400 text-slate-900 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      <span className="text-lg">{icon}</span>
                      <span className="truncate">{shortLabel}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        </section>
      </AnimatedSection>

      {/* Gallery Grid with Animations */}
      <AnimatedSection variant="fadeUp" delay={0.2}>
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20 lg:pb-24">
          {filteredGallery.length === 0 ? (
            <div className="text-center py-12 sm:py-16 lg:py-20">
              <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400">
                {sekbidFilter === 'all' && eventFilter === 'all' ? t('gallery.noPhotos') : t('gallery.noPhotosFilter')}
              </p>
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 },
                },
              }}
            >
              {filteredGallery.map((item, index) => (
                <motion.div
                  key={item.id}
                  variants={{
                    hidden: { opacity: 0, y: 30, scale: 0.9 },
                    visible: { opacity: 1, y: 0, scale: 1 },
                  }}
                  transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="group relative aspect-square overflow-hidden rounded-lg sm:rounded-xl shadow-md hover:shadow-2xl transition-all cursor-pointer bg-gray-200 dark:bg-gray-700"
                  onClick={() => openLightbox(index)}
                >
                  <MediaRenderer
                    src={mediaSrcOf(item)}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    controlsForVideo={false}
                    autoPlay
                    loop
                    muted
                    preload="auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-white">
                      <h3 className="font-bold text-base sm:text-lg line-clamp-2">{item.title}</h3>
                      {item.description && (
                        <p className="text-xs sm:text-sm text-gray-200 line-clamp-1 mt-1">{item.description}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>
      </AnimatedSection>

      {/* Lightbox with Animation */}
      <AnimatePresence>
        {selectedImage !== null && current && (
          <motion.div
            ref={lightboxRef}
            className="fixed inset-0 z-[9999] bg-black/95 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) closeLightbox();
            }}
          >
            {/* Top toolbar */}
            <div className="flex-shrink-0 flex items-center justify-between px-3 sm:px-4 pt-3 sm:pt-4 pb-3 gap-2">
              <span className="bg-black/60 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm font-medium">
                {selectedImage + 1} / {filteredGallery.length}
              </span>
              <div className="flex items-center gap-2">
                {currentIsVideo && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleVideoPlay();
                    }}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all hover:scale-105"
                    aria-label={videoPaused ? 'Putar video' : 'Jeda video'}
                    title={videoPaused ? 'Putar' : 'Jeda'}
                  >
                    {videoPaused ? <FaPlay /> : <FaPause />}
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowShare(false);
                    setShowInfo(v => !v);
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all hover:scale-105 ${
                    showInfo ? 'bg-amber-500 hover:bg-amber-600' : 'bg-white/20 hover:bg-white/30'
                  }`}
                  aria-label="Keterangan"
                  title="Keterangan"
                >
                  <FaInfoCircle />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowInfo(false);
                    setShowShare(v => !v);
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all hover:scale-105 ${
                    showShare ? 'bg-amber-500 hover:bg-amber-600' : 'bg-white/20 hover:bg-white/30'
                  }`}
                  aria-label="Bagikan"
                  title="Bagikan"
                >
                  <FaShare />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFullscreen();
                  }}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all hover:scale-105"
                  aria-label={isFullscreen ? 'Keluar fullscreen' : 'Fullscreen'}
                  title={isFullscreen ? 'Keluar fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <FaCompress /> : <FaExpand />}
                </button>
                <button
                  type="button"
                  onClick={closeLightbox}
                  className="w-10 h-10 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-all hover:scale-105"
                  aria-label="Tutup lightbox"
                  title="Tutup (Esc)"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* Info / keterangan popover */}
            {showInfo && (
              <div
                className="absolute top-16 right-3 sm:right-4 z-20 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 w-72 max-h-[60vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-1">
                  Keterangan
                </p>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                  {current.title}
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {current.description || 'Tidak ada keterangan untuk media ini.'}
                </p>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                  <p>
                    Ditambahkan:{' '}
                    {new Date(current.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                  {current.event_id && (
                    <p>Event: {events.find((ev) => ev.id === current.event_id)?.title || '—'}</p>
                  )}
                  {current.sekbid_id != null && (
                    <p>Sekbid: {sekbids.find((sb) => sb.id === current.sekbid_id)?.name || '—'}</p>
                  )}
                </div>
              </div>
            )}

            {/* Share popover */}
            {showShare && (
              <div
                className="absolute top-16 right-3 sm:right-4 z-20 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-3 w-56"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-1">
                  Bagikan galeri
                </p>                <div className="space-y-1">
                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <button
                      type="button"
                      onClick={nativeShare}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <FaShare className="text-purple-500" /> Bagikan…
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openShare('whatsapp')}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <FaWhatsapp className="text-green-500" /> WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => openShare('facebook')}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <FaFacebookF className="text-blue-600" /> Facebook
                  </button>
                  <button
                    type="button"
                    onClick={() => openShare('twitter')}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <FaTwitter className="text-sky-500" /> Twitter
                  </button>
                  <button
                    type="button"
                    onClick={copyShareLink}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <FaLink className="text-amber-500" /> {copied ? 'Tersalin!' : 'Salin link'}
                  </button>
                </div>
              </div>
            )}

            {/* Prev */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white z-10 hover:scale-110 transition-all"
              aria-label="Sebelumnya"
            >
              <FaChevronLeft size={24} />
            </button>

            {/* Next */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white z-10 hover:scale-110 transition-all"
              aria-label="Berikutnya"
            >
              <FaChevronRight size={24} />
            </button>

            {/* Media — fit viewport (letterbox), not full-bleed */}
            <div
              ref={mediaAreaRef}
              className="flex-1 min-h-0 flex items-center justify-center px-12 sm:px-16 py-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative max-w-full max-h-full w-full h-full flex items-center justify-center">
                <MediaRenderer
                  key={`${current.id}-${selectedImage}`}
                  src={currentSrc}
                  alt={current.title}
                  className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-2xl"
                  controlsForVideo={currentIsVideo}
                  loading="eager"
                  objectFit="contain"
                  preload="auto"
                />
              </div>
            </div>

            {/* Caption */}
            <div
              className="flex-shrink-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-4 sm:px-8 py-4 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-white text-lg sm:text-xl font-bold">{current.title}</h3>
              {showInfo && current.description && (
                <p className="mt-1 text-gray-300 text-sm sm:text-base line-clamp-2">
                  {current.description}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-400 hidden sm:block">
                ← → navigasi · Esc tutup · klik <FaInfoCircle className="inline -mt-0.5 mx-0.5" /> untuk keterangan
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
