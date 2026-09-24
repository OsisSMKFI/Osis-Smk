import { NextResponse } from 'next/server';
import { fetchYouTubeData, type YouTubeApiResponse } from '@/lib/youtubeApi';

export const dynamic = 'force-dynamic';
export const revalidate = 1800; // 30 minutes

/**
 * GET /api/youtube
 * 
 * Fetch YouTube channel stats and latest videos
 * Auto-sync dari YouTube Data API v3
 * 
 * Query params:
 * - refresh=true : Force refresh cache
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    
    const result: YouTubeApiResponse = await fetchYouTubeData(forceRefresh);
    
    if (!result.success) {
      // Missing API key / quota — degrade to empty payload so public pages don't 500
      const msg = result.error || '';
      if (/not configured|YOUTUBE_API_KEY/i.test(msg)) {
        const res = NextResponse.json({
          success: true,
          data: null,
          empty: true,
          error: 'YOUTUBE_API_KEY is not configured',
          timestamp: new Date().toISOString(),
        });
        res.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
        return res;
      }
      return NextResponse.json(
        { success: false, error: msg || 'Failed to fetch YouTube data' },
        { status: 500 }
      );
    }

    const res = NextResponse.json({
      success: true,
      data: result.data,
      cached: result.cached,
      timestamp: new Date().toISOString(),
    });
    res.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    return res;
    
  } catch (error) {
    console.error('[API /youtube] Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
