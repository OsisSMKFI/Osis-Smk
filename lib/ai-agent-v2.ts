import { supabaseAdmin } from '@/lib/supabase/server';
import { getConfig } from '@/lib/adminConfig';

// ═══════════════════════════════════════════════════════════════════════════════
// 🤖 AI AGENT v2.0 - FULL ACTION MODE (Like VS Code Copilot)
// ═══════════════════════════════════════════════════════════════════════════════
// CRITICAL: This agent ACTS first, explains later. No asking permission.
// - User says "fix X" → Agent reads files, finds the issue, fixes it
// - User says "add Y" → Agent creates/modifies files directly
// - User asks "where is Z" → Agent searches and shows results
// ═══════════════════════════════════════════════════════════════════════════════

// Tool definitions
const AVAILABLE_TOOLS = [
    'file_search',    // Find files by pattern
    'read_file',      // Read file contents
    'grep_search',    // Search text in files
    'list_dir',       // List directory
    'write_file',     // Create/update files
    'replace_in_file', // DIFF-like editing
    'run_terminal',   // Execute commands
    'get_database'    // Query data
];

interface ToolResult {
    tool: string;
    success: boolean;
    result: any;
    error?: string;
}

interface AgentStep {
    type: 'thinking' | 'tool-call' | 'tool-result' | 'file-edit' | 'terminal' | 'message' | 'done' | 'error';
    content: string;
    data?: Record<string, any>;
}

// Execute tool via API
async function executeTool(
    tool: string, 
    params: Record<string, any>, 
    baseUrl: string
): Promise<ToolResult> {
    try {
        const response = await fetch(`${baseUrl}/api/ai/tools`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tool, params })
        });
        const data = await response.json();
        return { tool, success: data.success, result: data.result, error: data.error };
    } catch (err) {
        return { tool, success: false, result: null, error: String(err) };
    }
}

