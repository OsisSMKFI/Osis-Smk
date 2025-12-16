// lib/ai-monitor.ts
/**
 * AI MONITORING SYSTEM
 * Runs in background to monitor performance, errors, security
 */

import { logActivity } from './activity-logger';

interface MonitoringData {
  pageUrl: string;
  userAgent: string;
  performance: {
    loadTime: number;
    firstPaint: number;
    largestContentfulPaint: number;
    timeToInteractive: number;
  };
  errors: any[];
  userActions: any[];
}

/**
 * Initialize AI Monitoring (call in client components)
 * DISABLED for performance - was causing browser crashes
 * Keep trackAIEvent for manual logging only
 */
export function initAIMonitoring() {
  if (typeof window === 'undefined') return;
  
  // DISABLED - causing performance issues and browser crashes
  // These monitoring functions override console.error, fetch, add many event listeners,
  // and run setInterval every 30 seconds which causes memory leaks
  
  console.log('[AI Monitor] Disabled for performance');
  return;

  // Original code (disabled):
  // monitorPerformance();
  // monitorErrors();
  // monitorUserBehavior();
  // monitorNetwork();
  // monitorMemory();
}

/**
 * Performance Monitoring
 */
function monitorPerformance() {
  if (!window.performance) return;

  // Monitor page load performance
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = window.performance.timing;
      const loadTime = perfData.loadEventEnd - perfData.navigationStart;

      // Get Web Vitals
      if ('PerformanceObserver' in window) {
        // Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          const lcp = lastEntry.renderTime || lastEntry.loadTime;

          if (lcp > 2500) {
            reportToAI({
              type: 'client_error',
              severity: 'medium',
              message: `Slow LCP detected: ${lcp.toFixed(0)}ms`,
              data: { lcp, url: window.location.href }
            });
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            const fid = entry.processingStart - entry.startTime;
            
            if (fid > 100) {
              reportToAI({
                type: 'client_error',
                severity: 'high',
                message: `High FID detected: ${fid.toFixed(0)}ms`,
                data: { fid, url: window.location.href }
              });
            }
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any[]) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }

          if (clsValue > 0.1) {
            reportToAI({
              type: 'client_error',
              severity: 'medium',
              message: `High CLS detected: ${clsValue.toFixed(3)}`,
              data: { cls: clsValue, url: window.location.href }
            });
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      }

      // Report slow page load
      if (loadTime > 3000) {
        reportToAI({
          type: 'client_error',
          severity: loadTime > 5000 ? 'high' : 'medium',
          message: `Slow page load: ${loadTime}ms`,
          data: {
            loadTime,
            url: window.location.href,
            dns: perfData.domainLookupEnd - perfData.domainLookupStart,
            tcp: perfData.connectEnd - perfData.connectStart,
            request: perfData.responseStart - perfData.requestStart,
            response: perfData.responseEnd - perfData.responseStart,
            dom: perfData.domContentLoadedEventEnd - perfData.domLoading
          }
        });
      }
    }, 0);
  });
}

/**
 * Error Monitoring
 */
function monitorErrors() {
  // Global error handler
  window.addEventListener('error', (event) => {
    reportToAI({
      type: 'client_error',
      severity: 'high',
      message: event.message,
      data: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        url: window.location.href
      }
    });
  });

  // Unhandled promise rejection
  window.addEventListener('unhandledrejection', (event) => {
    reportToAI({
      type: 'client_error',
      severity: 'critical',
      message: `Unhandled Promise Rejection: ${event.reason}`,
      data: {
        reason: event.reason,
        promise: event.promise,
        url: window.location.href
      }
    });
  });

  // Console error override (monitor console.error calls)
  const originalError = console.error;
  console.error = (...args) => {
    reportToAI({
      type: 'client_error',
      severity: 'medium',
      message: args.join(' '),
      data: {
        url: window.location.href,
        timestamp: new Date().toISOString()
      }
    });
    originalError.apply(console, args);
  };
}

/**
 * User Behavior Monitoring
 */
