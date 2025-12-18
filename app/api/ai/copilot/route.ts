import { NextRequest, NextResponse } from 'next/server';
import { runCopilotEngine, getSession, CopilotResponse } from '@/lib/copilot-ai-engine';
import { headers } from 'next/headers';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🤖 COPILOT API v2.0 - GitHub Copilot-like AI Endpoint
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This API provides Copilot-like capabilities:
 * - Stateful sessions
 * - Real file operations
 * - Preview and Apply actions
 * - JSON-only responses
 * 
 * @endpoint POST /api/ai/copilot
 */

export async function POST(request: NextRequest): Promise<NextResponse<CopilotResponse>> {
    try {
        const body = await request.json();
        const {
            message,
            sessionId = 'default',
            openFile,
            action // 'chat' | 'preview' | 'apply'
        } = body;
        
        // Validate input
        if (!message && action !== 'preview' && action !== 'apply') {
            return NextResponse.json({
                status: 'rejected',
                changeset: { summary: 'Message is required', files: [] },
                preview: { available: false, type: 'n/a', route: 'n/a' },
                error: 'Message is required for chat action'
            } as CopilotResponse, { status: 400 });
        }
        
        // Get base URL for internal API calls
        const headersList = await headers();
        const host = headersList.get('host') || 'localhost:3000';
        const protocol = host.includes('localhost') ? 'http' : 'https';
        const baseUrl = `${protocol}://${host}`;
        
        // Run the Copilot engine
        const result = await runCopilotEngine(message || '', {
            sessionId,
            baseUrl,
            openFile,
            action: action || 'chat'
        });
        
        // Log for debugging
        console.log(`[Copilot API] Session: ${sessionId}, Action: ${action || 'chat'}, Status: ${result.status}`);
        
        return NextResponse.json(result);
        
    } catch (error) {
        console.error('Copilot API error:', error);
        return NextResponse.json({
            status: 'error',
            changeset: { summary: 'Internal server error', files: [] },
            preview: { available: false, type: 'n/a', route: 'n/a' },
            error: error instanceof Error ? error.message : 'Unknown error'
        } as CopilotResponse, { status: 500 });
    }
}

/**
 * GET - Health check and session info
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
    const sessionId = request.nextUrl.searchParams.get('sessionId') || 'default';
    const session = getSession(sessionId);
    
    return NextResponse.json({
        status: 'ok',
        name: 'Copilot AI API v2.0',
        description: 'GitHub Copilot-like AI with real file operations',
        session: {
            id: sessionId,
            historyLength: session.history.length,
            pendingChanges: session.pendingChanges.length,
            appliedChanges: session.appliedChanges.length,
            recentFiles: session.projectContext.recentFiles
        },
        capabilities: [
            'file_search - Find files by pattern',
            'read_file - Read file contents',
            'grep_search - Search text in files',
            'list_dir - List directory contents',
            'write_file - Create/update files',
            'replace_in_file - DIFF-like editing',
            'generate_preview - Preview changes',
            'stateful_sessions - Remember context'
        ],
        actions: {
            chat: 'Generate code changes without applying',
            preview: 'Preview pending changes',
            apply: 'Apply pending changes to files'
        }
    });
}
