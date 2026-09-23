'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { fetchGlobalBackground, shouldApplyBackgroundForPath } from '@/lib/adminSettings.client';

/**
 * Sync CSS variables with admin background settings
 * Applies scope logic (homepage-only / selected-pages) client-side.
 */
export default function BackgroundSync() {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const syncBackground = async () => {
      try {
        const bg = await fetchGlobalBackground();
        const root = document.documentElement;
        const body = document.body;
        const isDarkMode = root.classList.contains('dark');

        // Scope check - same logic as old root layout
        if (!shouldApplyBackgroundForPath(bg, pathname)) {
          body.style.removeProperty('background');
          root.style.removeProperty('--gradient-bg');
          void root.offsetHeight;
          return;
        }

        // Apply custom background from admin OR use CSS defaults
        if (bg.mode === 'color' && bg.color) {
          body.style.background = bg.color;
          root.style.removeProperty('--gradient-bg');
        } else if (bg.mode === 'gradient' && bg.gradient) {
          body.style.background = bg.gradient;
          root.style.removeProperty('--gradient-bg');
        } else if (bg.mode === 'image' && bg.imageUrl) {
          // Image mode - remove body background, let components handle it
          body.style.removeProperty('background');
          root.style.removeProperty('--gradient-bg');
        } else {
          // Use CSS defaults (mode is 'none') - remove all inline styles
          body.style.removeProperty('background');
          root.style.removeProperty('--gradient-bg');
          void root.offsetHeight;
        }
      } catch (error) {
        console.error('[BackgroundSync] Error:', error);
      }
    };

    // Sync on mount and pathname change
    syncBackground();

    // Sync when theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          syncBackground();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Listen for storage events (theme changed in another tab)
    const handleStorageChange = () => {
      syncBackground();
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      observer.disconnect();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isClient, pathname]);

  return null;
}
