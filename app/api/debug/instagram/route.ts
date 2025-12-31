import { NextRequest, NextResponse } from 'next/server';
import { fetchInstagramStats, fetchInstagramPosts } from '@/lib/api/instagram';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const stats = await fetchInstagramStats();
    const posts = await fetchInstagramPosts(3);
    
    return NextResponse.json({
      success: true,
      data: {
        stats,
        posts: posts.map(p => ({
          id: p.id,
          media_url: p.media_url,
          caption: p.caption?.substring(0, 100) + '...',
          like_count: p.like_count,
          comments_count: p.comments_count,
          timestamp: p.timestamp,
          media_type: p.media_type
        }))
      },
      env: {
        hasAccessToken: !!process.env.NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN,
        hasUserId: !!process.env.NEXT_PUBLIC_INSTAGRAM_USER_ID,
        accessTokenLength: process.env.NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN?.length,
        userId: process.env.NEXT_PUBLIC_INSTAGRAM_USER_ID
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
