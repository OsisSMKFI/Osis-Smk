import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase/server';
import { logActivity, getIpAddress, parseUserAgent } from '@/lib/activity-logger';

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
}

export async function GET(request: NextRequest) {
  try {
    console.log('[Comments API] GET request started');
    
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');
    const contentType = searchParams.get('contentType');

    console.log('[Comments API] Params:', { contentId, contentType });

    if (!contentId || !contentType) {
      return NextResponse.json(
        { error: 'contentId dan contentType diperlukan' },
        { status: 400 }
      );
    }

    // Fetch comments
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .eq('content_id', contentId)
      .eq('content_type', contentType)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Comments API] Supabase error:', error);
      return NextResponse.json(
        { error: 'Gagal mengambil komentar', details: error.message },
        { status: 500 }
      );
    }

    console.log('[Comments API] Found', comments?.length || 0, 'comments');

    // Get session to check user likes
    const session = await auth();
    const userId = session?.user?.id || 'anonymous';

    // Fetch like counts and user's likes for each comment
    const commentsWithLikes = await Promise.all(
      (comments || []).map(async (comment) => {
        // Get author role from users table
        let authorRole = null;
         let authorPhotoUrl = null;
         let instagramUsername = null;
         let kelas = null;
         let nickname = null;
        if (comment.user_id) {
          // Coba lengkap dulu; kalau ada kolom yang tidak ada di skema
          // (PGRST204/42703) → fallback minimal: role tetap terbaca
          // supaya badge role penulis selalu tampil.
          const full = await supabase
            .from('users')
            .select('role, photo_url, instagram_username, kelas, nickname')
            .eq('id', comment.user_id)
            .maybeSingle();
          let userData: any = full.data || null;
          if (full.error) {
            const min = await supabase
              .from('users')
              .select('role')
              .eq('id', comment.user_id)
              .maybeSingle();
            userData = min.data || null;
          }
          authorRole = userData?.role || null;
          authorPhotoUrl = userData?.photo_url || null;
          instagramUsername = userData?.instagram_username || null;
          kelas = userData?.kelas || null;
          nickname = userData?.nickname || null;
        }

        // Get like count
        const { count } = await supabase
          .from('comment_likes')
          .select('*', { count: 'exact', head: true })
          .eq('comment_id', comment.id);

        // Check if user liked
        const { data: userLike } = await supabase
          .from('comment_likes')
          .select('*')
          .eq('comment_id', comment.id)
          .eq('user_id', userId)
          .single();

        return {
          ...comment,
          author_role: authorRole,
           author_photo_url: authorPhotoUrl,
           instagram_username: instagramUsername,
           kelas: kelas,
           nickname: nickname,
          likes: count || 0,
          liked_by_user: !!userLike
        };
      })
    );

    return NextResponse.json({ comments: commentsWithLikes });
  } catch (error) {
    console.error('[Comments API] Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Comments API] POST request started');
    
    const session = await auth();
    console.log('[Comments API] Session:', session?.user?.id ? 'Authenticated' : 'Anonymous');
    
    const body = await request.json();
    console.log('[Comments API] Request body:', body);
    
    const { contentId, contentType, content, authorName, parentId } = body;

    if (!contentId || !contentType || !content) {
      console.error('[Comments API] Missing required fields:', { contentId, contentType, content });
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    const isAnonymous = !session?.user?.id;
    const displayName = isAnonymous ? 'Anonymous' : (authorName || session.user.name || 'User');

    // Try with user_id first (new schema), fallback if column doesn't exist
    let commentData: any = {
      content_id: contentId,
      content_type: contentType,
      content: content.trim(),
      author_name: displayName,
      author_id: null, // keep null to avoid FK to auth.users
      user_id: !isAnonymous ? session?.user?.id : null,
      is_anonymous: isAnonymous,
      parent_id: parentId || null,
      created_at: new Date().toISOString()
    };

    console.log('[Comments API] Inserting comment:', commentData);

    // Insert dgn retry: kalau DB menolak kolom tertentu (PGRST204/42703 —
    // kolom belum ada di skema / schema cache) → buang kolom itu & coba lagi,
    // sampai insert masuk. Ini mencegah 500 saat kolom opsional (parent_id,
    // is_anonymous, dll) belum tersedia.
    let attemptPayload: any = { ...commentData };
    let comment: any = null;
    let error: any = null;
    for (let attempt = 0; attempt < 6; attempt++) {
      const res = await supabase
        .from('comments')
        .insert([attemptPayload])
        .select()
        .single();
      comment = res.data;
      error = res.error;
      if (!error) break;

      const msg = error.message || '';
      const colMatch = msg.match(/'([^']+)' column/) || msg.match(/column "([^"]+)"/);
      const unknownCol = error.code === 'PGRST204' || error.code === '42703';
      if (unknownCol && colMatch && colMatch[1] in attemptPayload) {
        console.warn('[Comments API] Column rejected by DB, dropping:', colMatch[1]);
        delete attemptPayload[colMatch[1]];
        continue;
      }
      // FK violation on author_id (auth.users tidak ada di setup ini)
      if (error.code === '23503' && 'author_id' in attemptPayload && msg.includes('author_id')) {
        console.warn('[Comments API] FK violation on author_id, dropping it');
        delete attemptPayload.author_id;
        continue;
      }
      break;
    }

    if (error) {
      console.error('[Comments API] Supabase error:', error);
      console.error('[Comments API] Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: 'Gagal menambahkan komentar', details: error.message, code: error.code },
        { status: 500 }
      );
    }

    console.log('[Comments API] Comment created successfully:', comment?.id);

    // Log comment creation activity
    if (!isAnonymous && session?.user?.id) {
      await logActivity({
        userId: session.user.id,
        userName: session.user.name,
        userEmail: session.user.email,
        userRole: (session.user as any).role,
        activityType: 'post_comment',
        action: 'Comment created',
        description: `User commented on ${contentType}: ${contentId}`,
        metadata: {
          comment_id: comment?.id,
          content_id: contentId,
          content_type: contentType,
          content_preview: content.substring(0, 50),
        },
        ipAddress: getIpAddress(request),
        userAgent: request.headers.get('user-agent') || undefined,
        deviceInfo: parseUserAgent(request.headers.get('user-agent') || ''),
        relatedId: comment?.id?.toString(),
        relatedType: 'comment',
        status: 'success',
      });
    }

    // Add default likes count
    const commentWithLikes = {
      ...comment,
      likes: 0,
      liked_by_user: false
    };

    return NextResponse.json({ comment: commentWithLikes }, { status: 201 });
  } catch (error) {
    console.error('[Comments API] Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
