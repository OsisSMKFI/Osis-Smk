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
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Failed to fetch YouTube data' 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: result.data,
      cached: result.cached,
      timestamp: new Date().toISOString(),
    });
    
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
