import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { resolveStorageUrl } from '@/lib/mediaUrls';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const featured = searchParams.get('featured');
    const limit = searchParams.get('limit') || '10';

    let query = supabaseAdmin
      .from('posts')
      .select(`
        *,
        author:users!author_id (
          id,
          name,
          photo_url
        )
      `)
      .eq('status', 'published')
      // Supabase JS order options do not support nullsLast in this version; removed for type safety
      .order('published_at', { ascending: false });

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    query = query.limit(Math.min(parseInt(limit) || 10, 50));

    const { data, error } = await query;

    if (error) {
      // Gracefully handle missing table/columns so UI doesn't crash
      const code = (error as any).code || '';
      const message = (error as any).message || '';
      if (code === 'PGRST205' || message.includes('schema cache') || message.includes('Could not find the table')) {
        console.warn('[public/posts] Table/columns missing, returning empty list');
        return NextResponse.json({ posts: [] });
      }
      console.error('Error fetching posts:', error);
      return NextResponse.json({ error: message || 'Failed to fetch posts' }, { status: 500 });
    }

    // Resolve media URLs (signed → public, relative → full, dead → null)
    const postsWithSignedUrls = (data || []).map((post: any) => {
      const updatedPost = { ...post };
      updatedPost.featured_image = resolveStorageUrl(post.featured_image, 'posts');
      if (post.author) {
        updatedPost.author = {
          ...post.author,
          photo_url: resolveStorageUrl(post.author.photo_url, 'profiles'),
        };
      }
      return updatedPost;
    });

    const res = NextResponse.json({ posts: postsWithSignedUrls });
    res.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=60');
    return res;
  } catch (error) {
    console.error('Error in posts API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
