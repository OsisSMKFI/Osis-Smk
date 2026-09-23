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

/** Public GETs used by client pages on mount. */
const WARM_APIS = [
  '/api/proker',
  '/api/sekbid',
  '/api/announcements',
  '/api/events',
  '/api/polls',
  '/api/posts?limit=6',
  '/api/posts?limit=100',
  '/api/gallery',
  '/api/stats',
  '/api/public/achievements',
  '/api/public/filosofi-logo',
  '/api/members?active=true',
];

const ROUTE_FLAG = 'osis:routes-warmed';
const API_FLAG = 'osis:apis-warmed';

function runIdle(fn: () => void, timeout = 4000) {
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(() => fn(), { timeout });
    return;
  }
  window.setTimeout(fn, 800);
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

    runIdle(() => {
      warmRoutes();
      // slightly later than routes so first paint / hero wins
      window.setTimeout(() => {
        runIdle(() => {
          void warmApis();
        }, 8000);
      }, 600);
    }, 3500);

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
