import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiAuth';
import { fetchInstagramStats, fetchInstagramPosts } from '@/lib/api/instagram';

export const dynamic = 'force-dynamic';

// Debug-only endpoint. Keep it super-admin only and never expose env values or
// stack traces from a public route.
export async function GET() {
  const authErr = await requirePermission('tools:access');
  if (authErr) return authErr;

  try {
    const stats = await fetchInstagramStats();
    const posts = await fetchInstagramPosts(3);

    return NextResponse.json({
      success: true,
      data: {
        stats,
        posts: posts.map((p) => ({
          id: p.id,
          media_url: p.media_url,
          caption: p.caption ? `${p.caption.substring(0, 100)}...` : null,
          like_count: p.like_count,
          comments_count: p.comments_count,
          timestamp: p.timestamp,
          media_type: p.media_type,
        })),
      },
      env: {
        hasAccessToken: !!process.env.NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN,
        hasUserId: !!process.env.NEXT_PUBLIC_INSTAGRAM_USER_ID,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Instagram tidak dapat dimuat.' }, { status: 500 });
  }
}
