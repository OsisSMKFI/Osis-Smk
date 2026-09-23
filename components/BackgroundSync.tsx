'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { fetchGlobalBackground, shouldApplyBackgroundForPath } from '@/lib/adminSettings.client';

/**
 * Sync CSS variables with admin background settings
 * Applies scope logic (homepage-only / selected-pages) client-side.
 * Re-apply is sync-only on pathname change (cached fetch, no observer churn).
 */
function applyBackground(bg: Awaited<ReturnType<typeof fetchGlobalBackground>>, pathname: string) {
  const root = document.documentElement;
  const body = document.body;

  if (!shouldApplyBackgroundForPath(bg, pathname)) {
    body.style.removeProperty('background');
    root.style.removeProperty('--gradient-bg');
    return;
  }

  if (bg.mode === 'color' && bg.color) {
    body.style.background = bg.color;
    root.style.removeProperty('--gradient-bg');
  } else if (bg.mode === 'gradient' && bg.gradient) {
    body.style.background = bg.gradient;
    root.style.removeProperty('--gradient-bg');
  } else if (bg.mode === 'image' && bg.imageUrl) {
    body.style.removeProperty('background');
    root.style.removeProperty('--gradient-bg');
  } else {
    body.style.removeProperty('background');
    root.style.removeProperty('--gradient-bg');
  }
}

export default function BackgroundSync() {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Scope re-apply on nav — uses cached settings, no network after first load
  useEffect(() => {
    if (!isClient) return;
    let cancelled = false;
    fetchGlobalBackground()
      .then((bg) => {
        if (!cancelled) applyBackground(bg, pathname);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isClient, pathname]);

  // Fetch + watch theme/storage once per session
  useEffect(() => {
    if (!isClient) return;

    const sync = async () => {
      try {
        const bg = await fetchGlobalBackground();
        applyBackground(bg, window.location.pathname);
      } catch (error) {
        console.error('[BackgroundSync] Error:', error);
      }
    };

    sync();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'class') {
          sync();
          break;
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    const handleStorageChange = () => {
      sync();
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      observer.disconnect();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isClient]);

  return null;
}