// Analyze user intent and decide tools to use
function analyzeIntent(message: string, openFile?: { path: string; content?: string }): {
    intent: string;
    tools: { tool: string; params: Record<string, any> }[];
    targetFile?: string;
} {
    const msg = message.toLowerCase();
    const tools: { tool: string; params: Record<string, any> }[] = [];
    let intent = 'general';
    let targetFile: string | undefined;
    
    // Extract file mentions - more aggressive pattern matching
    const fileMatch = message.match(/(?:file|komponen|component|di\s+file)\s+([^\s,\.]+)/i) ||
                     message.match(/`([^`]+\.(tsx?|jsx?|css|json))`/i) ||
                     message.match(/(components\/[^\s]+\.tsx)/i) ||
                     message.match(/(app\/[^\s]+\.tsx)/i) ||
                     message.match(/(\w+\.tsx)/i);
    if (fileMatch) {
        targetFile = fileMatch[1];
    }
    
    // If user currently has a file open, use that as context
    if (openFile?.path && !targetFile) {
        targetFile = openFile.path;
    }

    // Extract ALL keywords for smarter searching
    const keywordMatches = message.match(/\b(tombol|button|hapus|delete|remove|tambah|add|edit|ubah|fix|icon|ikon|bilah|bar|menu|modal|dialog|popup|notif|toast|alert|warning|error|success|loading|spinner|form|input|card|list|table|header|footer|sidebar|navbar|nav|page|halaman)\b/gi);
    const keywords = keywordMatches ? [...new Set(keywordMatches.map(k => k.toLowerCase()))] : [];
    
    // Build search query from keywords
    const searchQuery = keywords.length > 0 ? keywords.join('|') : null;
    
    // NOTIFICATION related - specific case from user
    if (msg.includes('notif') || msg.includes('notification') || msg.includes('toast') || msg.includes('alert bilah')) {
        intent = 'fix-notification';
        // Search for notification components
        tools.push({ tool: 'grep_search', params: { query: 'Notification|notification|Toast|toast|notify', includePattern: '**/*.tsx' } });
        tools.push({ tool: 'file_search', params: { pattern: '**/Notification*.tsx' } });
        tools.push({ tool: 'file_search', params: { pattern: '**/Toast*.tsx' } });
        // Also search for delete/hapus button
        if (msg.includes('hapus') || msg.includes('delete')) {
            tools.push({ tool: 'grep_search', params: { query: 'onDelete|onClose|handleDelete|dismiss', includePattern: '**/*.tsx' } });
        }
    }
    
    // Button related  
    else if (msg.includes('tombol') || msg.includes('button')) {
        intent = 'fix-button';
        if (searchQuery) {
            tools.push({ tool: 'grep_search', params: { query: searchQuery, includePattern: '**/*.tsx' } });
        }
        // Also search for button-related code
        tools.push({ tool: 'grep_search', params: { query: 'onClick|Button|<button', includePattern: '**/*.tsx' } });
    }
    
    // FIX/REPAIR something
    else if (msg.includes('fix') || msg.includes('perbaiki') || msg.includes('repair') || msg.includes('benerin') || msg.includes('tidak ada') || msg.includes('gak ada') || msg.includes('hilang') || msg.includes('missing')) {
        intent = 'fix';
        if (targetFile) {
            tools.push({ tool: 'read_file', params: { filePath: targetFile, startLine: 1, endLine: 300 } });
        }
        // Search for related code using extracted keywords
        if (searchQuery) {
            tools.push({ tool: 'grep_search', params: { query: searchQuery, includePattern: '**/*.tsx' } });
        }
    }
    
    // ADD/CREATE something
    else if (msg.includes('add') || msg.includes('tambah') || msg.includes('create') || msg.includes('buat')) {
        intent = 'add';
        if (targetFile) {
            tools.push({ tool: 'read_file', params: { filePath: targetFile, startLine: 1, endLine: 300 } });
        }
    }
    
    // DELETE/REMOVE something
    else if (msg.includes('hapus') || msg.includes('delete') || msg.includes('remove') || msg.includes('hilangkan')) {
        intent = 'delete';
        if (targetFile) {
            tools.push({ tool: 'read_file', params: { filePath: targetFile, startLine: 1, endLine: 300 } });
        }
        // Search for related code  
        if (searchQuery) {
            tools.push({ tool: 'grep_search', params: { query: searchQuery, includePattern: '**/*.tsx' } });
        }
    }
    
    // WHERE/FIND something
    else if (msg.includes('where') || msg.includes('dimana') || msg.includes('cari') || msg.includes('find') || msg.includes('letak')) {
        intent = 'search';
        const searchTerm = message.match(/(?:where|dimana|cari|find|letak)\s+(.+)/i);
        if (searchTerm) {
            tools.push({ tool: 'grep_search', params: { query: searchTerm[1].trim(), includePattern: '**/*.{tsx,ts,css}' } });
            tools.push({ tool: 'file_search', params: { pattern: `**/*${searchTerm[1].trim().replace(/\s+/g, '*')}*` } });
        } else if (searchQuery) {
            tools.push({ tool: 'grep_search', params: { query: searchQuery, includePattern: '**/*.tsx' } });
        }
    }
    
    // READ/SHOW file
    else if (msg.includes('baca') || msg.includes('read') || msg.includes('lihat') || msg.includes('show') || msg.includes('tampilkan')) {
        intent = 'read';
        if (targetFile) {
            tools.push({ tool: 'read_file', params: { filePath: targetFile, startLine: 1, endLine: 300 } });
        }
    }
    
    // LIST directory
    else if (msg.includes('list') || msg.includes('struktur') || msg.includes('folder')) {
        intent = 'list';
        tools.push({ tool: 'list_dir', params: { path: 'components' } });
        tools.push({ tool: 'list_dir', params: { path: 'app' } });
    }
    
    // INSTALL packages
    else if (msg.includes('install') || msg.includes('npm') || msg.includes('package')) {
        intent = 'terminal';
        const packageMatch = message.match(/install\s+(.+)/i);
        if (packageMatch) {
            tools.push({ tool: 'run_terminal', params: { command: `npm install ${packageMatch[1].trim()}` } });
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // 🔥 FALLBACK: If no specific intent, ALWAYS search first!
    // This is what makes the AI "like GitHub Copilot" - it explores before asking
    // ═══════════════════════════════════════════════════════════════════════════
    if (tools.length === 0) {
        // If we have keywords from the message, search for them
        if (searchQuery) {
            tools.push({ tool: 'grep_search', params: { query: searchQuery, includePattern: '**/*.tsx' } });
        }
        // If there's any Indonesian/English word that could be a component/feature
        const possibleTerms = message.match(/\b[a-zA-Z]{3,}\b/g);
        if (possibleTerms && possibleTerms.length > 0) {
            const term = possibleTerms[0];
            tools.push({ tool: 'grep_search', params: { query: term, includePattern: '**/*.{tsx,ts}' } });
        }
        // If a file is open, read it for context
        if (openFile?.path) {
            tools.push({ tool: 'read_file', params: { filePath: openFile.path, startLine: 1, endLine: 300 } });
        }
        // If still nothing, list the main directories
        if (tools.length === 0) {
            tools.push({ tool: 'list_dir', params: { path: 'components' } });
            tools.push({ tool: 'list_dir', params: { path: 'app' } });
        }
    }
    
    return { intent, tools, targetFile };
}

// Main agent function with streaming callback
export async function runAgentWithStreaming(
    message: string,
    context: {
        baseUrl: string;
        conversationHistory?: { role: string; content: string }[];
        openFile?: { path: string; content?: string };
        mode?: 'design-studio' | 'live-chat';
    },
    onStep?: (step: AgentStep) => void
): Promise<{
    response: string;
    toolsUsed: ToolResult[];
    filesModified: string[];
}> {
    const toolsUsed: ToolResult[] = [];
    const filesModified: string[] = [];
    
    const emit = (step: AgentStep) => {
        if (onStep) onStep(step);
    };
    
    emit({ type: 'thinking', content: '🧠 Menganalisis permintaan...' });
    
    // Step 1: Analyze intent and plan tools
    const { intent, tools, targetFile } = analyzeIntent(message, context.openFile);
    
    emit({ type: 'thinking', content: `📋 Terdeteksi: ${intent}${targetFile ? ` → ${targetFile}` : ''}` });
    
    // Step 2: Execute planned tools
    const toolResults: { tool: string; result: any }[] = [];
    
    for (const toolPlan of tools) {
        const toolLabels: Record<string, string> = {
            'file_search': '🔍 Mencari file...',
            'read_file': `📖 Membaca ${toolPlan.params.filePath || 'file'}...`,
            'grep_search': `🔎 Mencari "${toolPlan.params.query}"...`,
            'list_dir': `📁 Melihat ${toolPlan.params.path}...`,
            'write_file': `✍️ Menulis ${toolPlan.params.filePath}...`,
            'replace_in_file': `✏️ Mengedit ${toolPlan.params.filePath}...`,
            'run_terminal': `💻 ${toolPlan.params.command}...`,
            'get_database': '🗄️ Mengquery database...'
        };
        
        emit({ type: 'tool-call', content: toolLabels[toolPlan.tool] || `🔧 ${toolPlan.tool}...`, data: toolPlan });
        
        const result = await executeTool(toolPlan.tool, toolPlan.params, context.baseUrl);
        toolsUsed.push(result);
        
        if (result.success) {
            toolResults.push({ tool: toolPlan.tool, result: result.result });
            emit({ type: 'tool-result', content: `✅ ${toolPlan.tool} selesai`, data: { preview: JSON.stringify(result.result).slice(0, 150) } });
            
            if (toolPlan.tool === 'write_file' || toolPlan.tool === 'replace_in_file') {
                filesModified.push(toolPlan.params.filePath);
                emit({ type: 'file-edit', content: `📝 File diubah: ${toolPlan.params.filePath}` });
            }
        } else {
            emit({ type: 'error', content: `❌ ${toolPlan.tool}: ${result.error}` });
        }
    }
    
    // Step 3: Build context from tool results
    let toolContext = '';
    for (const tr of toolResults) {
        toolContext += `\n### ${tr.tool} Result:\n`;
        if (tr.tool === 'read_file') {
            toolContext += `\`\`\`\n${typeof tr.result?.content === 'string' ? tr.result.content.slice(0, 3000) : JSON.stringify(tr.result).slice(0, 1000)}\n\`\`\`\n`;
        } else if (tr.tool === 'grep_search') {
            const matches = tr.result as any[];
            if (Array.isArray(matches)) {
                matches.slice(0, 10).forEach((m: any) => {
                    toolContext += `- [${m.file}:${m.line}] ${m.preview?.slice(0, 80)}\n`;
                });
            }
        } else if (tr.tool === 'file_search') {
            const files = tr.result as string[];
            if (Array.isArray(files)) {
                files.slice(0, 10).forEach(f => toolContext += `- ${f}\n`);
            }
        } else if (tr.tool === 'list_dir') {
            const entries = tr.result as any[];
            if (Array.isArray(entries)) {
                entries.forEach((e: any) => toolContext += `- ${e.type === 'directory' ? '📁' : '📄'} ${e.name}\n`);
            }
        } else {
            toolContext += JSON.stringify(tr.result).slice(0, 500) + '\n';
        }
    }
    
    emit({ type: 'thinking', content: '💭 Menyusun solusi...' });
    
    // Step 4: Get AI API key and generate response
    const geminiKey = await getConfig('GEMINI_API_KEY');
    const openaiKey = await getConfig('OPENAI_API_KEY');
    
    if (!geminiKey && !openaiKey) {
        return {
            response: '❌ Tidak ada API key AI yang dikonfigurasi.',
            toolsUsed,
            filesModified
        };
    }
    
    // Build the prompt with tool results
    const systemPrompt = `Kamu adalah AI Assistant seperti GitHub Copilot. Kamu SUDAH menjalankan tools dan mendapat hasil berikut:

${toolContext}

BERDASARKAN HASIL DI ATAS, berikan respons yang:
1. Langsung ke solusi - JANGAN bertanya balik
2. Jika ada masalah, jelaskan dan berikan kode perbaikan
3. Gunakan format code block dengan path file: \`\`\`tsx:path/file.tsx
4. Jika perlu edit file, tunjukkan perubahan dengan format DIFF:
   \`\`\`diff:path/file.tsx
   <<<FIND>>>
   kode lama
   <<<REPLACE>>>
   kode baru
   \`\`\`
5. Respons dalam Bahasa Indonesia

INGAT: Kamu SUDAH punya data. LANGSUNG berikan solusi!`;

    const userPrompt = `User request: "${message}"

${context.openFile ? `File yang dibuka: ${context.openFile.path}` : ''}

Berdasarkan tool results di atas, berikan solusi lengkap.`;
    
    // Call AI
    let aiResponse = '';
    
    try {
        if (geminiKey) {
            const geminiResponse = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [
                            { role: 'user', parts: [{ text: `[SYSTEM] ${systemPrompt}` }] },
                            ...(context.conversationHistory || []).slice(-4).map(m => ({
                                role: m.role === 'assistant' ? 'model' : 'user',
                                parts: [{ text: m.content }]
                            })),
                            { role: 'user', parts: [{ text: userPrompt }] }
                        ],
                        generationConfig: { temperature: 0.2, maxOutputTokens: 4096, thinkingConfig: { thinkingBudget: 0 } }
                    })
                }
            );
            const data = await geminiResponse.json();
            const parts = data.candidates?.[0]?.content?.parts || [];
            const answerParts = parts.filter((p: any) => !p.thought);
            aiResponse = answerParts.map((p: any) => p.text || '').join('\n').trim() || '';
        } else if (openaiKey) {
            const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openaiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...(context.conversationHistory || []).slice(-4),
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.2,
                    max_tokens: 4096
                })
            });
            const data = await openaiResponse.json();
            aiResponse = data.choices?.[0]?.message?.content || '';
        }
    } catch (err) {
        aiResponse = `❌ Error calling AI: ${err instanceof Error ? err.message : 'Unknown'}`;
    }
    
    // Step 5: Check if AI wants to make edits and execute them
    const diffRegex = /```diff:([^\n]+)\n<<<FIND>>>\n([\s\S]*?)\n<<<REPLACE>>>\n([\s\S]*?)```/gi;
    let diffMatch;
    
    while ((diffMatch = diffRegex.exec(aiResponse)) !== null) {
        const filePath = diffMatch[1].trim();
        const findText = diffMatch[2].trim();
        const replaceText = diffMatch[3].trim();
        
        emit({ type: 'tool-call', content: `✏️ Menerapkan perubahan ke ${filePath}...` });
        
        const editResult = await executeTool('replace_in_file', {
            filePath,
            find: findText,
            replace: replaceText
        }, context.baseUrl);
        
        toolsUsed.push(editResult);
        
        if (editResult.success) {
            filesModified.push(filePath);
            emit({ type: 'file-edit', content: `✅ File diubah: ${filePath}` });
        } else {
            emit({ type: 'error', content: `❌ Gagal edit ${filePath}: ${editResult.error}` });
        }
    }
    
    emit({ type: 'done', content: 'Selesai', data: { toolsUsed: toolsUsed.map(t => t.tool), filesModified } });
    
    return {
        response: aiResponse,
        toolsUsed,
        filesModified
    };
}

