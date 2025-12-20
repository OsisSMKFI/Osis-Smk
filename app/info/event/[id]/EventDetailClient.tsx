'use client';

import { motion } from 'framer-motion';
import { FaCalendarAlt, FaMapMarkerAlt, FaArrowLeft, FaExternalLinkAlt, FaShare } from 'react-icons/fa';
import MediaRenderer from '@/components/MediaRenderer';
import ContentInteractions from '@/components/ContentInteractions';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

interface Event {
  id: number;
  title: string;
  description?: string;
  event_date: string | null;
  location?: string;
  image_url?: string;
  registration_link?: string;
  created_at: string;
}

interface Props {
  event: Event;
}

export default function EventDetailClient({ event }: Props) {
  const { t } = useTranslation();
  
  const handleShare = async () => {
    const url = window.location.href;
    const text = `${event.title} - Event OSIS SMK Informatika 2 FI`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: event.title, text, url });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link berhasil disalin!');
    }
  };
  
  const formattedDate = event.event_date 
    ? new Date(event.event_date).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Image */}
      <div className="relative h-64 sm:h-80 md:h-96 lg:h-[28rem] w-full overflow-hidden">
        <MediaRenderer
          src={event.image_url || ''}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        {/* Back Button */}
        <Link 
          href="/info"
          className="absolute top-4 left-4 z-10 flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/30 transition-colors"
        >
          <FaArrowLeft />
          <span className="hidden sm:inline">Kembali</span>
        </Link>
        
        {/* Share Button */}
        <button
          onClick={handleShare}
          className="absolute top-4 right-4 z-10 flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/30 transition-colors"
        >
          <FaShare />
          <span className="hidden sm:inline">Bagikan</span>
        </button>
        
        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg"
          >
            {event.title}
          </motion.h1>
        </div>
      </div>
      
      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 -mt-16 relative z-10"
        >
          {/* Event Meta */}
          <div className="flex flex-wrap gap-4 mb-6 text-gray-600 dark:text-gray-400">
            {formattedDate && (
              <div className="flex items-center gap-2">
                <FaCalendarAlt className="text-green-600" />
                <span>{formattedDate}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-2">
                <FaMapMarkerAlt className="text-red-500" />
                <span>{event.location}</span>
              </div>
            )}
          </div>
          
          {/* Description */}
          {event.description && (
            <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {event.description}
              </p>
            </div>
          )}
          
          {/* Registration Link */}
          {event.registration_link && (
            <div className="mb-8">
              <a
                href={event.registration_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
              >
                <span>{t('common.register')}</span>
                <FaExternalLinkAlt size={12} />
              </a>
            </div>
          )}
          
          {/* Interactions */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <ContentInteractions
              contentId={event.id.toString()}
              contentType="event"
              contentTitle={event.title}
              contentUrl={`/info/event/${event.id}`}
              initialLikes={0}
              initialComments={0}
              isLiked={false}
            />
          </div>
        </motion.div>
        
        {/* Back to Info */}
        <div className="mt-8 text-center">
          <Link
            href="/info"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <FaArrowLeft />
            <span>Kembali ke Info & Event</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
