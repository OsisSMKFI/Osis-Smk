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
      defaultProvider: status.defaultProvider,
      providers: {
        openai: {
          configured: status.openai.configured,
          models: status.openai.configured ? ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1', 'o1-mini'] : [],
        },
        anthropic: {
          configured: status.anthropic.configured,
          models: status.anthropic.configured ? ['claude-3-5-sonnet', 'claude-3-5-haiku', 'claude-3-opus'] : [],
        },
        google: {
          configured: status.google.configured,
          models: status.google.configured ? ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'] : [],
        },
      },
      message: status.anyAvailable 
        ? `AI Gateway active with ${status.defaultProvider}` 
        : 'No AI provider configured. Add OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY in Vercel environment variables.',
    });
  } catch (error) {
    console.error('[AI Status] Error:', error);
    return NextResponse.json({ 
      available: false,
      error: 'Failed to check AI status',
    }, { status: 500 });
  }
}
