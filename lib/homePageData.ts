'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from './supabase/client';

// ============================================
// TYPES
// ============================================

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string | null;
  published_at: string;
  views: number;
  author: { name: string; photo_url: string | null } | null;
  sekbid: { name: string; color: string; icon: string } | null;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'urgent' | 'high' | 'medium' | 'low' | 'normal';
  created_at: string;
  expires_at: string | null;
}

export interface PollOption {
  id: string;
  option_text: string;
  votes: number;
  order_index: number;
}

export interface Poll {
  id: string;
  question: string;
  expires_at: string;
  poll_options: PollOption[];
}

export interface HomePageData {
  posts: Post[];
  announcements: Announcement[];
  polls: Poll[];
}

// ============================================
// CACHE LAYER
// ============================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 60 * 1000; // 1 minute cache
const cache: {
  posts?: CacheEntry<Post[]>;
  announcements?: CacheEntry<Announcement[]>;
  polls?: CacheEntry<Poll[]>;
} = {};

function isCacheValid<T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> {
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_TTL;
}

// ============================================
// DATA FETCHERS (with caching)
// ============================================

export async function fetchPosts(limit: number = 3): Promise<Post[]> {
  if (isCacheValid(cache.posts) && cache.posts.data.length >= limit) {
    return cache.posts.data.slice(0, limit);
  }

  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id, title, slug, excerpt, featured_image, published_at, views, status,
        author:users(id, name, photo_url),
        sekbid:sekbid(id, name, color, icon)
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('[HomePageData] Posts fetch error:', error.message);
      // Try fallback without joins
      const { data: fallback } = await supabase
        .from('posts')
        .select('id, title, slug, excerpt, featured_image, published_at, views')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(limit);
      
      const posts = (fallback || []).map(p => ({ ...p, author: null, sekbid: null })) as unknown as Post[];
      cache.posts = { data: posts, timestamp: Date.now() };
      return posts;
    }

    // Transform Supabase joined data (arrays) to expected format (objects)
    const posts = (data || []).map((p: any) => ({
      ...p,
      author: Array.isArray(p.author) ? p.author[0] || null : p.author || null,
      sekbid: Array.isArray(p.sekbid) ? p.sekbid[0] || null : p.sekbid || null,
    })) as Post[];
    
    cache.posts = { data: posts, timestamp: Date.now() };
    return posts;
  } catch (err) {
    console.error('[HomePageData] Posts exception:', err);
    return [];
  }
}

export async function fetchAnnouncements(limit: number = 5): Promise<Announcement[]> {
  if (isCacheValid(cache.announcements)) {
    return cache.announcements.data.slice(0, limit);
  }

  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .or(`expires_at.is.null,expires_at.gte.${now}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('[HomePageData] Announcements fetch error:', error.message);
      return [];
    }

    const announcements = (data || []) as Announcement[];
    cache.announcements = { data: announcements, timestamp: Date.now() };
    return announcements;
  } catch (err) {
    console.error('[HomePageData] Announcements exception:', err);
    return [];
  }
}

export async function fetchPolls(): Promise<Poll[]> {
  if (isCacheValid(cache.polls)) {
    return cache.polls.data;
  }

  try {
    const { data, error } = await supabase
      .from('polls')
      .select('*, poll_options(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[HomePageData] Polls fetch error:', error.message);
      return [];
    }

    const now = new Date();
    const activePolls = (data || []).filter((poll: Poll) => {
      if (!poll.expires_at) return true;
      return new Date(poll.expires_at) > now;
    }) as Poll[];

    cache.polls = { data: activePolls, timestamp: Date.now() };
    return activePolls;
  } catch (err) {
    console.error('[HomePageData] Polls exception:', err);
    return [];
  }
}

// ============================================
// BATCH FETCH (fetch all at once)
// ============================================

let batchPromise: Promise<HomePageData> | null = null;
let batchTimestamp = 0;
const BATCH_DEBOUNCE = 100; // ms

export async function fetchAllHomePageData(): Promise<HomePageData> {
  // Debounce: if a batch is already in progress and recent, wait for it
  if (batchPromise && Date.now() - batchTimestamp < BATCH_DEBOUNCE) {
    return batchPromise;
  }

  batchTimestamp = Date.now();
  batchPromise = (async () => {
    const [posts, announcements, polls] = await Promise.all([
      fetchPosts(3),
      fetchAnnouncements(5),
      fetchPolls(),
    ]);
    return { posts, announcements, polls };
  })();

  return batchPromise;
}

// ============================================
// REACT HOOK
// ============================================

export function useHomePageData() {
  const [data, setData] = useState<HomePageData>({
    posts: [],
    announcements: [],
    polls: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const refresh = useCallback(async () => {
    // Clear cache on refresh
    delete cache.posts;
    delete cache.announcements;
    delete cache.polls;
    
    setLoading(true);
    try {
      const result = await fetchAllHomePageData();
      setData(result);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Prevent double fetch in React StrictMode
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetchAllHomePageData()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { ...data, loading, error, refresh };
}

// ============================================
// CACHE INVALIDATION
// ============================================

export function invalidateHomePageCache() {
  delete cache.posts;
  delete cache.announcements;
  delete cache.polls;
  batchPromise = null;
}
