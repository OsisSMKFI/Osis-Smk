import { NextRequest, NextResponse } from 'next/server';
import { fetchInstagramStats, fetchInstagramPosts } from '@/lib/api/instagram';
import { fetchYouTubeVideos } from '@/lib/api/youtube';

export const dynamic = 'force-dynamic';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    instagram: {
      status: 'connected' | 'disconnected' | 'error';
      lastSync: string | null;
      followers: number;
      posts: number;
      error?: string;
      responseTime?: number;
    };
    youtube: {
      status: 'connected' | 'disconnected' | 'error';
      lastSync: string | null;
      videos: number;
      error?: string;
      responseTime?: number;
    };
  };
  environment: {
    hasInstagramToken: boolean;
    hasInstagramUserId: boolean;
    hasYouTubeApiKey: boolean;
    nodeEnv: string;
  };
}

async function measureResponseTime<T>(fn: () => Promise<T>): Promise<{ result: T; responseTime: number }> {
  const start = Date.now();
  const result = await fn();
  const responseTime = Date.now() - start;
  return { result, responseTime };
}

export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString();
  const health: HealthStatus = {
    status: 'healthy',
    timestamp,
    services: {
      instagram: {
        status: 'disconnected',
        lastSync: null,
        followers: 0,
        posts: 0
      },
      youtube: {
        status: 'disconnected',
        lastSync: null,
        videos: 0
      }
    },
    environment: {
      hasInstagramToken: !!process.env.NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN,
      hasInstagramUserId: !!process.env.NEXT_PUBLIC_INSTAGRAM_USER_ID,
      hasYouTubeApiKey: !!process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
      nodeEnv: process.env.NODE_ENV || 'unknown'
    }
  };

  // Test Instagram API
  if (health.environment.hasInstagramToken && health.environment.hasInstagramUserId) {
    try {
      const [{ result: stats, responseTime: statsTime }, { result: posts, responseTime: postsTime }] = await Promise.all([
        measureResponseTime(fetchInstagramStats),
        measureResponseTime(() => fetchInstagramPosts(3))
      ]);

      health.services.instagram = {
        status: 'connected',
        lastSync: timestamp,
        followers: stats.followers,
        posts: posts.length,
        responseTime: Math.max(statsTime, postsTime)
      };
    } catch (error) {
      health.services.instagram = {
        status: 'error',
        lastSync: null,
        followers: 0,
        posts: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      health.status = 'degraded';
    }
  }

  // Test YouTube API
  if (health.environment.hasYouTubeApiKey) {
    try {
      const { result: videos, responseTime } = await measureResponseTime(() => fetchYouTubeVideos(3));
      
      health.services.youtube = {
        status: 'connected',
        lastSync: timestamp,
        videos: videos.length,
        responseTime
      };
    } catch (error) {
      health.services.youtube = {
        status: 'error',
        lastSync: null,
        videos: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      if (health.status === 'healthy') health.status = 'degraded';
    }
  }

  // Determine overall health
  const connectedServices = Object.values(health.services).filter(s => s.status === 'connected').length;
  const totalServices = Object.keys(health.services).length;
  
  if (connectedServices === 0) {
    health.status = 'unhealthy';
  } else if (connectedServices < totalServices) {
    health.status = 'degraded';
  }

  // Add cache headers for better performance
  return NextResponse.json(health, {
    headers: {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=30',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
