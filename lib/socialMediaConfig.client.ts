/**
 * Social Media Configuration Client
 * Fetches social media settings from admin_settings database
 */

import { SOCIAL_MEDIA_CONFIG as defaultConfig } from './socialMediaConfig';

// Base interface for common platform config
export interface SocialMediaBasePlatformConfig {
  url: string;
  isActive: boolean;
}

// Full config matching SOCIAL_MEDIA_CONFIG structure
export interface SocialMediaFullConfig {
  instagram: {
    username: string;
    url: string;
    followers: number;
    targetFollowers: number;
    isActive: boolean;
  };
  youtube: {
    channelName: string;
    url: string;
    subscribers: number;
    targetSubscribers: number;
    isActive: boolean;
  };
  tiktok: {
    username: string;
    url: string;
    followers: number;
    targetFollowers: number;
    isActive: boolean;
  };
  spotify: {
    username: string;
    url: string;
    followers: number;
    targetFollowers: number;
    isActive: boolean;
  };
}

// Cache for fetched config
let cachedConfig: SocialMediaFullConfig | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch social media config from admin settings API
 * Falls back to static config if API fails
 */
export async function fetchSocialMediaConfig(): Promise<SocialMediaFullConfig> {
  // Check cache first
  if (cachedConfig && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedConfig;
  }

  try {
    const response = await fetch('/api/social-media/config', {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      console.warn('[SocialMediaConfig] API returned non-OK status, using defaults');
      return defaultConfig as SocialMediaFullConfig;
    }

    const data = await response.json();
    
    if (data.config) {
      cachedConfig = data.config;
      cacheTimestamp = Date.now();
      return data.config;
    }
    
    return defaultConfig as SocialMediaFullConfig;
  } catch (error) {
    console.error('[SocialMediaConfig] Error fetching config:', error);
    return defaultConfig as SocialMediaFullConfig;
  }
}

/**
 * Get social media config synchronously from cache or default
 */
export function getSocialMediaConfigSync(): SocialMediaFullConfig {
  if (cachedConfig) {
    return cachedConfig;
  }
  return defaultConfig as SocialMediaFullConfig;
}

/**
 * Force refresh of cached config
 */
export function invalidateSocialMediaConfigCache(): void {
  cachedConfig = null;
  cacheTimestamp = 0;
}
