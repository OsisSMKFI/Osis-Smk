import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { logActivity, getIpAddress } from '@/lib/activity-logger';

/**
 * POST /api/attendance/biometric/reset-request
 * User requests admin to reset their biometric data
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { reason } = await request.json();

    // Check if biometric data exists
    const { data: biometricData } = await supabaseAdmin
      .from('biometric_data')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!biometricData) {
      return NextResponse.json(
        { error: 'No biometric data found' },
        { status: 404 }
      );
    }

    // Check if there's already a pending request
    const { data: existingRequest } = await supabaseAdmin
      .from('biometric_reset_requests')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      return NextResponse.json(
        { 
          error: 'You already have a pending reset request',
          requestId: existingRequest.id,
          requestedAt: existingRequest.created_at
        },
        { status: 400 }
      );
    }

    // Create reset request
    const { data: resetRequest, error } = await supabaseAdmin
      .from('biometric_reset_requests')
      .insert({
        user_id: userId,
        reason: reason || 'User requested biometric data reset',
        status: 'pending',
        requested_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Log activity - to activity_logs table
    await logActivity({
      userId,
      userName: session.user.name || '',
      userEmail: session.user.email || '',
      userRole: (session.user.role || '').toLowerCase(),
      activityType: 'security_validation',
      action: 'biometric_reset_request',
      description: 'Requested biometric data reset',
      metadata: {
        requestId: resetRequest.id,
        reason: reason,
        timestamp: new Date().toISOString()
      },
      status: 'success',
      ipAddress: getIpAddress(request),
      userAgent: request.headers.get('user-agent') || ''
    });

    // TODO: Send notification to admin (implement later)
    // await notifyAdmins('biometric_reset_request', { userId, requestId: resetRequest.id });

    return NextResponse.json({
      success: true,
      message: 'Reset request submitted successfully. Admin will review your request.',
      requestId: resetRequest.id,
      data: resetRequest
    });

  } catch (error: any) {
    console.error('[Biometric Reset Request] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit reset request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/attendance/biometric/reset-request
 * Get user's reset request status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get latest reset request
    const { data: resetRequest } = await supabaseAdmin
      .from('biometric_reset_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      success: true,
      hasRequest: !!resetRequest,
      request: resetRequest || null
    });

  } catch (error: any) {
    console.error('[Biometric Reset Request] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get reset request' },
      { status: 500 }
    );
  }
}
