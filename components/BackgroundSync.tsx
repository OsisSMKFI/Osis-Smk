'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  fetchGlobalBackground,
  shouldApplyBackgroundForPath,
  type GlobalBackgroundConfig,
} from '@/lib/adminSettings.client';

function applyBackground(bg: GlobalBackgroundConfig, pathname: string) {
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

/**
 * Sync CSS variables with admin background settings.
 * Single fetch path: pathname change + class/storage listeners all use the 60s module cache.
 */
export default function BackgroundSync() {
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;

    const sync = async (path: string) => {
      try {
        const bg = await fetchGlobalBackground();
        if (!cancelled) applyBackground(bg, path);
      } catch {
        // ignore — defaults stay
      }
    };

    sync(pathname);

    let themeTimer: number | undefined;
    const onClassMutate = () => {
      window.clearTimeout(themeTimer);
      themeTimer = window.setTimeout(() => {
        if (!cancelled) sync(window.location.pathname);
      }, 150);
    };

    const observer = new MutationObserver(onClassMutate);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    const onStorage = () => sync(window.location.pathname);
    window.addEventListener('storage', onStorage);

    return () => {
      cancelled = true;
      window.clearTimeout(themeTimer);
      observer.disconnect();
      window.removeEventListener('storage', onStorage);
    };
  }, [pathname]);

  return null;
}
