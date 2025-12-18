import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getConfig } from '@/lib/adminConfig';

// ═══════════════════════════════════════════════════════════════════════════════
// 🤖 AI AGENT STREAMING API v1.0 - Real-time Copilot-like Experience
// ═══════════════════════════════════════════════════════════════════════════════
// Streams:
// - 🔍 Tool calls (read_file, grep_search, etc)
// - 📝 File edits with diff view
// - ✅ Success/error notifications
// - 💬 AI response in chunks
// ═══════════════════════════════════════════════════════════════════════════════

interface StreamEvent {
    type: 'thinking' | 'tool-call' | 'tool-result' | 'file-edit' | 'terminal' | 'message' | 'done' | 'error';
    content: string;
    data?: Record<string, any>;
}

// Tool definitions (same as ai-agent.ts but condensed)
const TOOL_DEFINITIONS = `
Available tools:
1. file_search - Find files by pattern
2. read_file - Read file contents  
3. grep_search - Search text in files
4. list_dir - List directory
5. write_file - Create/update files
6. replace_in_file - DIFF-like editing
7. run_terminal - Execute commands
8. get_database - Query data

Use format: \`\`\`tool-call\n{"tool":"name","params":{...}}\n\`\`\`
`;

function createSSEEncoder() {
    const encoder = new TextEncoder();
    return {
        encode: (event: StreamEvent) => {
            return encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
        }
    };
}

async function executeTool(tool: string, params: Record<string, any>, baseUrl: string): Promise<{ success: boolean; result: any; error?: string }> {
    try {
        const response = await fetch(`${baseUrl}/api/ai/tools`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tool, params })
        });
        return await response.json();
    } catch (err) {
        return { success: false, result: null, error: String(err) };
    }
}

function parseToolCalls(text: string): { tool: string; params: Record<string, any> }[] {
    const calls: { tool: string; params: Record<string, any> }[] = [];
    const regex = /```tool-call\n([\s\S]*?)```/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
        try {
            const parsed = JSON.parse(match[1].trim());
            if (parsed.tool) calls.push(parsed);
        } catch { /* skip */ }
    }
    return calls;
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
            const toolsUsed: string[] = [];
            const filesModified: string[] = [];

            try {
                // Step 1: Thinking
                controller.enqueue(sse.encode({
                    type: 'thinking',
                    content: '🧠 Menganalisis permintaan...'
                }));

                // Get AI keys
                const geminiKey = await getConfig('GEMINI_API_KEY');
                const openaiKey = await getConfig('OPENAI_API_KEY');

                if (!geminiKey && !openaiKey) {
                    controller.enqueue(sse.encode({
                        type: 'error',
                        content: '❌ Tidak ada API key AI yang dikonfigurasi'
                    }));
                    controller.close();
                    return;
                }

                // Build prompt
                const systemPrompt = `Kamu adalah AI Assistant seperti GitHub Copilot.
${TOOL_DEFINITIONS}
${openFile ? `\n📂 File terbuka: ${openFile.path}` : ''}

PENTING:
- Gunakan tools untuk mengumpulkan konteks NYATA
- Tunjukkan proses kerja dengan tool calls
- Response dalam Bahasa Indonesia`;

                const messages = [
                    { role: 'system', content: systemPrompt },
                    ...(conversationHistory || []).slice(-4),
                    { role: 'user', content: message }
                ];

                controller.enqueue(sse.encode({
                    type: 'thinking',
                    content: '🤖 Merencanakan langkah-langkah...'
                }));

                // Call AI
                let aiResponse = '';
                
                if (geminiKey) {
                    const geminiResponse = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contents: messages.map(m => ({
                                    role: m.role === 'assistant' ? 'model' : 'user',
                                    parts: [{ text: m.role === 'system' ? `[SYSTEM] ${m.content}` : m.content }]
                                })),
                                generationConfig: { temperature: 0.3, maxOutputTokens: 4096 }
                            })
                        }
                    );
                    const data = await geminiResponse.json();
                    aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                } else if (openaiKey) {
                    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${openaiKey}`
                        },
                        body: JSON.stringify({
                            model: 'gpt-4o-mini',
                            messages,
                            temperature: 0.3,
                            max_tokens: 4096
                        })
                    });
                    const data = await openaiResponse.json();
                    aiResponse = data.choices?.[0]?.message?.content || '';
                }

                // Parse and execute tool calls
                const toolCalls = parseToolCalls(aiResponse);
                
                if (toolCalls.length > 0) {
                    for (const call of toolCalls) {
                        // Announce tool call
                        const toolLabels: Record<string, string> = {
                            'file_search': '🔍 Mencari file...',
                            'read_file': '📖 Membaca file...',
                            'grep_search': '🔎 Mencari dalam kode...',
                            'list_dir': '📁 Melihat direktori...',
                            'write_file': '✍️ Menulis file...',
                            'replace_in_file': '✏️ Mengedit file...',
                            'run_terminal': '💻 Menjalankan terminal...',
                            'get_database': '🗄️ Mengquery database...'
                        };

                        controller.enqueue(sse.encode({
                            type: 'tool-call',
                            content: toolLabels[call.tool] || `🔧 ${call.tool}...`,
                            data: { tool: call.tool, params: call.params }
                        }));

                        // Execute tool
                        const result = await executeTool(call.tool, call.params, baseUrl);
                        toolsUsed.push(call.tool);

                        // File modification tracking
                        if (result.success && (call.tool === 'write_file' || call.tool === 'replace_in_file')) {
                            filesModified.push(call.params.filePath);
                            controller.enqueue(sse.encode({
                                type: 'file-edit',
                                content: `✅ File diubah: ${call.params.filePath}`,
                                data: { path: call.params.filePath, action: call.tool }
                            }));
                        }

                        // Report result
                        controller.enqueue(sse.encode({
                            type: 'tool-result',
                            content: result.success 
                                ? `✅ ${call.tool} selesai`
                                : `❌ ${call.tool} gagal: ${result.error}`,
                            data: { 
                                tool: call.tool, 
                                success: result.success,
                                preview: typeof result.result === 'string' 
                                    ? result.result.slice(0, 200) 
                                    : JSON.stringify(result.result).slice(0, 200)
                            }
                        }));
                    }

                    // Get final response with tool results context
                    controller.enqueue(sse.encode({
                        type: 'thinking',
                        content: '💭 Menyusun respons berdasarkan hasil...'
                    }));
                }

                // Stream the response
                controller.enqueue(sse.encode({
                    type: 'message',
                    content: aiResponse,
                    data: { toolsUsed, filesModified }
                }));

                // Done
                controller.enqueue(sse.encode({
                    type: 'done',
                    content: 'Complete',
                    data: { toolsUsed, filesModified }
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
