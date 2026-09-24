import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// GET - Fetch interaction stats (likes, views, comments count)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');
    const contentType = searchParams.get('contentType');
    const userId = searchParams.get('userId'); // Optional - to check if user liked

    if (!contentId || !contentType) {
      return NextResponse.json({ error: 'Missing contentId or contentType' }, { status: 400 });
    }

    // Get likes count
    const { count: likesCount, error: likesError } = await supabaseAdmin
      .from('content_likes')
      .select('*', { count: 'exact', head: true })
      .eq('content_id', contentId)
      .eq('content_type', contentType);

    if (likesError) {
      console.error('[Interactions API] Likes count error:', likesError);
    }

    // Get views count
    const { count: viewsCount, error: viewsError } = await supabaseAdmin
      .from('content_views')
      .select('*', { count: 'exact', head: true })
      .eq('content_id', contentId)
      .eq('content_type', contentType);

    if (viewsError) {
      console.error('[Interactions API] Views count error:', viewsError);
    }

    // Get comments count
    const { count: commentsCount, error: commentsError } = await supabaseAdmin
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('content_id', contentId)
      .eq('content_type', contentType);

    if (commentsError) {
      console.error('[Interactions API] Comments count error:', commentsError);
    }

    // Check if current user liked (if userId provided)
    let isLiked = false;
    if (userId) {
      const { data: userLike } = await supabaseAdmin
        .from('content_likes')
        .select('id')
        .eq('content_id', contentId)
        .eq('content_type', contentType)
        .eq('user_id', userId)
        .single();
      
      isLiked = !!userLike;
    }

    const res = NextResponse.json({
      success: true,
      stats: {
        likes: likesCount || 0,
        views: viewsCount || 0,
        comments: commentsCount || 0,
        isLiked
      }
    });
    // 60s edge cache for anonymous; private short cache for logged-in like state
    res.headers.set(
      'Cache-Control',
      userId
        ? 'private, max-age=30, stale-while-revalidate=30'
        : 'public, max-age=60, stale-while-revalidate=60'
    );
    return res;
  } catch (error) {
    console.error('[Interactions API] GET Error:', error);
    return NextResponse.json({ 
      success: true, 
      stats: { likes: 0, views: 0, comments: 0, isLiked: false } 
    });
  }
}

// POST - Track view or toggle like
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contentId, contentType, action, userId, fingerprint } = body;

    if (!contentId || !contentType || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (action === 'view') {
      // Track view - use fingerprint for anonymous users
      const viewerId = userId || fingerprint || 'anonymous';
      
      // Check if already viewed (prevent duplicate views in same session)
      const { data: existingView } = await supabaseAdmin
        .from('content_views')
        .select('id')
        .eq('content_id', contentId)
        .eq('content_type', contentType)
        .eq('viewer_id', viewerId)
        .single();

      if (!existingView) {
        // Insert new view
        await supabaseAdmin.from('content_views').insert({
          content_id: contentId,
          content_type: contentType,
          viewer_id: viewerId,
          user_id: userId || null
        });
      }

      // Get updated view count
      const { count } = await supabaseAdmin
        .from('content_views')
        .select('*', { count: 'exact', head: true })
        .eq('content_id', contentId)
        .eq('content_type', contentType);

      return NextResponse.json({ success: true, views: count || 0 });
    }

    if (action === 'like') {
      // Toggle like - requires userId
      if (!userId) {
        return NextResponse.json({ error: 'Login required to like' }, { status: 401 });
      }

      // Check if already liked
      const { data: existingLike } = await supabaseAdmin
        .from('content_likes')
        .select('id')
        .eq('content_id', contentId)
        .eq('content_type', contentType)
        .eq('user_id', userId)
        .single();

      if (existingLike) {
        // Unlike
        await supabaseAdmin
          .from('content_likes')
          .delete()
          .eq('id', existingLike.id);
        
        const { count } = await supabaseAdmin
          .from('content_likes')
          .select('*', { count: 'exact', head: true })
          .eq('content_id', contentId)
          .eq('content_type', contentType);

        return NextResponse.json({ success: true, liked: false, likes: count || 0 });
      } else {
        // Like
        await supabaseAdmin.from('content_likes').insert({
          content_id: contentId,
          content_type: contentType,
          user_id: userId
        });

        const { count } = await supabaseAdmin
          .from('content_likes')
          .select('*', { count: 'exact', head: true })
          .eq('content_id', contentId)
          .eq('content_type', contentType);

        return NextResponse.json({ success: true, liked: true, likes: count || 0 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[Interactions API] POST Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
