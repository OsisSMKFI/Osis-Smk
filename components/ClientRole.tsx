"use client";
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';

const LiveChatWidget = dynamic(() => import('./chat/LiveChatWidget'), {
  ssr: false,
  loading: () => null,
});

export default function ClientRole() {
  const { data: session } = useSession();
  const role = ((session?.user as any)?.role || 'guest') as 'super_admin' | 'member' | 'guest';
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer = 0;

    if (typeof window.requestIdleCallback === 'function') {
      const handle = window.requestIdleCallback(
        () => {
          if (!cancelled) setReady(true);
        },
        { timeout: 2000 }
      );
      return () => {
        cancelled = true;
        window.cancelIdleCallback(handle);
      };
    }

    timer = window.setTimeout(() => {
      if (!cancelled) setReady(true);
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  if (!ready) return null;

  return <LiveChatWidget role={role} showFloating={false} />;
}
