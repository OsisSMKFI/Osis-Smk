import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  testAIConnection,
  getCustomAIProvider,
  resolveChatCompletionsUrl,
  resolveAltChatCompletionsUrl,
} from '@/lib/aiProvider';
import { getConfig } from '@/lib/adminConfig';

export const runtime = 'nodejs';

/**
 * POST /api/ai/test — Test koneksi AI provider secara nyata.
 * Mencoba Custom provider (CUSTOM_AI_BASE_URL/KEY) → Gemini → OpenAI.
 * Dipakai tombol "Test Koneksi AI" di Admin → Settings.
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const role = ((session.user as any).role || '').toLowerCase();
    if (!['super_admin', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const custom = await getCustomAIProvider();
    const result = await testAIConnection();
    const baseUrl = (await getConfig('CUSTOM_AI_BASE_URL')) || null;
    const resolvedUrls = custom
      ? [resolveChatCompletionsUrl(custom.baseUrl), resolveAltChatCompletionsUrl(custom.baseUrl)].filter(Boolean)
      : [];

    return NextResponse.json({
      success: result.ok,
      configured: {
        custom: !!custom,
        customBaseUrl: baseUrl,
        customModel: custom?.model || null,
        resolvedUrls,
        gemini: !!(await getConfig('GEMINI_API_KEY')),
        openai: !!(await getConfig('OPENAI_API_KEY')),
      },
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Test failed', checked: [] },
      { status: 500 }
    );
  }
}
