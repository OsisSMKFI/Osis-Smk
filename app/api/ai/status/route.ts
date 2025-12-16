/**
 * AI Gateway Status Endpoint
 * Check if AI services are properly configured
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAIGatewayStatus } from '@/lib/vercel/ai-gateway';
import { auth } from '@/lib/auth';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    // Check authentication - only admin can see status
    const session = await auth();
    const isAdmin = session?.user?.role && ['super_admin', 'admin'].includes(session.user.role);

    const status = getAIGatewayStatus();

    // For non-admin, only show if AI is available
    if (!isAdmin) {
      return NextResponse.json({
        available: status.anyAvailable,
        message: status.anyAvailable ? 'AI services ready' : 'AI services not configured',
      });
    }

    // For admin, show detailed status
    return NextResponse.json({
      available: status.anyAvailable,
      mode: status.mode,
      endpoint: status.endpoint,
      configured: status.configured,
      availableModels: status.availableModels,
      message: status.anyAvailable 
        ? `AI Gateway active (${status.mode})` 
        : 'No AI Gateway configured. Add AI_GATEWAY_API_KEY or VERCEL_AI_GATEWAY_KEY in Vercel environment variables.',
    });
  } catch (error) {
    console.error('[AI Status] Error:', error);
    return NextResponse.json({ 
      available: false,
      error: 'Failed to check AI status',
    }, { status: 500 });
  }
}
