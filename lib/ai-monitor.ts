// lib/ai-monitor.ts
/**
 * AI MONITORING SYSTEM — versi ringan.
 *
 * Hanya menangkap error browser (error external):
 *   - window error (JS exception)
 *   - unhandled promise rejection
 *
 * Sengaja TIDAK memakai console/fetch override, PerformanceObserver, atau
 * setInterval — versi lama menyebabkan browser crash & memory leak.
 * Laporan dikirim ke /api/errors/log yang menganalisisnya (rule-based)
 * dan tersimpan di error_logs -> tampil di /admin/errors.
 */

// Dedup: jangan spam server dgn error yang sama
const reportedMessages = new Set<string>();
const MAX_UNIQUE_REPORTS = 30;
const MIN_REPORT_INTERVAL_MS = 5000;
let lastReportAt = 0;
let reportCount = 0;

export function initAIMonitoring() {
  if (typeof window === 'undefined') return;
  const w = window as any;
  if (w.__aiMonitorInit) return;
  w.__aiMonitorInit = true;

  window.addEventListener('error', (event) => {
    reportToAI({
      type: 'client_error',
      severity: 'high',
      message: event.message || 'Unknown client error',
      data: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack?.slice(0, 4000),
        url: window.location.href,
      },
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    reportToAI({
      type: 'client_error',
      severity: 'critical',
      message: `Unhandled Promise Rejection: ${String(event.reason)?.slice(0, 500)}`,
      data: {
        reason: String(event.reason)?.slice(0, 2000),
        url: window.location.href,
      },
    });
  });
}

function shouldReport(message: string): boolean {
  if (reportedMessages.has(message)) return false;
  if (reportCount >= MAX_UNIQUE_REPORTS) return false;
  const now = Date.now();
  if (now - lastReportAt < MIN_REPORT_INTERVAL_MS) return false;
  reportedMessages.add(message);
  reportCount++;
  lastReportAt = now;
  return true;
}

/**
 * Report to AI System (server menganalisis & menyimpan ke error_logs)
 */
async function reportToAI(data: any) {
  if (!shouldReport(String(data.message || ''))) return;
  try {
    await fetch('/api/errors/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        errorType: data.type,
        severity: data.severity,
        message: data.message,
        metadata: data.data,
        pageUrl: window.location.href,
        environment: process.env.NODE_ENV,
      }),
      keepalive: true,
    });
  } catch {
    // Logging error tidak boleh menimbulkan error baru
  }
}

/**
 * Send custom AI analytics
 */
export async function trackAIEvent(eventName: string, eventData: any) {
  try {
    await fetch('/api/ai/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: eventName,
        data: eventData,
        url: typeof window !== 'undefined' ? window.location.href : '',
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error('[AI Track] Failed:', error);
  }
}
