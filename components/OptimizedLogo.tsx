'use client';

/**
 * OptimizedLogo Component
 * Uses responsive images with WebP support for optimal loading
 * 
 * Available sizes:
 * - logo-48.webp/png (48x48) - navbar small
 * - logo-64.webp/png (64x64) - navbar medium  
 * - logo-128.webp/png (128x128) - general use
 * - logo-256.webp/png (256x256) - hero/larger
 * - logo-2.webp (full size, optimized)
 */

interface OptimizedLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  alt?: string;
  priority?: boolean;
}

const sizeMap = {
  xs: { src: '/images/logo-48', width: 28, height: 28 },
  sm: { src: '/images/logo-48', width: 40, height: 40 },
  md: { src: '/images/logo-64', width: 48, height: 48 },
  lg: { src: '/images/logo-128', width: 80, height: 80 },
  xl: { src: '/images/logo-256', width: 128, height: 128 },
  full: { src: '/images/logo-2', width: 256, height: 256 },
};

export default function OptimizedLogo({ 
  size = 'sm', 
  className = '', 
  alt = 'Logo SMK Informatika - Raveka Sena',
  priority = false 
}: OptimizedLogoProps) {
  const { src, width, height } = sizeMap[size];
  
  return (
    <picture>
      <source srcSet={`${src}.webp`} type="image/webp" />
      <source srcSet={`${src}.png`} type="image/png" />
      <img
        src={`${src}.png`}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
      />
    </picture>
  );
}