function monitorUserBehavior() {
  let clickCount = 0;
  let lastClickTime = Date.now();

  // Monitor rapid clicking (possible frustration or bot)
  window.addEventListener('click', () => {
    clickCount++;
    const now = Date.now();

    if (now - lastClickTime < 1000) {
      if (clickCount > 10) {
        reportToAI({
          type: 'user_behavior',
          severity: 'medium',
          message: 'Rapid clicking detected (possible frustration or bot)',
          data: {
            clickCount,
            duration: now - lastClickTime,
            url: window.location.href
          }
        });
        clickCount = 0;
      }
    } else {
      clickCount = 0;
    }

    lastClickTime = now;
  });

  // Monitor page visibility (user switched tabs)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      console.log('[AI Monitor] User left page');
    } else {
      console.log('[AI Monitor] User returned to page');
    }
  });
}

// Track slow API calls to prevent spam
const slowApiCalls = new Set<string>();
const SLOW_API_DEBOUNCE = 30000; // 30 seconds debounce

/**
 * Network Monitoring
 */
function monitorNetwork() {
  // Monitor fetch failures
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const startTime = Date.now();
    
    try {
      const response = await originalFetch(...args);
      const duration = Date.now() - startTime;

      // Monitor slow API calls (increased threshold to 10s, with debounce)
      const urlKey = typeof args[0] === 'string' ? args[0] : 'unknown';
      if (duration > 10000 && !slowApiCalls.has(urlKey)) {
        slowApiCalls.add(urlKey);
        setTimeout(() => slowApiCalls.delete(urlKey), SLOW_API_DEBOUNCE);
        
        reportToAI({
          type: 'client_error',
          severity: 'low', // Changed from medium to low
          message: `Slow API call: ${duration}ms`,
          data: {
            url: args[0],
            duration,
            status: response.status
          }
        });
      }

      // Monitor failed API calls
      if (!response.ok) {
        reportToAI({
          type: 'api_error',
          severity: response.status >= 500 ? 'critical' : 'high',
          message: `API Error: ${response.status} ${response.statusText}`,
          data: {
            url: args[0],
            status: response.status,
            statusText: response.statusText
          }
        });
      }

      return response;
    } catch (error: any) {
      reportToAI({
        type: 'network_error',
        severity: 'critical',
        message: `Network Error: ${error.message}`,
        data: {
          url: args[0],
          error: error.message
        }
      });
      throw error;
    }
  };
}

/**
 * Memory Monitoring
 */
function monitorMemory() {
  if (!(performance as any).memory) return;

  setInterval(() => {
    const memory = (performance as any).memory;
    const usedMemory = memory.usedJSHeapSize;
    const totalMemory = memory.totalJSHeapSize;
    const limit = memory.jsHeapSizeLimit;

    const usagePercent = (usedMemory / limit) * 100;

    if (usagePercent > 80) {
      reportToAI({
        type: 'client_error',
        severity: 'critical',
        message: `High memory usage: ${usagePercent.toFixed(1)}%`,
        data: {
          usedMemory: (usedMemory / 1048576).toFixed(2) + ' MB',
          totalMemory: (totalMemory / 1048576).toFixed(2) + ' MB',
          limit: (limit / 1048576).toFixed(2) + ' MB',
          url: window.location.href
        }
      });
    }
  }, 30000); // Check every 30 seconds
}

/**
 * Report to AI System
 * Now logs to both error_logs AND activity_logs for visibility
 */
async function reportToAI(data: any) {
  try {
    // Send to error logging API (for error tracking)
    await fetch('/api/errors/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        errorType: data.type,
        severity: data.severity,
        message: data.message,
        metadata: data.data,
        pageUrl: window.location.href,
        environment: process.env.NODE_ENV
      })
    });

    // ALSO send to activity tracking API (for activity page visibility)
    await fetch('/api/ai/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: `ai_monitor_${data.type}`,
        data: {
          severity: data.severity,
          message: data.message,
          details: data.data
        },
        url: window.location.href,
        timestamp: new Date().toISOString()
      })
    });

    console.log('[AI Monitor] Reported:', data.type, data.message);
  } catch (error) {
    console.error('[AI Monitor] Failed to report:', error);
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
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('[AI Track] Failed:', error);
  }
}
