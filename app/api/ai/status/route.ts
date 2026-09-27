import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/lib/adminConfig';
import { getCustomAIProvider } from '@/lib/aiProvider';
import { getAIGatewayStatus } from '@/lib/vercel/ai-gateway';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest) {
  try {
    const [openaiKey, geminiKey, anthropicKey, tavilyKey, customProvider] = await Promise.all([
      getConfig('OPENAI_API_KEY'),
      getConfig('GEMINI_API_KEY'),
      getConfig('ANTHROPIC_API_KEY'),
      getConfig('TAVILY_API_KEY'),
      getCustomAIProvider(),
    ]);

    const hasOpenAI = !!openaiKey && openaiKey.length > 10;
    const hasGemini = !!geminiKey && geminiKey.length > 10;
    const hasAnthropic = !!anthropicKey && anthropicKey.length > 10;
    const hasTavily = !!tavilyKey && tavilyKey.length > 10;
    const hasCustom = !!customProvider;

    const gatewayStatus = getAIGatewayStatus();

    const providers = [
      { id: 'auto', name: 'Auto (Smart Pick)', available: hasCustom || hasGemini || hasOpenAI || hasAnthropic || gatewayStatus.anyAvailable },
      { id: 'custom', name: customProvider ? `Custom (${customProvider.model})` : 'Custom AI', available: hasCustom },
      { id: 'gemini', name: 'Google Gemini', available: hasGemini },
      { id: 'openai', name: 'OpenAI (GPT)', available: hasOpenAI },
      { id: 'anthropic', name: 'Anthropic (Claude)', available: hasAnthropic },
    ];

    return NextResponse.json(
      {
        providers,
        features: {
          webSearch: hasTavily,
          vision: hasGemini || hasOpenAI,
          gateway: gatewayStatus.anyAvailable,
        },
        anyAvailable: hasCustom || hasGemini || hasOpenAI || hasAnthropic || gatewayStatus.anyAvailable,
      },
      { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=60' } }
    );
  } catch (error) {
    console.error('[AI Status] Error:', error);
    return NextResponse.json({
      providers: [
        { id: 'auto', name: 'Auto (Smart Pick)', available: false },
        { id: 'custom', name: 'Custom AI', available: false },
        { id: 'gemini', name: 'Google Gemini', available: false },
        { id: 'openai', name: 'OpenAI (GPT)', available: false },
        { id: 'anthropic', name: 'Anthropic (Claude)', available: false },
      ],
      features: { webSearch: false, vision: false, gateway: false },
      anyAvailable: false,
    });
  }
}
