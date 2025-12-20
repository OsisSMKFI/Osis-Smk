import React, { useState, useEffect, useCallback } from 'react';

interface MediaRendererProps {
  src: string;
  alt?: string;
  className?: string;
  controlsForVideo?: boolean; // default true
  autoPlay?: boolean; // for video previews
  loop?: boolean; // for video previews
  muted?: boolean; // for video previews
  fallbackSrc?: string; // Optional fallback image
  retryCount?: number; // Number of retries (default: 2)
}

const VIDEO_EXT_REGEX = /\.(mp4|webm|ogg)(\?.*)?$/i;

// NO longer use logo as default - use proper placeholder instead
// const DEFAULT_FALLBACK = '/images/logo-2.png';

// Placeholder SVG for broken images
const BrokenImagePlaceholder = ({ className }: { className?: string }) => (
  <div className={`flex items-center justify-center bg-gray-200 dark:bg-gray-700 ${className}`}>
    <svg 
      className="w-16 h-16 text-gray-400 dark:text-gray-500" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={1.5} 
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
      />
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M6 18L18 6M6 6l12 12" 
        className="text-red-400"
      />
    </svg>
  </div>
);

// Default image placeholder - NO IMAGE icon, not logo
const DefaultImagePlaceholder = ({ className, alt }: { className?: string; alt?: string }) => (
  <div className={`flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 ${className}`}>
    <svg 
      className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-2" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={1.5} 
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
      />
    </svg>
    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Belum ada gambar</span>
  </div>
);

export default function MediaRenderer({
  src,
  alt = '',
  className = '',
  controlsForVideo = true,
  autoPlay,
  loop,
  muted,
  fallbackSrc,
  retryCount = 2,
}: MediaRendererProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [errorCount, setErrorCount] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Reset state when src changes
  useEffect(() => {
    setCurrentSrc(src);
    setErrorCount(0);
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  const handleError = useCallback(() => {
    if (errorCount < retryCount) {
      // Try adding cache-busting param
      const separator = currentSrc.includes('?') ? '&' : '?';
      const newSrc = `${src}${separator}_retry=${errorCount + 1}&t=${Date.now()}`;
      setCurrentSrc(newSrc);
      setErrorCount(prev => prev + 1);
    } else if (fallbackSrc && currentSrc !== fallbackSrc) {
      // Try fallback
      setCurrentSrc(fallbackSrc);
      setErrorCount(prev => prev + 1);
    } else {
      // Final failure
      setHasError(true);
    }
    setIsLoading(false);
  }, [currentSrc, errorCount, retryCount, fallbackSrc, src]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Show placeholder if no src
  if (!src) {
    return fallbackSrc ? (
      <img src={fallbackSrc} alt={alt} className={className} loading="lazy" />
    ) : (
      <DefaultImagePlaceholder className={className} alt={alt} />
    );
  }
  
  // Show broken image placeholder on final error
  if (hasError) {
    return fallbackSrc ? (
      <img src={fallbackSrc} alt={alt} className={className} loading="lazy" />
    ) : (
      <BrokenImagePlaceholder className={className} />
    );
  }

  const isVideo = VIDEO_EXT_REGEX.test(src);

  if (isVideo) {
    return (
      <video
        src={currentSrc}
        className={className}
        playsInline
        webkit-playsinline="true"
        controls={controlsForVideo}
        controlsList="nodownload"
        preload="metadata"
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        style={{ maxWidth: '100%', height: 'auto' }}
        onError={handleError}
        onLoadedData={handleLoad}
      />
    );
  }

  return (
    <img 
      src={currentSrc} 
      alt={alt} 
      className={className} 
      loading="lazy" 
      onError={handleError}
      onLoad={handleLoad}
    />
  );
}
