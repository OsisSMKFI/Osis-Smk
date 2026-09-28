'use client';

import { useEffect } from 'react';
import { initAIMonitoring } from '@/lib/ai-monitor';

/**
 * Aktifkan error monitoring browser (ringan) sekali di root layout.
 * Error yang tertangkap dikirim ke /api/errors/log -> dianalisis otomatis
 * -> tampil di /admin/errors dengan root cause + saran perbaikan.
 */
export default function ErrorMonitorInit() {
  useEffect(() => {
    initAIMonitoring();
  }, []);
  return null;
}
