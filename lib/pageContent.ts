'use client';

import { supabase } from './supabase/client';

// Cache for page content
let contentCache: Record<string, string> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 1000; // 1 minute

// In-flight promise dedup - prevents parallel identical queries
let inFlightPromise: Promise<Record<string, string>> | null = null;

/**
 * Fetch all page_content from DB (with caching + in-flight dedup)
 */
async function fetchAllContent(): Promise<Record<string, string>> {
  if (contentCache && Date.now() - cacheTimestamp < CACHE_TTL) {
    return contentCache;
  }

  // Dedup concurrent calls
  if (inFlightPromise) {
    return inFlightPromise;
  }

  inFlightPromise = (async () => {
    try {
      const { data, error } = await supabase
        .from('page_content')
        .select('page_key, content')
        .eq('published', true)
        .abortSignal(AbortSignal.timeout(5000));

      if (error || !data) {
        console.warn('[pageContent] Fetch error:', error?.message);
        return contentCache || {};
      }

      const map: Record<string, string> = {};
      data.forEach((row: any) => {
        if (row.page_key && row.content) {
          map[row.page_key] = row.content;
        }
      });

      contentCache = map;
      cacheTimestamp = Date.now();
      return map;
    } catch (err) {
      console.warn('[pageContent] Exception:', err);
      return contentCache || {};
    } finally {
      inFlightPromise = null;
    }
  })();

  return inFlightPromise;
}

/**
 * Get a single content value by key, with fallback
 */
export async function getPageContent(key: string, fallback: string = ''): Promise<string> {
  const all = await fetchAllContent();
  return all[key] || fallback;
}

/**
 * Get multiple content values by keys
 */
export async function getPageContentBatch(
  keys: string[],
  fallbacks: Record<string, string> = {}
): Promise<Record<string, string>> {
  const all = await fetchAllContent();
  const result: Record<string, string> = {};
  keys.forEach((key) => {
    result[key] = all[key] || fallbacks[key] || '';
  });
  return result;
}

/**
 * Get all content for a category
 */
export async function getCategoryContent(category: string): Promise<Record<string, string>> {
  const all = await fetchAllContent();
  const result: Record<string, string> = {};
  Object.entries(all).forEach(([key, value]) => {
    // Keys are stored as page_key, category filtering is done via the category column
    // But we can filter by key prefix patterns
    result[key] = value;
  });
  return result;
}

/**
 * React hook-style helper for components
 * Returns a getter function that lazily fetches content
 */
export function createContentGetter() {
  let loaded = false;
  let content: Record<string, string> = {};

  return async function getContent(key: string, fallback: string = ''): Promise<string> {
    if (!loaded) {
      content = await fetchAllContent();
      loaded = true;
    }
    return content[key] || fallback;
  };
}
