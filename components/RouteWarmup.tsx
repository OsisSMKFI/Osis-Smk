'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/** Core public routes only — keep the burst tiny so we never flood the network. */
const CORE_ROUTES = [
  '/about',
  '/bidang',
  '/gallery',
  '/info',
  '/posts',
  '/people',
  '/our-social-media',
  '/sekbid',
  '/activity',
];

/**
 * Gently warm public route RSC/JS after first paint.
 * Sequential with a gap — never fire 16 prefetches at once (that froze other devices).
 */
export default function RouteWarmup() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith('/admin') || pathname?.startsWith('/dashboard')) return;

    let cancelled = false;
    let i = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const next = () => {
      if (cancelled || i >= CORE_ROUTES.length) return;
      try {
        router.prefetch(CORE_ROUTES[i]);
      } catch {
        // ignore
      }
      i += 1;
      timer = setTimeout(next, 400);
    };

    const start = () => {
      if (cancelled) return;
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(next, { timeout: 1200 });
      } else {
        timer = setTimeout(next, 600);
      }
    };

    start();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [router, pathname]);

  return null;
}
