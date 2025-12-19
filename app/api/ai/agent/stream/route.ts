import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { runAgentWithStreaming } from '@/lib/ai-agent-v3';

// ═══════════════════════════════════════════════════════════════════════════════
// 🤖 AI AGENT STREAMING API v2.0 - Full Action Copilot Mode
// ═══════════════════════════════════════════════════════════════════════════════
// CRITICAL: This API enables real-time AI agent actions like VS Code Copilot:
// - Automatically analyzes user intent
// - Executes tools FIRST before asking questions
// - Streams step-by-step progress
// - Shows tool results in real-time
// ═══════════════════════════════════════════════════════════════════════════════

interface StreamEvent {
    type: 'thinking' | 'tool-call' | 'tool-result' | 'file-edit' | 'terminal' | 'message' | 'done' | 'error';
    content: string;
    data?: Record<string, any>;
}

function createSSEEncoder() {
    const encoder = new TextEncoder();
    return {
        encode: (event: StreamEvent) => {
            return encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
        }
    };
}

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { message, conversationHistory = [], openFile, mode = 'design-studio' } = body;

    if (!message) {
        return new Response(JSON.stringify({ error: 'Message required' }), { status: 400 });
    }

    // Get base URL
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    // Create streaming response
    const stream = new ReadableStream({
        async start(controller) {
            const sse = createSSEEncoder();

            try {
                // Run the AI Agent with streaming callbacks
                const result = await runAgentWithStreaming(
                    message,
                    {
                        baseUrl,
                        conversationHistory,
                        openFile,
                        mode
                    },
                    // This callback streams each step to the client
                    (step) => {
                        controller.enqueue(sse.encode({
                            type: step.type,
                            content: step.content,
                            data: step.data
                        }));
                    }
                );

                // Send the final AI response
                controller.enqueue(sse.encode({
                    type: 'message',
                    content: result.response,
                    data: {
                        toolsUsed: result.toolsUsed.map(t => t.tool),
                        filesModified: result.filesModified
                    }
                }));

            } catch (error) {
                controller.enqueue(sse.encode({
                    type: 'error',
                    content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                }));
            } finally {
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        }
    });
}
