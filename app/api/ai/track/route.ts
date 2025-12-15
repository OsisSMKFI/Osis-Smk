// app/api/ai/track/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * AI Event Tracking API
 * Receives events from client-side AI monitoring and logs to activity_logs
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    
    const {
      event,
      data,
      url,
      timestamp
    } = body;

    // Get IP and User Agent
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    // Determine activity type based on event
    let activityType = 'other';
    if (event.includes('ai_')) activityType = 'ai_chat_message';
    if (event.includes('performance')) activityType = 'other';
    if (event.includes('error')) activityType = 'other';
    if (event.includes('page_view')) activityType = 'event_view';
    if (event.includes('user_action')) activityType = 'other';

    // Log to activity_logs table
    const { error } = await supabaseAdmin
      .from('activity_logs')
      .insert({
        user_id: session?.user?.id || null,
        user_name: session?.user?.name || 'Anonymous',
        user_email: session?.user?.email || null,
        user_role: session?.user?.role || 'visitor',
        activity_type: activityType,
        action: `ai_track:${event}`,
        description: `AI Event: ${event}`,
        metadata: {
          event_name: event,
          event_data: data,
          page_url: url,
          event_timestamp: timestamp,
          source: 'ai-monitor'
        },
        ip_address: ipAddress,
        user_agent: userAgent,
        status: 'success',
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('[AI Track] Insert error:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Event tracked successfully'
    });

  } catch (error: any) {
    console.error('[AI Track] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
