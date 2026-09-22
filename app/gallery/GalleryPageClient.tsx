'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import MediaRenderer from '@/components/MediaRenderer';
import { FaTimes, FaChevronLeft, FaChevronRight, FaImages } from 'react-icons/fa';
import PageHero from '@/components/animations/PageHero';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/animations/AnimatedSection';
import { useTranslation } from '@/hooks/useTranslation';

interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  image_url: string;
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

export default function GalleryPageClient() {
  const { t } = useTranslation();
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [sekbidFilter, setSekbidFilter] = useState<'all' | number>('all');
  const [eventFilter, setEventFilter] = useState<'all' | string>('all');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [sekbids, setSekbids] = useState<SekbidItem[]>([]);

  useEffect(() => {
    fetchGallery();
    fetchEvents();
    fetchSekbids();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImage === null) return;
      
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage]);

  const fetchGallery = async () => {
    try {
      const res = await fetch('/api/gallery');
      if (res.ok) {
        const data = await res.json();
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
      }
    } catch (error) {
      console.error('Error fetching gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGallery = gallery.filter(item => {
    const sekbidOk = sekbidFilter === 'all' ? true : item.sekbid_id === sekbidFilter;
    const eventOk = eventFilter === 'all' ? true : item.event_id === eventFilter;
    return sekbidOk && eventOk;
  });

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        const arr: EventItem[] = Array.isArray(data?.events) ? data.events : [];
        // Basic normalization of id/title
        setEvents(arr.map(e => ({ id: e.id, title: e.title, event_date: e.event_date })));
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  const fetchSekbids = async () => {
    try {
      const res = await fetch('/api/sekbid');
      if (res.ok) {
        const data = await res.json();
        const arr: SekbidItem[] = Array.isArray(data?.sekbid) ? data.sekbid : [];
        setSekbids(arr.map(s => ({ id: s.id, name: s.name })));
      }
    } catch (err) {
      console.error('Error fetching sekbids:', err);
    }
  };

  const openLightbox = (index: number) => setSelectedImage(index);
  const closeLightbox = () => setSelectedImage(null);
  const nextImage = () => setSelectedImage(prev => prev !== null ? (prev + 1) % filteredGallery.length : 0);
  const prevImage = () => setSelectedImage(prev => prev !== null ? (prev - 1 + filteredGallery.length) % filteredGallery.length : 0);

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
          <div className="hidden sm:inline-flex items-center p-1.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-gray-500/10 dark:shadow-black/20 border border-gray-100/50 dark:border-slate-700/50">
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
            <div className="grid grid-cols-4 gap-2 p-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-gray-500/10 dark:shadow-black/20 border border-gray-100/50 dark:border-slate-700/50">
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
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    controlsForVideo={false}
                    autoPlay
                    loop
                    muted
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
        {selectedImage !== null && (
          <motion.div 
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-2 sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
            >
              <FaTimes size={32} />
            </button>
            
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10"
            >
              <FaChevronLeft size={32} />
            </button>
            
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10"
            >
              <FaChevronRight size={32} />
            </button>

            <motion.div 
              className="max-w-6xl max-h-[90vh] w-full h-full flex flex-col items-center justify-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative w-full h-full flex items-center justify-center">
                <MediaRenderer
                  src={filteredGallery[selectedImage].image_url}
                  alt={filteredGallery[selectedImage].title}
                  className="w-full h-full object-contain"
                  controlsForVideo={true}
                />
              </div>
              <div className="mt-4 text-center text-white">
                <h3 className="text-2xl font-bold">{filteredGallery[selectedImage].title}</h3>
                {filteredGallery[selectedImage].description && (
                  <p className="mt-2 text-gray-300">{filteredGallery[selectedImage].description}</p>
                )}
                <p className="mt-2 text-sm text-gray-400">
                  {selectedImage + 1} / {filteredGallery.length}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
