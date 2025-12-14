import React, { useState } from 'react';

interface MediaRendererProps {
  src: string;
  alt?: string;
  className?: string;
  controlsForVideo?: boolean; // default true
  autoPlay?: boolean; // for video previews
  loop?: boolean; // for video previews
  muted?: boolean; // for video previews
}

const VIDEO_EXT_REGEX = /\.(mp4|webm|ogg)(\?.*)?$/i;

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

export default function MediaRenderer({
  src,
  alt = '',
  className = '',
  controlsForVideo = true,
  autoPlay,
  loop,
  muted,
}: MediaRendererProps) {
  const [hasError, setHasError] = useState(false);

  if (!src) return <BrokenImagePlaceholder className={className} />;
  
  // If already errored, show placeholder
  if (hasError) return <BrokenImagePlaceholder className={className} />;

  const isVideo = VIDEO_EXT_REGEX.test(src);

  if (isVideo) {
    return (
      <video
        src={src}
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
        onError={() => setHasError(true)}
      />
    );
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className={className} 
      loading="lazy" 
      onError={() => setHasError(true)}
    />
  );
}
