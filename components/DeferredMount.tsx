'use client';

import { useEffect, useState, ReactNode } from 'react';

/**
 * Mount children after the browser is idle (or after a short timeout).
 * Used to keep non-critical layout chrome off the critical path.
 */
export default function DeferredMount({
  children,
  timeout = 2500,
}: {
  children: ReactNode;
  timeout?: number;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const showNow = () => {
      if (!cancelled) setShow(true);
    };

    if (typeof window.requestIdleCallback === 'function') {
      const handle = window.requestIdleCallback(showNow, { timeout });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(handle);
      };
    }

    const timer = window.setTimeout(showNow, 120);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [timeout]);

  if (!show) return null;
  return <>{children}</>;
}
