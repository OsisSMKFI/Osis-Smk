// components/AIMonitorClient.tsx
'use client';

import { useEffect } from 'react';
import { initAIMonitoring } from '@/lib/ai-monitor';

/**
 * AI Monitor Client Component
 * Initializes AI monitoring in browser
 */
export default function AIMonitorClient() {
  useEffect(() => {
    initAIMonitoring();
    return () => {};
  }, []);

  return null; // This component renders nothing
}
