import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

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

    // Convert media URLs to signed URLs
    const postsWithSignedUrls = await Promise.all(
      (data || []).map(async (post: any) => {
        const updatedPost = { ...post };
        
        // Convert featured_image if present
        if (post.featured_image) {
          // If already a full HTTP URL, use as-is
          if (post.featured_image.startsWith('http')) {
            updatedPost.featured_image = post.featured_image;
          } else {
            // Relative path — convert to public URL directly
            const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vyorjqbrugjjeioayscg.supabase.co'}/storage/v1/object/public/${post.featured_image}`;
            updatedPost.featured_image = publicUrl;
          }
        }
        
        // Convert author photo_url if present
        if (post.author?.photo_url) {
          if (post.author.photo_url.startsWith('http')) {
            // Keep as-is
          } else {
            const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vyorjqbrugjjeioayscg.supabase.co'}/storage/v1/object/public/${post.author.photo_url}`;
            updatedPost.author = {
              ...post.author,
              photo_url: publicUrl,
            };
          }
        }
        
        return updatedPost;
      })
    );

    return NextResponse.json({ posts: postsWithSignedUrls });
  } catch (error) {
    console.error('Error in posts API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
