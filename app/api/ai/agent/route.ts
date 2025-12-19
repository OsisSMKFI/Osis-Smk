import { NextRequest, NextResponse } from 'next/server';
import { runAIAgent, detectUserIntent } from '@/lib/ai-agent-v3';
import { headers } from 'next/headers';

// ═══════════════════════════════════════════════════════════════════════════════
// 🤖 AI AGENT API v2.0 - Full Action Copilot Mode
// ═══════════════════════════════════════════════════════════════════════════════
// This API provides a Copilot-like AI that:
// - ACTS FIRST, explains later
// - Searches files automatically
// - Reads and understands code
// - Edits files directly without asking
// - Runs terminal commands when needed
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { 
            message, 
            conversationHistory = [],
            openFile,
            mode = 'design-studio'
        } = body;
        
        if (!message) {
            return NextResponse.json({
                success: false,
                error: 'Message is required'
            }, { status: 400 });
        }
        
        // Get base URL for internal API calls
        const headersList = await headers();
        const host = headersList.get('host') || 'localhost:3000';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const baseUrl = `${protocol}://${host}`;
        
        // Detect user intent to log
        const intent = detectUserIntent(message);
        console.log('[AI Agent] Intent detected:', intent);
        
        // Run the AI agent
        const startTime = Date.now();
        const result = await runAIAgent(message, {
            baseUrl,
            conversationHistory,
            openFile,
            mode
        });
        const duration = Date.now() - startTime;
        
        console.log(`[AI Agent] Completed in ${duration}ms, tools used: ${result.toolsUsed.length}`);
        
        return NextResponse.json({
            success: true,
            reply: result.response,
            toolsUsed: result.toolsUsed.map(t => ({
                tool: t.tool,
                success: t.success,
                error: t.error
            })),
            filesModified: result.filesModified,
            duration,
            mode
        });
        
    } catch (error) {
        console.error('AI Agent API error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// Health check and info
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        name: 'AI Agent API',
        version: '1.0',
        description: 'Copilot-like AI with real tool capabilities',
        capabilities: [
            'file_search - Find files by pattern',
            'read_file - Read file contents',
            'grep_search - Search text in files',
            'list_dir - List directory contents',
            'write_file - Create/update files',
            'replace_in_file - DIFF-like editing',
            'run_terminal - Execute safe commands',
            'get_database - Query Supabase data'
        ],
        usage: {
            method: 'POST',
            body: {
                message: 'string (required) - User message',
                conversationHistory: 'array (optional) - Previous messages',
                openFile: '{ path: string, content?: string } (optional) - Currently open file',
                mode: '"design-studio" | "live-chat" (optional)'
            }
        }
    });
}
