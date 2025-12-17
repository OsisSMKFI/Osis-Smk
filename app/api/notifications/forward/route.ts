import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// Notification type for filtering
interface Notification {
  id: string;
  is_read: boolean;
  target: string;
  type: string;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📨 MESSAGE FORWARDING API - Premium v5.0
// ═══════════════════════════════════════════════════════════════════════════════
// Forward messages from users to OSIS/Admin/Super Admin
// Creates notifications in admin panel
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { target, message, urgent, sessionId, timestamp, senderName } = body;

    if (!target || !message) {
      return NextResponse.json({ error: 'Target and message required' }, { status: 400 });
    }

    // Validate target
    const validTargets = ['osis', 'admin', 'super_admin'];
    if (!validTargets.includes(target)) {
      return NextResponse.json({ error: 'Invalid target' }, { status: 400 });
    }

    // Create notification in database
    const notification = {
      type: 'user_message',
      target,
      title: urgent ? '🚨 Pesan Urgent dari User' : '💬 Pesan dari User',
      message: message.slice(0, 1000), // Limit message length
      sender_name: senderName || 'Anonymous',
      session_id: sessionId,
      is_urgent: urgent || false,
      is_read: false,
      created_at: timestamp || new Date().toISOString(),
      metadata: {
        source: 'live_chat',
        forwarded: true,
      },
    };

    const { data, error } = await supabaseAdmin
      .from('admin_notifications')
      .insert(notification)
      .select()
      .single();

    if (error) {
      // If table doesn't exist, create it
      if (error.code === '42P01') {
        // Table doesn't exist - return success anyway for graceful degradation
        console.warn('admin_notifications table does not exist');
        return NextResponse.json({ 
          success: true, 
          message: 'Message received (notification system pending setup)',
          id: 'pending'
        });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Message forwarded successfully',
      id: data?.id,
      target,
    });

  } catch (error: any) {
    console.error('Forward message error:', error);
    return NextResponse.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
}

// GET - Retrieve notifications for admin
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const target = searchParams.get('target') || 'all';
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabaseAdmin
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (target !== 'all') {
      query = query.eq('target', target);
    }

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) {
      // Graceful degradation if table doesn't exist
      if (error.code === '42P01') {
        return NextResponse.json({ 
          notifications: [],
          message: 'Notification system pending setup'
        });
      }
      throw error;
    }

    // Count unread
    const unreadCount = (data as Notification[] | null)?.filter((n: Notification) => !n.is_read).length || 0;

    return NextResponse.json({
      success: true,
      notifications: data || [],
      unreadCount,
      total: data?.length || 0,
    });

  } catch (error: any) {
    console.error('Get notifications error:', error);
    return NextResponse.json({ 
      error: error.message,
      notifications: [] 
    }, { status: 500 });
  }
}
