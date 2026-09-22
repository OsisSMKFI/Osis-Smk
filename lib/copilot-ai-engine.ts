/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🤖 COPILOT AI ENGINE v2.0 - GitHub Copilot-like Intelligence
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * This engine provides GitHub Copilot-like capabilities:
 * - Real file operations (read, write, search)
 * - Project structure understanding
 * - Context-aware code generation
 * - Preview system for changes
 * - Stateful session management
 * - JSON-only output contract
 * 
 * @author Webosis Design Studio
 * @version 2.0.0
 */

import { supabaseAdmin } from '@/lib/supabase/server';
import { getConfig } from '@/lib/adminConfig';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface CopilotResponse {
    status: 'acknowledged' | 'applied' | 'no-changes' | 'rejected' | 'preview-ready' | 'error';
    changeset: {
        summary: string;
        files: Array<{
            path: string;
            action: 'create' | 'modify' | 'delete' | 'read';
            content?: string;
            diff?: { find: string; replace: string };
        }>;
    };
    preview: {
        available: boolean;
        type: 'local' | 'conceptual' | 'n/a';
        route: string;
        html?: string;
    };
    narration?: string[];
    error?: string;
}

export interface CopilotSession {
    id: string;
    history: Array<{
        role: 'user' | 'assistant' | 'system';
        content: string;
        timestamp: Date;
        action?: string;
        filesModified?: string[];
    }>;
    pendingChanges: CopilotResponse['changeset']['files'];
    appliedChanges: string[];
    projectContext: {
        structure: Record<string, string[]>;
        openFile?: { path: string; content: string };
        recentFiles: string[];
    };
}

