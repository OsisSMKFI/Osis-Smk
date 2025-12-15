import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { logActivity, getIpAddress, parseUserAgent } from '@/lib/activity-logger';

/**
 * POST /api/attendance/log-activity
 * Log user activity for monitoring - Uses centralized activity_logs table
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      userEmail, 
      userName,
      userRole,
      activityType, 
      description,
      status,
      details 
    } = body;

    // Validate required fields
    if (!userId || !activityType) {
      return NextResponse.json(
        { error: 'userId and activityType are required' },
        { status: 400 }
      );
    }

    // Get client info
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'Unknown';

    // Use centralized activity logger - logs to activity_logs table
    await logActivity({
      userId,
      userEmail,
      userName,
      userRole,
      activityType: activityType as any,
      action: activityType,
      description: description || activityType,
      status: status || 'success',
      metadata: details || {},
      ipAddress: ip,
      userAgent
    });

    console.log('[Log Activity API] ✅ Logged to activity_logs:', activityType, 'for', userEmail);

    return NextResponse.json({
      success: true,
      message: 'Activity logged successfully'
    });

  } catch (error: any) {
    console.error('[Log Activity API] ❌ Error:', error);
    return NextResponse.json(
      { error: 'Failed to log activity', message: error.message },
      { status: 500 }
    );
  }
}