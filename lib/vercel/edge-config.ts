/**
 * Vercel Edge Config Integration
 * Ultra-low latency data store at the edge
 * 
 * Use for:
 * - Feature flags
 * - A/B testing
 * - IP blocking
 * - Redirects
 * - Runtime configuration
 * 
 * @see https://vercel.com/docs/storage/edge-config
 */

import { get, getAll, has, createClient } from '@vercel/edge-config';

// Create a client for advanced usage
export const edgeConfig = createClient(process.env.EDGE_CONFIG);

/**
 * Get a single value from Edge Config
 */
export async function getConfig<T = unknown>(key: string): Promise<T | undefined> {
  try {
    return await get<T>(key);
  } catch (error) {
    console.error('[Edge Config] Error getting key:', key, error);
    return undefined;
  }
}

/**
 * Get all values from Edge Config
 */
export async function getAllConfig(): Promise<Record<string, unknown>> {
  try {
    const all = await getAll();
    return all || {};
  } catch (error) {
    console.error('[Edge Config] Error getting all config:', error);
    return {};
  }
}

/**
 * Check if a key exists in Edge Config
 */
export async function hasConfig(key: string): Promise<boolean> {
  try {
    return await has(key);
  } catch (error) {
    console.error('[Edge Config] Error checking key:', key, error);
    return false;
  }
}

// ==========================================
// Feature Flags
// ==========================================

export interface FeatureFlags {
  enableAI: boolean;
  enableBiometric: boolean;
  enableChat: boolean;
  enableAnalytics: boolean;
  enableAttendance: boolean;
  maintenanceMode: boolean;
  betaFeatures: boolean;
}

const defaultFeatureFlags: FeatureFlags = {
  enableAI: true,
  enableBiometric: true,
  enableChat: true,
  enableAnalytics: true,
  enableAttendance: true,
  maintenanceMode: false,
  betaFeatures: false,
};

/**
 * Get feature flags from Edge Config
 */
export async function getFeatureFlags(): Promise<FeatureFlags> {
  const flags = await getConfig<Partial<FeatureFlags>>('featureFlags');
  return { ...defaultFeatureFlags, ...flags };
}

/**
 * Check if a specific feature is enabled
 */
export async function isFeatureEnabled(feature: keyof FeatureFlags): Promise<boolean> {
  const flags = await getFeatureFlags();
  return flags[feature] ?? false;
}

// ==========================================
// IP Blocking
// ==========================================

/**
 * Check if an IP is blocked
 */
export async function isIPBlocked(ip: string): Promise<boolean> {
  const blockedIPs = await getConfig<string[]>('blockedIPs');
  if (!blockedIPs) return false;
  return blockedIPs.includes(ip);
}

/**
 * Get list of blocked IPs
 */
export async function getBlockedIPs(): Promise<string[]> {
  return (await getConfig<string[]>('blockedIPs')) || [];
}

// ==========================================
// Redirects & Rewrites
// ==========================================

export interface RedirectRule {
  source: string;
  destination: string;
  permanent?: boolean;
}

/**
 * Get redirect rules from Edge Config
 */
export async function getRedirects(): Promise<RedirectRule[]> {
  return (await getConfig<RedirectRule[]>('redirects')) || [];
}

/**
 * Check if a path should be redirected
 */
export async function shouldRedirect(path: string): Promise<RedirectRule | null> {
  const redirects = await getRedirects();
  return redirects.find(r => r.source === path) || null;
}

// ==========================================
// A/B Testing
// ==========================================

export interface ABTest {
  id: string;
  name: string;
  variants: string[];
  weights?: number[];
  active: boolean;
}

/**
 * Get A/B test configuration
 */
export async function getABTest(testId: string): Promise<ABTest | undefined> {
  const tests = await getConfig<Record<string, ABTest>>('abTests');
  return tests?.[testId];
}

/**
 * Get a variant for a user based on their ID
 */
export async function getTestVariant(testId: string, userId: string): Promise<string | null> {
  const test = await getABTest(testId);
  if (!test || !test.active || test.variants.length === 0) return null;
  
  // Simple hash-based variant selection
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const variantIndex = hash % test.variants.length;
  return test.variants[variantIndex];
}

// ==========================================
// Runtime Configuration
// ==========================================

export interface SiteConfig {
  siteName: string;
  siteDescription: string;
  maintenanceMessage?: string;
  announcementBanner?: string;
  maxUploadSize: number;
  allowedFileTypes: string[];
  rateLimit: {
    maxRequests: number;
    windowMs: number;
  };
}

const defaultSiteConfig: SiteConfig = {
  siteName: 'OSIS SMK Informatika',
  siteDescription: 'Dirgantara 2025',
  maxUploadSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000,
  },
};

/**
 * Get site configuration from Edge Config
 */
export async function getSiteConfig(): Promise<SiteConfig> {
  const config = await getConfig<Partial<SiteConfig>>('siteConfig');
  return { ...defaultSiteConfig, ...config };
}

// ==========================================
// Greeting Example (from Vercel quickstart)
// ==========================================

/**
 * Get greeting from Edge Config (example from Vercel docs)
 */
export async function getGreeting(): Promise<string> {
  return (await getConfig<string>('greeting')) || 'Hello, World!';
}