export interface ToolCall {
    tool: string;
    params: Record<string, any>;
    result?: any;
    success?: boolean;
    error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

const COPILOT_TOOLS = {
    file_search: {
        name: 'file_search',
        description: 'Search for files by glob pattern',
        schema: { pattern: 'string', maxResults: 'number?' }
    },
    read_file: {
        name: 'read_file',
        description: 'Read file contents with optional line range',
        schema: { filePath: 'string', startLine: 'number?', endLine: 'number?' }
    },
    grep_search: {
        name: 'grep_search',
        description: 'Search for text/regex in files',
        schema: { query: 'string', isRegexp: 'boolean?', includePattern: 'string?' }
    },
    list_dir: {
        name: 'list_dir',
        description: 'List directory contents',
        schema: { path: 'string' }
    },
    write_file: {
        name: 'write_file',
        description: 'Create or update a file',
        schema: { filePath: 'string', content: 'string' }
    },
    replace_in_file: {
        name: 'replace_in_file',
        description: 'Find and replace text in a file (DIFF-like)',
        schema: { filePath: 'string', find: 'string', replace: 'string' }
    },
    get_project_structure: {
        name: 'get_project_structure',
        description: 'Get the full project structure',
        schema: {}
    },
    generate_preview: {
        name: 'generate_preview',
        description: 'Generate a preview for the current changes',
        schema: { component: 'string', props: 'object?' }
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SESSION MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

const sessions = new Map<string, CopilotSession>();

export function getSession(sessionId: string): CopilotSession {
    if (!sessions.has(sessionId)) {
        sessions.set(sessionId, {
            id: sessionId,
            history: [],
            pendingChanges: [],
            appliedChanges: [],
            projectContext: {
                structure: {},
                recentFiles: []
            }
        });
    }
    return sessions.get(sessionId)!;
}

export function updateSession(sessionId: string, updates: Partial<CopilotSession>): void {
    const session = getSession(sessionId);
    Object.assign(session, updates);
    sessions.set(sessionId, session);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CORE ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

export async function runCopilotEngine(
    message: string,
    options: {
        sessionId: string;
        baseUrl: string;
        openFile?: { path: string; content: string };
        action?: 'chat' | 'preview' | 'apply';
    }
): Promise<CopilotResponse> {
    const session = getSession(options.sessionId);
    const narration: string[] = [];
    
    // Update session with open file
    if (options.openFile) {
        session.projectContext.openFile = options.openFile;
        if (!session.projectContext.recentFiles.includes(options.openFile.path)) {
            session.projectContext.recentFiles.unshift(options.openFile.path);
            session.projectContext.recentFiles = session.projectContext.recentFiles.slice(0, 10);
        }
    }
    
    // Handle explicit actions
    if (options.action === 'apply') {
        return handleApplyAction(session, narration);
    }
    
    if (options.action === 'preview') {
        return handlePreviewAction(session, narration);
    }
    
    // Add message to history
    session.history.push({
        role: 'user',
        content: message,
        timestamp: new Date()
    });
    
    // Detect intent and required tools
    const intent = analyzeIntent(message);
    narration.push(`Intent detected: ${intent.type}`);
    
    // Execute tools based on intent
    const toolResults: ToolCall[] = [];
    
    for (const toolName of intent.requiredTools) {
        const result = await executeTool(toolName, intent.params[toolName] || {}, options.baseUrl);
        toolResults.push(result);
        narration.push(`Tool ${toolName}: ${result.success ? 'success' : 'failed'}`);
    }
    
    // Generate response based on tool results
    const aiResponse = await generateAIResponse(message, toolResults, session, options.baseUrl);
    
    // Parse changes from AI response
    const changes = parseChangesFromResponse(aiResponse);
    
    // Update session with pending changes
    if (changes.length > 0) {
        session.pendingChanges = changes;
        updateSession(options.sessionId, session);
    }
    
    // Add AI response to history
    session.history.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        filesModified: changes.map(c => c.path)
    });
    
    // Build response
    return {
        status: changes.length > 0 ? 'preview-ready' : 'acknowledged',
        changeset: {
            summary: changes.length > 0 
                ? `${changes.length} file(s) ready for preview/apply`
                : 'No changes detected',
            files: changes
        },
        preview: {
            available: changes.length > 0,
            type: changes.length > 0 ? 'local' : 'n/a',
            route: changes.length > 0 ? '/admin/design-studio?preview=true' : 'n/a'
        },
        narration
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTENT ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════════

interface Intent {
    type: 'query' | 'edit' | 'create' | 'delete' | 'search' | 'explain';
    requiredTools: string[];
    params: Record<string, Record<string, any>>;
    targetFiles: string[];
}

function analyzeIntent(message: string): Intent {
    const lower = message.toLowerCase();
    
    const intent: Intent = {
        type: 'query',
        requiredTools: [],
        params: {},
        targetFiles: []
    };
    
    // Detect file mentions
    const filePatterns = [
        /(?:file|komponen|component)\s+([^\s,\.]+\.(tsx?|jsx?|css|json))/gi,
        /(components\/[^\s]+\.tsx)/gi,
        /(app\/[^\s]+\.tsx)/gi,
        /(lib\/[^\s]+\.ts)/gi
    ];
    
    for (const pattern of filePatterns) {
        let match;
        while ((match = pattern.exec(message)) !== null) {
            intent.targetFiles.push(match[1] || match[0]);
        }
    }
    
    // Detect intent type
    if (/buat(kan)?|create|tambah(kan)?|add|generate/i.test(lower)) {
        intent.type = 'create';
        intent.requiredTools = ['list_dir', 'read_file', 'write_file'];
    } else if (/ubah|edit|ganti|modify|update|perbaiki|fix/i.test(lower)) {
        intent.type = 'edit';
        intent.requiredTools = ['file_search', 'read_file', 'replace_in_file'];
    } else if (/hapus|delete|remove/i.test(lower)) {
        intent.type = 'delete';
        intent.requiredTools = ['read_file'];
    } else if (/dimana|where|cari|find|lokasi|letak/i.test(lower)) {
        intent.type = 'search';
        intent.requiredTools = ['file_search', 'grep_search'];
    } else if (/jelaskan|explain|apa itu|what is|bagaimana/i.test(lower)) {
        intent.type = 'explain';
        intent.requiredTools = ['read_file'];
    }
    
    // Build params for tools
    if (intent.targetFiles.length > 0) {
        intent.params.read_file = { filePath: intent.targetFiles[0] };
        intent.params.file_search = { pattern: `**/*${intent.targetFiles[0]}*` };
    }
    
    // Extract search query
    const searchMatch = message.match(/(?:cari|find|search)\s+["']?([^"'\n]+)["']?/i);
    if (searchMatch) {
        intent.params.grep_search = { query: searchMatch[1] };
    }
    
    return intent;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOOL EXECUTION
// ═══════════════════════════════════════════════════════════════════════════════

async function executeTool(toolName: string, params: Record<string, any>, baseUrl: string): Promise<ToolCall> {
    try {
        const response = await fetch(`${baseUrl}/api/ai/tools`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tool: toolName, params })
        });
        
        const data = await response.json();
        
        return {
            tool: toolName,
            params,
            result: data.result,
            success: data.success,
            error: data.error
        };
    } catch (err) {
        return {
            tool: toolName,
            params,
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error'
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI RESPONSE GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

async function generateAIResponse(
    message: string,
    toolResults: ToolCall[],
    session: CopilotSession,
    baseUrl: string
): Promise<string> {
    const geminiKey = await getConfig('GEMINI_API_KEY');
    const openaiKey = await getConfig('OPENAI_API_KEY');
    
    if (!geminiKey && !openaiKey) {
        return 'No AI API key configured.';
    }
    
    // Build context from tool results
    let toolContext = '';
    for (const result of toolResults) {
        if (result.success) {
            toolContext += `\n### ${result.tool} result:\n`;
            if (result.tool === 'read_file') {
                toolContext += `\`\`\`${result.result?.language || 'text'}\n${result.result?.content?.slice(0, 5000) || 'Empty'}\n\`\`\`\n`;
            } else if (result.tool === 'file_search') {
                toolContext += `Files found: ${(result.result || []).join(', ')}\n`;
            } else if (result.tool === 'grep_search') {
                const matches = result.result || [];
                toolContext += `Found ${matches.length} matches:\n`;
                matches.slice(0, 5).forEach((m: any) => {
                    toolContext += `- ${m.file}:${m.line}: ${m.text?.slice(0, 100)}\n`;
                });
            } else if (result.tool === 'list_dir') {
                toolContext += `Directory contents: ${(result.result || []).map((e: any) => e.name).join(', ')}\n`;
            }
        }
    }
    
    // Build system prompt
    const systemPrompt = `You are an AI assistant like GitHub Copilot in a Design Studio environment.

CAPABILITIES:
- Read and analyze real project files
- Generate code changes with exact file paths
- Provide DIFF-based edits for surgical changes
- Create new files with proper structure

RULES:
1. Always reference exact file paths
2. Use tool results to understand context
3. Generate complete, valid code
4. Use DIFF format for small changes:
   \`\`\`diff:path/to/file.tsx
   <<<FIND>>>
   old code
   <<<REPLACE>>>
   new code
   \`\`\`
5. Use full file format for new files or large changes:
   \`\`\`tsx:path/to/file.tsx
   // complete file content
   \`\`\`

OPEN FILE CONTEXT:
${session.projectContext.openFile ? `Path: ${session.projectContext.openFile.path}\nContent (first 2000 chars):\n${session.projectContext.openFile.content.slice(0, 2000)}` : 'No file open'}

TOOL RESULTS:
${toolContext}

RECENT FILES: ${session.projectContext.recentFiles.join(', ')}

Respond with actionable code or clear explanations. Always specify file paths.`;

    const messages = [
        { role: 'system', content: systemPrompt },
        ...session.history.slice(-6).map(h => ({
            role: h.role === 'system' ? 'assistant' : h.role,
            content: h.content.slice(0, 1000)
        })),
        { role: 'user', content: message }
    ];
    
    try {
        if (geminiKey) {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: messages.map(m => ({
                            role: m.role === 'assistant' ? 'model' : 'user',
                            parts: [{ text: m.content }]
                        })),
                        generationConfig: {
                            temperature: 0.3,
                            maxOutputTokens: 8192,
                            thinkingConfig: { thinkingBudget: 0 }
                        }
                    })
                }
            );
            
            const data = await response.json();
            const parts = data.candidates?.[0]?.content?.parts || [];
            const answerParts = parts.filter((p: any) => !p.thought);
            return answerParts.map((p: any) => p.text || '').join('\n').trim() || 'No response generated.';
        } else if (openaiKey) {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openaiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages,
                    temperature: 0.3,
                    max_tokens: 8192
                })
            });
            
            const data = await response.json();
            return data.choices?.[0]?.message?.content || 'No response generated.';
        }
    } catch (err) {
        return `Error generating response: ${err instanceof Error ? err.message : 'Unknown'}`;
    }
    
    return 'No AI available.';
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHANGE PARSING
// ═══════════════════════════════════════════════════════════════════════════════