// Export helper for detecting user intent (for backward compatibility)
export function detectUserIntent(message: string): {
    wantsFileSearch: boolean;
    wantsFileRead: boolean;
    wantsFileEdit: boolean;
    wantsTerminal: boolean;
    wantsDatabase: boolean;
    targetFile?: string;
} {
    const lower = message.toLowerCase();
    
    return {
        wantsFileSearch: /dimana|where|cari file|find file|locate|letak/i.test(message),
        wantsFileRead: /baca|read|lihat isi|show content|tampilkan/i.test(message),
        wantsFileEdit: /edit|ubah|ganti|change|modify|update|tambah|add|hapus|remove|delete/i.test(message),
        wantsTerminal: /install|npm|yarn|pnpm|git|terminal|command|run/i.test(message),
        wantsDatabase: /data|database|posts|events|members|sekbid|query/i.test(message),
        targetFile: message.match(/(?:file|komponen|component)\s+([^\s,\.]+)/i)?.[1]
    };
}

// Backward compatible function
export async function runAIAgent(
    userMessage: string,
    context: {
        baseUrl: string;
        conversationHistory?: { role: string; content: string }[];
        openFile?: { path: string; content?: string };
        mode?: 'design-studio' | 'live-chat';
    }
): Promise<{
    response: string;
    toolsUsed: ToolResult[];
    filesModified: string[];
}> {
    return runAgentWithStreaming(userMessage, context);
}
