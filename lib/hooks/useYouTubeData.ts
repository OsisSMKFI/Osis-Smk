'use client';

import { useState, useEffect, useCallback } from 'react';
import type { YouTubeChannelStats, YouTubeVideo } from '@/lib/youtubeApi';

interface UseYouTubeDataResult {
  channel: YouTubeChannelStats | null;
  videos: YouTubeVideo[];
  loading: boolean;
  error: string | null;
  cached: boolean;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

/**
 * React hook untuk fetch YouTube data dengan auto-refresh
 * 
 * @param autoRefreshInterval - Interval refresh dalam ms (default: 30 menit)
 */
export function useYouTubeData(autoRefreshInterval: number = 30 * 60 * 1000): UseYouTubeDataResult {
  const [channel, setChannel] = useState<YouTubeChannelStats | null>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const url = forceRefresh ? '/api/youtube?refresh=true' : '/api/youtube';
      const response = await fetch(url);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch YouTube data');
      }
      
      if (result.data) {
        setChannel(result.data.channel);
        setVideos(result.data.videos || []);
        setCached(result.cached || false);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('[useYouTubeData] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (autoRefreshInterval > 0) {
      const interval = setInterval(() => {
        fetchData();
      }, autoRefreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [autoRefreshInterval, fetchData]);

  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  return {
    channel,
    videos,
    loading,
    error,
    cached,
    refresh,
    lastUpdated,
  };
}
