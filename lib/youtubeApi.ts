/**
 * YouTube Data API v3 Integration
 * Auto-sync subscribers, views, and video list
 * 
 * Channel: OSIS SMK Informatika Fithrah Insani
 * Channel ID: UCjX4FhTSwd6Y7WUPZwecSeg
 */

export interface YouTubeChannelStats {
  channelId: string;
  title: string;
  description: string;
  customUrl: string;
  thumbnailUrl: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  lastUpdated: string;
}

export interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  channelTitle: string;
  // Statistics (from videos API)
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  duration?: string;
}

export interface YouTubeApiResponse {
  success: boolean;
  data?: {
    channel: YouTubeChannelStats;
    videos: YouTubeVideo[];
  };
  error?: string;
  cached?: boolean;
}

// Cache configuration
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes
let cachedData: YouTubeApiResponse['data'] | null = null;
let cacheTimestamp: number = 0;

// YouTube API configuration
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const CHANNEL_ID = 'UCjX4FhTSwd6Y7WUPZwecSeg';

/**
 * Get YouTube API Key from environment
 */
function getApiKey(): string {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error('YOUTUBE_API_KEY is not configured');
  }
  return apiKey;
}

/**
 * Fetch channel statistics from YouTube API
 */
export async function fetchChannelStats(): Promise<YouTubeChannelStats> {
  const apiKey = getApiKey();
  
  const url = `${YOUTUBE_API_BASE}/channels?part=snippet,statistics&id=${CHANNEL_ID}&key=${apiKey}`;
  
  const response = await fetch(url, {
    next: { revalidate: 1800 }, // Cache for 30 minutes
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`YouTube API Error: ${error.error?.message || response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.items || data.items.length === 0) {
    throw new Error('Channel not found');
  }
  
  const channel = data.items[0];
  const snippet = channel.snippet;
  const statistics = channel.statistics;
  
  return {
    channelId: channel.id,
    title: snippet.title,
    description: snippet.description,
    customUrl: snippet.customUrl || '',
    thumbnailUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
    subscriberCount: parseInt(statistics.subscriberCount) || 0,
    viewCount: parseInt(statistics.viewCount) || 0,
    videoCount: parseInt(statistics.videoCount) || 0,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Fetch latest videos from channel with statistics
 */
export async function fetchChannelVideos(maxResults: number = 6): Promise<YouTubeVideo[]> {
  const apiKey = getApiKey();
  
  // Step 1: Search for videos
  const searchUrl = `${YOUTUBE_API_BASE}/search?part=snippet&channelId=${CHANNEL_ID}&maxResults=${maxResults}&order=date&type=video&key=${apiKey}`;
  
  const searchResponse = await fetch(searchUrl, {
    next: { revalidate: 1800 }, // Cache for 30 minutes
  });
  
  if (!searchResponse.ok) {
    const error = await searchResponse.json();
    throw new Error(`YouTube API Error: ${error.error?.message || searchResponse.statusText}`);
  }
  
  const searchData = await searchResponse.json();
  
  if (!searchData.items || searchData.items.length === 0) {
    return [];
  }
  
  // Step 2: Get video IDs for statistics
  const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
  
  // Step 3: Fetch video statistics
  const statsUrl = `${YOUTUBE_API_BASE}/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${apiKey}`;
  
  const statsResponse = await fetch(statsUrl, {
    next: { revalidate: 1800 },
  });
  
  let statsMap: Record<string, any> = {};
  if (statsResponse.ok) {
    const statsData = await statsResponse.json();
    statsData.items?.forEach((item: any) => {
      statsMap[item.id] = {
        viewCount: parseInt(item.statistics?.viewCount) || 0,
        likeCount: parseInt(item.statistics?.likeCount) || 0,
        commentCount: parseInt(item.statistics?.commentCount) || 0,
        duration: item.contentDetails?.duration || '',
      };
    });
  }
  
  // Step 4: Combine search results with statistics
  return searchData.items.map((item: any) => {
    const stats = statsMap[item.id.videoId] || {};
    return {
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
      publishedAt: item.snippet.publishedAt,
      channelTitle: item.snippet.channelTitle,
      viewCount: stats.viewCount,
      likeCount: stats.likeCount,
      commentCount: stats.commentCount,
      duration: stats.duration,
    };
  });
}

/**
 * Fetch all YouTube data (channel stats + videos) with caching
 */
export async function fetchYouTubeData(forceRefresh: boolean = false): Promise<YouTubeApiResponse> {
  // Check cache
  const now = Date.now();
  if (!forceRefresh && cachedData && (now - cacheTimestamp) < CACHE_DURATION_MS) {
    return {
      success: true,
      data: cachedData,
      cached: true,
    };
  }
  
  try {
    const [channel, videos] = await Promise.all([
      fetchChannelStats(),
      fetchChannelVideos(),
    ]);
    
    const data = { channel, videos };
    
    // Update cache
    cachedData = data;
    cacheTimestamp = now;
    
    return {
      success: true,
      data,
      cached: false,
    };
  } catch (error) {
    console.error('[YouTube API] Error:', error);
    
    // Return cached data if available, even if expired
    if (cachedData) {
      return {
        success: true,
        data: cachedData,
        cached: true,
        error: 'Using cached data due to API error',
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get embed URL for a video
 */
export function getEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Get watch URL for a video
 */
export function getWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Format subscriber/view count for display
 */
export function formatCount(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Get channel URL
 */
export function getChannelUrl(): string {
  return `https://www.youtube.com/channel/${CHANNEL_ID}`;
}