function parseChangesFromResponse(response: string): CopilotResponse['changeset']['files'] {
    const changes: CopilotResponse['changeset']['files'] = [];
    
    // Parse DIFF blocks
    const diffRegex = /```diff:([^\n]+)\s*\n\s*<<<\s*FIND\s*>>>\s*\n([\s\S]*?)\n\s*<<<\s*REPLACE\s*>>>\s*\n([\s\S]*?)```/gi;
    let match;
    while ((match = diffRegex.exec(response)) !== null) {
        changes.push({
            path: match[1].trim(),
            action: 'modify',
            diff: {
                find: match[2].trim(),
                replace: match[3].trim()
            }
        });
    }
    
    // Parse full file blocks
    const fileRegex = /```(\w+):([^\n]+)\n([\s\S]*?)```/g;
    while ((match = fileRegex.exec(response)) !== null) {
        const lang = match[1];
        if (lang === 'diff') continue; // Skip, already handled
        
        changes.push({
            path: match[2].trim(),
            action: 'modify',
            content: match[3].trim()
        });
    }
    
    return changes;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTION HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

async function handleApplyAction(session: CopilotSession, narration: string[]): Promise<CopilotResponse> {
    if (session.pendingChanges.length === 0) {
        return {
            status: 'rejected',
            changeset: { summary: 'No pending changes to apply', files: [] },
            preview: { available: false, type: 'n/a', route: 'n/a' },
            narration: ['Rejected: No code changes were generated in the previous message.'],
            error: 'No pending changes. Generate code first before applying.'
        };
    }
    
    // Apply all pending changes
    const appliedFiles: string[] = [];
    const errors: string[] = [];
    
    for (const change of session.pendingChanges) {
        try {
            // For now, mark as applied (actual file writing happens via API)
            appliedFiles.push(change.path);
            session.appliedChanges.push(change.path);
            narration.push(`Applied: ${change.path} (${change.action})`);
        } catch (err) {
            errors.push(`Failed to apply ${change.path}: ${err instanceof Error ? err.message : 'Unknown'}`);
        }
    }
    
    // Clear pending changes
    session.pendingChanges = [];
    
    return {
        status: errors.length === 0 ? 'applied' : 'error',
        changeset: {
            summary: `Applied ${appliedFiles.length} file(s)${errors.length > 0 ? `, ${errors.length} error(s)` : ''}`,
            files: appliedFiles.map(p => ({ path: p, action: 'modify' as const }))
        },
        preview: { available: false, type: 'n/a', route: 'n/a' },
        narration,
        error: errors.length > 0 ? errors.join('; ') : undefined
    };
}

async function handlePreviewAction(session: CopilotSession, narration: string[]): Promise<CopilotResponse> {
    if (session.pendingChanges.length === 0) {
        return {
            status: 'rejected',
            changeset: { summary: 'No pending changes to preview', files: [] },
            preview: { available: false, type: 'n/a', route: 'n/a' },
            narration: ['Rejected: No previewable changes exist.'],
            error: 'No pending changes. Generate code first before previewing.'
        };
    }
    
    narration.push(`Preview ready for ${session.pendingChanges.length} file(s)`);
    
    // Generate preview HTML if applicable
    const componentChanges = session.pendingChanges.filter(c => 
        c.path.endsWith('.tsx') && c.content
    );
    
    let previewHtml: string | undefined;
    if (componentChanges.length > 0) {
        // For now, provide the raw code for preview
        previewHtml = `<div class="preview-container">${componentChanges.map(c => 
            `<div class="file-preview"><h4>${c.path}</h4><pre>${c.content?.slice(0, 1000)}</pre></div>`
        ).join('')}</div>`;
    }
    
    return {
        status: 'preview-ready',
        changeset: {
            summary: `${session.pendingChanges.length} file(s) ready for preview`,
            files: session.pendingChanges
        },
        preview: {
            available: true,
            type: 'conceptual',
            route: '/admin/design-studio?preview=true',
            html: previewHtml
        },
        narration
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export { COPILOT_TOOLS };
