// lib/hooks/useSocialMediaAutoSync.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchInstagramStats, fetchInstagramPosts } from '../api/instagram';
import { fetchYouTubeVideos } from '../api/youtube';

interface SyncStatus {
  instagram: {
    lastSync: Date | null;
    followers: number;
    posts: number;
    error: string | null;
    isSyncing: boolean;
  };
  youtube: {
    lastSync: Date | null;
    subscribers: number;
    videos: number;
    error: string | null;
    isSyncing: boolean;
  };
}

export function useSocialMediaAutoSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    instagram: {
      lastSync: null,
      followers: 0,
      posts: 0,
      error: null,
      isSyncing: false
    },
    youtube: {
      lastSync: null,
      subscribers: 0,
      videos: 0,
      error: null,
      isSyncing: false
    }
  });

  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(true);

  // Sync Instagram data
  const syncInstagram = useCallback(async () => {
    if (!process.env.NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN) return;

    setSyncStatus(prev => ({
      ...prev,
      instagram: { ...prev.instagram, isSyncing: true, error: null }
    }));

    try {
      const [stats, posts] = await Promise.all([
        fetchInstagramStats(),
        fetchInstagramPosts(12)
      ]);

      setSyncStatus(prev => ({
        ...prev,
        instagram: {
          lastSync: new Date(),
          followers: stats.followers,
          posts: posts.length,
          error: null,
          isSyncing: false
        }
      }));

      console.log('✅ Instagram sync successful:', { 
        followers: stats.followers, 
        posts: posts.length 
      });

    } catch (error) {
      console.error('❌ Instagram sync failed:', error);
      setSyncStatus(prev => ({
        ...prev,
        instagram: {
          ...prev.instagram,
          error: error instanceof Error ? error.message : 'Unknown error',
          isSyncing: false
        }
      }));
    }
  }, []);

  // Sync YouTube data
  const syncYouTube = useCallback(async () => {
    if (!process.env.NEXT_PUBLIC_YOUTUBE_API_KEY) return;

    setSyncStatus(prev => ({
      ...prev,
      youtube: { ...prev.youtube, isSyncing: true, error: null }
    }));

    try {
      const videos = await fetchYouTubeVideos(12);

      setSyncStatus(prev => ({
        ...prev,
        youtube: {
          lastSync: new Date(),
          subscribers: 0, // YouTube stats handled by separate hook
          videos: videos.length,
          error: null,
          isSyncing: false
        }
      }));

      console.log('✅ YouTube sync successful:', { videos: videos.length });

    } catch (error) {
      console.error('❌ YouTube sync failed:', error);
      setSyncStatus(prev => ({
        ...prev,
        youtube: {
          ...prev.youtube,
          error: error instanceof Error ? error.message : 'Unknown error',
          isSyncing: false
        }
      }));
    }
  }, []);

  // Manual sync all platforms
  const syncAll = useCallback(async () => {
    console.log('🔄 Starting manual sync of all platforms...');
    await Promise.all([
      syncInstagram(),
      syncYouTube()
    ]);
    console.log('✅ Manual sync completed');
  }, [syncInstagram, syncYouTube]);

  // Auto-sync on mount and interval
  useEffect(() => {
    if (!isAutoSyncEnabled) return;

    // Initial sync
    syncAll();

    // Auto-sync every 30 minutes
    const interval = setInterval(syncAll, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAutoSyncEnabled, syncAll]);

  // Sync on window focus (user returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      if (isAutoSyncEnabled) {
        const timeSinceLastSync = syncStatus.instagram.lastSync 
          ? Date.now() - syncStatus.instagram.lastSync.getTime()
          : Infinity;

        // Only sync if last sync was more than 5 minutes ago
        if (timeSinceLastSync > 5 * 60 * 1000) {
          syncAll();
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAutoSyncEnabled, syncAll, syncStatus.instagram.lastSync]);

  return {
    syncStatus,
    isAutoSyncEnabled,
    setIsAutoSyncEnabled,
    syncAll,
    syncInstagram,
    syncYouTube
  };
}
