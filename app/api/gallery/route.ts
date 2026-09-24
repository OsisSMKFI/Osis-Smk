import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { resolveStorageUrl, dedupeByMedia } from '@/lib/mediaUrls';

export async function GET() {
  try {
    const { data: gallery, error } = await supabaseAdmin
      .from('gallery')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching gallery:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Public URLs only (no per-item signed URL round trips)
    const galleryWithUrls = dedupeByMedia(
      (gallery || []).map((item: any) => {
        const folder = item.category || item.folder || 'general';
        const resolvedImage = resolveStorageUrl(item.image_url, folder);
        const resolvedVideo = resolveStorageUrl(item.video_url, folder);
        const resolvedUrl = resolveStorageUrl(item.url, folder);

        return {
          ...item,
          image_url: resolvedImage || resolvedVideo || resolvedUrl,
          video_url: resolvedVideo,
          url: resolvedUrl,
        };
      })
    );

    const res = NextResponse.json({ gallery: galleryWithUrls });
    res.headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
    return res;
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
