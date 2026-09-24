'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** All public routes worth having ready before the user clicks. */
const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/bidang',
  '/gallery',
  '/info',
  '/posts',
  '/people',
  '/our-social-media',
  '/sekbid',
  '/activity',
  '/sekbid/sekbid-1',
  '/sekbid/sekbid-2',
  '/sekbid/sekbid-3',
  '/sekbid/sekbid-4',
  '/sekbid/sekbid-5',
  '/sekbid/sekbid-6',
];

/**
 * Prefetch public route RSC + JS chunks ASAP after first paint.
 * This is the fix for "first click on each menu freezes, later clicks are fine".
 */
export default function RouteWarmup() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const prefetchAll = () => {
      if (cancelled) return;
      // Parallel — chunks are small; stagger only caused late readiness
      for (const href of PUBLIC_ROUTES) {
        if (cancelled) return;
        try {
          router.prefetch(href);
        } catch {
          // ignore
        }
      }
    };

    // Start as soon as the browser can breathe (not 3.5s later)
    let idleId: number | undefined;
    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(prefetchAll, { timeout: 600 });
    } else {
      idleId = window.setTimeout(prefetchAll, 200) as unknown as number;
    }

    // Re-run once on first pointer interaction (user is about to click)
    const onIntent = () => {
      prefetchAll();
      window.removeEventListener('pointerdown', onIntent);
      window.removeEventListener('keydown', onIntent);
    };
    window.addEventListener('pointerdown', onIntent, { once: true });
    window.addEventListener('keydown', onIntent, { once: true });

    return () => {
      cancelled = true;
      if (idleId !== undefined) {
        if (typeof window.cancelIdleCallback === 'function' && typeof idleId === 'number') {
          window.cancelIdleCallback(idleId);
        } else {
          window.clearTimeout(idleId as unknown as number);
        }
      }
      window.removeEventListener('pointerdown', onIntent);
      window.removeEventListener('keydown', onIntent);
    };
  }, [router]);

  return null;
}
