// components/SecurityAnalyzerProvider.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import type { SecurityAnalysisResult } from '@/lib/backgroundSecurityAnalyzer';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * SECURITY ANALYZER PROVIDER
 * Dynamically imports the analyzer only after login (siswa/guru) so the
 * ~26KB module stays out of the initial client bundle for guests.
 */
export function SecurityAnalyzerProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  const showAnalysisNotification = useCallback((result: SecurityAnalysisResult) => {
    if (result.overallStatus === 'READY') {
      toast.success(
        <div>
          <div className="font-bold">✅ Siap Absen!</div>
          <div className="text-sm mt-1">
            WiFi: {result.wifi.ssid} • Biometric: Terdaftar
          </div>
        </div>,
        { duration: 3000, id: 'security-analysis' }
      );
    } else if (result.overallStatus === 'BLOCKED') {
      const reasons = result.blockReasons.map((r) => {
        switch (r) {
          case 'INVALID_WIFI':
            return 'WiFi tidak sesuai';
          case 'WIFI_NOT_DETECTED':
            return 'WiFi tidak terdeteksi';
          case 'BIOMETRIC_NOT_REGISTERED':
            return 'Biometric belum didaftarkan';
          default:
            return r;
        }
      });

      toast.error(
        <div>
          <div className="font-bold">❌ Tidak Bisa Absen</div>
          <div className="text-sm mt-1">{reasons.join(' • ')}</div>
          {result.wifi.validationError && (
            <div className="text-xs mt-1 opacity-80">{result.wifi.validationError}</div>
          )}
        </div>,
        { duration: 5000, id: 'security-analysis' }
      );
    } else if (result.overallStatus === 'NEEDS_SETUP') {
      toast(
        <div>
          <div className="font-bold">⚠️ Setup Diperlukan</div>
          <div className="text-sm mt-1">
            Biometric belum didaftarkan. Buka halaman Absensi untuk setup.
          </div>
        </div>,
        {
          duration: 4000,
          id: 'security-analysis',
          icon: '⚠️',
        }
      );
    }
  }, []);

  const runBackgroundAnalysis = useCallback(async (
    userId: string,
    userEmail: string,
    silent = false
  ) => {
    try {
      const { backgroundSecurityAnalyzer } = await import('@/lib/backgroundSecurityAnalyzer');
      await backgroundSecurityAnalyzer.startAnalysis(userId, userEmail);

      const result = backgroundSecurityAnalyzer.getCachedAnalysis(userId);
      if (!result) return;

      if (isDev) {
        console.log('[Security Analyzer] Analysis complete:', {
          status: result.overallStatus,
          wifiValid: result.wifi.isValid,
        });
      }

      if (!silent) {
        showAnalysisNotification(result);
      }
    } catch (error) {
      console.error('[Security Analyzer] Analysis failed:', error);
    }
  }, [showAnalysisNotification]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const userId = (session.user as any).id;
      const userEmail = session.user.email || '';
      const userRole = ((session.user as any).role || '').toLowerCase();

      if (!['siswa', 'guru'].includes(userRole)) {
        return;
      }

      runBackgroundAnalysis(userId, userEmail);

      const interval = setInterval(() => {
        runBackgroundAnalysis(userId, userEmail, true);
      }, 10 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [status, session, runBackgroundAnalysis]);

  return <>{children}</>;
}

/**
 * Hook to get current security analysis result
 */
export function useSecurityAnalysis() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const [result, setResult] = useState<SecurityAnalysisResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setResult(null);
      return;
    }

    (async () => {
      try {
        const { backgroundSecurityAnalyzer } = await import('@/lib/backgroundSecurityAnalyzer');
        if (!cancelled) {
          setResult(backgroundSecurityAnalyzer.getCachedAnalysis(userId));
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return {
    result,
    isReady: result?.overallStatus === 'READY',
    isBlocked: result?.overallStatus === 'BLOCKED',
    blockReasons: result?.blockReasons || [],
  };
}
