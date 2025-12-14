/**
 * Vercel AI Gateway API Route
 * Chat completion endpoint using multiple AI models
 */

import { NextRequest } from 'next/server';
import { streamAIText, type ModelName } from '@/lib/vercel/ai-gateway';
import { auth } from '@/lib/auth';
import type { CoreMessage } from 'ai';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { 
      messages, 
      model = 'gpt-4o-mini',
      system,
      temperature = 0.7,
      stream = true,
    } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate model
    const validModels: ModelName[] = [
      'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo', 'o1', 'o1-mini',
      'claude-3-5-sonnet', 'claude-3-5-haiku', 'claude-3-opus',
      'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash',
    ];

    if (!validModels.includes(model)) {
      return new Response(JSON.stringify({ error: 'Invalid model' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (stream) {
      // Streaming response
      const result = await streamAIText({
        model,
        messages: messages as CoreMessage[],
        system,
        temperature,
      });

      return result.toTextStreamResponse();
    } else {
      // Non-streaming response
      const { generateAIText } = await import('@/lib/vercel/ai-gateway');
      const result = await generateAIText({
        model,
        messages: messages as CoreMessage[],
        system,
        temperature,
      });

      return new Response(JSON.stringify({ 
        text: result.text,
        usage: result.usage,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('[AI Gateway] Error:', error);
    return new Response(JSON.stringify({ 
      error: 'AI request failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
