'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cachedGetJson } from '@/lib/clientCache';

/** Public routes worth warming (JS + RSC) after first paint. */
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
];

/** Public GETs used by client pages on mount — keep small so we never fight first paint. */
const WARM_APIS = [
  '/api/proker',
  '/api/sekbid',
  '/api/announcements',
  '/api/events',
  '/api/polls',
  '/api/posts?limit=6',
  '/api/stats',
];

const ROUTE_FLAG = 'osis:routes-warmed';
const API_FLAG = 'osis:apis-warmed';

function runIdle(fn: () => void, timeout = 8000) {
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(() => fn(), { timeout });
    return;
  }
  window.setTimeout(fn, 2500);
}

/**
 * After the visitor lands, warm route chunks + public API cache in the background
 * so the first click on each menu is already "visited" (matches user-reported lag).
 */
export default function RouteWarmup() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const warmRoutes = () => {
      if (cancelled) return;
      try {
        if (sessionStorage.getItem(ROUTE_FLAG)) return;
      } catch {
        // still try
      }
      PUBLIC_ROUTES.forEach((href, i) => {
        window.setTimeout(() => {
          if (!cancelled) {
            try {
              router.prefetch(href);
            } catch {
              // ignore
            }
          }
        }, i * 250);
      });
      try {
        sessionStorage.setItem(ROUTE_FLAG, '1');
      } catch {
        // ignore
      }
    };

    const warmApis = async () => {
      if (cancelled) return;
      try {
        if (sessionStorage.getItem(API_FLAG)) return;
      } catch {
        // still try
      }
      // sequential-ish to avoid burst on slow mobile
      for (const url of WARM_APIS) {
        if (cancelled) return;
        try {
          await cachedGetJson(url, { ttlMs: 120_000 });
        } catch {
          // warm is best-effort
        }
        await new Promise((r) => setTimeout(r, 120));
      }
      if (!cancelled) {
        try {
          sessionStorage.setItem(API_FLAG, '1');
        } catch {
          // ignore
        }
      }
    };

    // Wait for first paint + user interaction settle before warming
    const startWarm = () => {
      runIdle(() => {
        warmRoutes();
        window.setTimeout(() => {
          runIdle(() => {
            void warmApis();
          }, 12000);
        }, 2000);
      }, 8000);
    };

    const startTimer = window.setTimeout(startWarm, 3500);

    return () => {
      cancelled = true;
      window.clearTimeout(startTimer);
    };
  }, [router]);

  return null;
}
