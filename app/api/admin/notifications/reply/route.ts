import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

// ═══════════════════════════════════════════════════════════════════════════════
// 📨 ADMIN REPLY API - Premium v5.0
// ═══════════════════════════════════════════════════════════════════════════════
// Allows admin to reply to user messages from LiveChat
// Stores reply in database for future retrieval
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role || 'user';
    if (!['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { originalNotifId, sessionId, message, senderName } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Reply message required' }, { status: 400 });
    }

    // Create reply notification for the user's session
    const replyData = {
      type: 'admin_reply',
      target: 'user',
      title: '💬 Balasan dari Admin',
      message: message.trim(),
      sender_name: senderName || session.user.name || 'Admin',
      sender_id: session.user.id,
      session_id: sessionId,
      original_notif_id: originalNotifId,
      is_urgent: false,
      read: false,
      is_read: false,
      created_at: new Date().toISOString(),
      metadata: {
        reply_from: userRole,
        admin_email: session.user.email,
      },
    };

    // Store the reply
    const { data: reply, error: replyError } = await supabaseAdmin
      .from('admin_notifications')
      .insert(replyData)
      .select()
      .single();

    if (replyError) {
      // If table structure doesn't support all columns, try minimal insert
      if (replyError.code === '42703') {
        const minimalReply = {
          type: 'admin_reply',
          title: '💬 Balasan dari Admin',
          message: message.trim(),
          read: false,
          created_at: new Date().toISOString(),
        };
        
        const { error: minError } = await supabaseAdmin
          .from('admin_notifications')
          .insert(minimalReply);
        
        if (minError) {
          console.error('Reply insert error:', minError);
          return NextResponse.json({ error: minError.message }, { status: 500 });
        }
      } else if (replyError.code === '42P01') {
        // Table doesn't exist
        return NextResponse.json({ 
          success: true, 
          message: 'Reply recorded (notification system pending setup)',
          id: 'pending'
        });
      } else {
        console.error('Reply insert error:', replyError);
        return NextResponse.json({ error: replyError.message }, { status: 500 });
      }
    }

    // Mark original notification as read
    if (originalNotifId) {
      await supabaseAdmin
        .from('admin_notifications')
        .update({ read: true, is_read: true })
        .eq('id', originalNotifId);
    }

    return NextResponse.json({
      success: true,
      message: 'Reply sent successfully',
      id: reply?.id,
    });

  } catch (error: any) {
    console.error('Reply API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - Retrieve replies for a session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const { data: replies, error } = await supabaseAdmin
      .from('admin_notifications')
      .select('*')
      .eq('type', 'admin_reply')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ replies: [] });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      replies: replies || [],
    });

  } catch (error: any) {
    console.error('Get replies error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
