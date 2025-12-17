import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

// ═══════════════════════════════════════════════════════════════════════════════
// 🔔 ADMIN NOTIFICATIONS API - Premium v5.0
// ═══════════════════════════════════════════════════════════════════════════════
// Unified notification system for:
// - User messages forwarded from LiveChat
// - System notifications
// - Error alerts
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role || 'user';
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const type = searchParams.get('type');

    // Build query - get notifications for this user's role
    let query = supabaseAdmin
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by target based on user role
    // Super Admin sees all, Admin sees admin+osis, etc
    if (userRole === 'super_admin') {
      // Super admin sees all notifications
    } else if (userRole === 'admin') {
      query = query.or(`target.eq.admin,target.eq.osis,target.is.null,user_id.eq.${session.user.id}`);
    } else {
      // Regular user only sees their own
      query = query.eq('user_id', session.user.id);
    }

    if (unreadOnly) {
      // Support both column names for backwards compatibility
      query = query.or('read.eq.false,is_read.eq.false');
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data: notifications, error } = await query.limit(50);

    if (error) {
      const code = (error as any).code || '';
      const msg = (error as any).message || '';
      // Graceful degradation
      if (code === 'PGRST205' || code === '42P01' || msg.includes('schema cache') || msg.includes('relation') || msg.includes('does not exist')) {
        return NextResponse.json({ ok: true, notifications: [], actions: [] });
      }
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    // Normalize notifications to consistent format
    const normalizedNotifications = (notifications || []).map((n: any) => ({
      id: n.id,
      type: n.type || 'info',
      target: n.target || 'admin',
      title: n.title || 'Notification',
      message: n.message || '',
      sender_name: n.sender_name || 'System',
      session_id: n.session_id,
      is_urgent: n.is_urgent || false,
      read: n.read ?? n.is_read ?? false,
      link: n.link,
      action: n.action || n.title,
      status: (n.read ?? n.is_read) ? 'reviewed' : 'pending',
      payload: {
        message: n.message,
        sender: n.sender_name,
        urgent: n.is_urgent,
      },
      created_at: n.created_at,
      metadata: n.metadata,
    }));

    return NextResponse.json({ 
      ok: true,
      notifications: normalizedNotifications,
      actions: normalizedNotifications, // For backwards compatibility with AdminHeader
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, message, type, link } = body;

    const { data, error } = await supabaseAdmin
      .from('admin_notifications')
      .insert({
        user_id: session.user.id,
        title,
        message,
        type: type || 'info',
        link,
        read: false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const markAllRead = searchParams.get('markAllRead') === 'true';

    if (markAllRead) {
      const { error } = await supabaseAdmin
        .from('admin_notifications')
        .update({ read: true })
        .eq('user_id', session.user.id)
        .eq('read', false);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (!id) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('admin_notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Notification marked as read' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
