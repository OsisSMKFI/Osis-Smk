'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

interface GalleryItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
}

interface GallerySectionClientProps {
  initialItems: GalleryItem[];
}

const GallerySectionClient: React.FC<GallerySectionClientProps> = ({ initialItems }) => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const images = initialItems;
  const { t } = useTranslation();

  // Debug log
  useEffect(() => {
    console.log('[GallerySectionClient] Received items:', images.length);
    console.log('[GallerySectionClient] All items with full URLs:', images.map(item => ({
      id: item.id,
      title: item.title,
      image_url: item.image_url,  // Show FULL URL
      url_length: item.image_url?.length
    })));
  }, [images]);

  const openModal = useCallback((index: number) => {
    setSelectedImage(index);
    setImageLoading(true);
    setImageError(false);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedImage(null);
    setImageLoading(false);
    setImageError(false);
    setIsFullscreen(false);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  const nextImage = useCallback(() => {
    if (selectedImage !== null) {
      setImageLoading(true);
      setImageError(false);
      setSelectedImage((selectedImage + 1) % images.length);
    }
  }, [selectedImage, images.length]);

  const prevImage = useCallback(() => {
    if (selectedImage !== null) {
      setImageLoading(true);
      setImageError(false);
      setSelectedImage(selectedImage === 0 ? images.length - 1 : selectedImage - 1);
    }
  }, [selectedImage, images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImage === null) return;

      switch (e.key) {
        case 'Escape':
          closeModal();
          break;
        case 'ArrowLeft':
          prevImage();
          break;
        case 'ArrowRight':
          nextImage();
          break;
      }
    };

    if (selectedImage !== null) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [selectedImage, closeModal, prevImage, nextImage]);

  return (
    <>
      {/* Empty State */}
      {images.length === 0 && (
        <div className="text-center py-20">
          <svg className="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {t('gallery.noPhotos')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {t('galleryPage.comingSoonDesc')}
          </p>
        </div>
      )}

      {/* Gallery Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {images.map((image, index) => {
          const isVideo = image.image_url?.match(/\.(mp4|webm|ogg|mov)$/i);
          
          return (
          <div
            key={image.id}
            className="group relative overflow-hidden rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:scale-105 active:scale-95"
            onClick={() => openModal(index)}
          >
            {/* Media - Image or Video */}
            <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 min-h-[200px] sm:min-h-[250px]">
              {isVideo ? (
                <video
                  src={image.image_url}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  muted
                  loop
                  playsInline
                  onMouseEnter={(e) => e.currentTarget.play()}
                  onMouseLeave={(e) => {
                    e.currentTarget.pause();
                    e.currentTarget.currentTime = 0;
                  }}
                  onError={(e) => {
                    console.error(`[GalleryClient Thumbnail] Video failed to load:`, {
                      title: image.title,
                      url: image.image_url,
                      index
                    });
                  }}
                />
              ) : (
                <img
                  src={image.image_url}
                  alt={image.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    console.error(`[GalleryClient Thumbnail] Image failed to load:`, {
                      title: image.title,
                      url: image.image_url,
                      index,
                      error: 'Failed to load'
                    });
                  }}
                  onLoad={(e) => {
                    const target = e.target as HTMLImageElement;
                    console.log(`[GalleryClient Thumbnail] Image loaded successfully:`, image.title);
                  }}
                />
              )}
            </div>

            {/* Overlay - Always visible on mobile, hover on desktop */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                <h4 className="text-white font-semibold text-base sm:text-lg mb-1 sm:mb-2">{image.title}</h4>
                <p className="text-gray-200 text-xs sm:text-sm line-clamp-2">{image.description || ''}</p>
              </div>

              {/* Expand icon */}
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Border glow effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300" />
          </div>
          );
        })}
        </div>
      )}

      {/* Modal - Improved responsive design */}
      {selectedImage !== null && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[9999] flex flex-col"
          onClick={closeModal}
        >
          {/* Top bar with controls */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
            {/* Left: Image counter */}
            <div className="bg-black/60 backdrop-blur-sm rounded-full px-4 py-2">
              <span className="text-white text-sm font-medium">
                {selectedImage + 1} / {images.length}
              </span>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-2">
              {/* Fullscreen button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                }}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-105"
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                  </svg>
                )}
              </button>

              {/* Close button */}
              <button
                type="button"
                onClick={closeModal}
                className="w-10 h-10 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-105"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 flex items-center justify-center relative px-4 py-2 min-h-0">
            {/* Previous button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all duration-200 z-10 hover:scale-110"
              aria-label="Previous image"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Next button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all duration-200 z-10 hover:scale-110"
              aria-label="Next image"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Media container - constrained size */}
            <div
              className="relative w-full max-w-5xl max-h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Loading spinner - modern */}
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 opacity-20 blur-lg animate-pulse" />
                    <div className="absolute inset-0 rounded-full border-4 border-white/20" />
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-yellow-400 border-r-amber-500 animate-spin" />
                  </div>
                </div>
              )}

              {/* Error state */}
              {imageError && (
                <div className="flex flex-col items-center justify-center text-white p-8">
                  <svg className="w-16 h-16 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-lg font-semibold mb-2">{t('galleryPage.imageLoadError')}</p>
                  <p className="text-gray-300 text-center">{t('galleryPage.imageSorry')}</p>
                </div>
              )}

              {/* Main media - Image or Video with constrained dimensions */}
              {images[selectedImage].image_url?.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                <video
                  src={images[selectedImage].image_url}
                  controls
                  autoPlay
                  loop
                  className={`w-auto h-auto max-w-full max-h-[60vh] sm:max-h-[65vh] object-contain rounded-lg shadow-2xl transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                  onLoadedData={() => {
                    console.log('[GalleryClient Modal] Video loaded:', images[selectedImage].title);
                    setImageLoading(false);
                    setImageError(false);
                  }}
                  onError={() => {
                    console.error('[GalleryClient Modal] Video failed to load');
                    setImageLoading(false);
                    setImageError(true);
                  }}
                />
              ) : (
                <img
                  src={images[selectedImage].image_url}
                  alt={images[selectedImage].title}
                  className={`w-auto h-auto max-w-full max-h-[60vh] sm:max-h-[65vh] object-contain rounded-lg shadow-2xl transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                  onLoad={() => {
                    console.log('[GalleryClient Modal] Image loaded:', images[selectedImage].title);
                    setImageLoading(false);
                    setImageError(false);
                  }}
                  onError={() => {
                    console.error('[GalleryClient Modal] Image failed to load');
                    setImageLoading(false);
                    setImageError(true);
                  }}
                />
              )}
            </div>
          </div>

          {/* Bottom info bar - always visible */}
          {!imageLoading && !imageError && (
            <div 
              className="flex-shrink-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-4 sm:px-8 py-4 sm:py-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="max-w-4xl mx-auto">
                <h3 className="text-white text-lg sm:text-xl font-bold mb-2">
                  {images[selectedImage].title}
                </h3>
                {images[selectedImage].description && (
                  <p className="text-gray-300 text-sm sm:text-base line-clamp-3">
                    {images[selectedImage].description}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ESC hint - desktop only */}
          <div className="hidden sm:block absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
            <span className="text-white/70 text-xs">Tekan ESC untuk menutup</span>
          </div>
        </div>
      )}
    </>
  );
};

export default GallerySectionClient;
