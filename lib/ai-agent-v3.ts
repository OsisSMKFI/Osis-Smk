import { getConfig } from '@/lib/adminConfig';

// ═══════════════════════════════════════════════════════════════════════════════
// 🤖 AI AGENT v3.0 - ULTRA SMART MODE (100% Like GitHub Copilot)
// ═══════════════════════════════════════════════════════════════════════════════
// 
// PHILOSOPHY: ACT FIRST, NEVER ASK PERMISSION
// 
// When user says "fix the notification button":
// 1. SEARCH for notification-related files
// 2. READ the found files
// 3. ANALYZE the code
// 4. PROVIDE solution with exact code changes
// 5. OPTIONALLY apply changes automatically
//
// MULTI-TURN REASONING:
// - First tool results inform second tool calls
// - Keep searching until we have enough context
// - Maximum 3 rounds of tool execution
//
// ═══════════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════════
// 🧠 SMART KEYWORD EXTRACTION - Extract everything useful from message
// ═══════════════════════════════════════════════════════════════════════════════
function extractKeywords(message: string): {
    actions: string[];
    targets: string[];
    components: string[];
    files: string[];
    allKeywords: string[];
} {
    const msg = message.toLowerCase();
    
    // Action words
    const actionPatterns = [
        'fix', 'perbaiki', 'benerin', 'repair',
        'add', 'tambah', 'buat', 'create', 
        'hapus', 'delete', 'remove', 'hilangkan',
        'ubah', 'edit', 'change', 'modify', 'update',
        'cari', 'find', 'search', 'where', 'dimana', 'letak',
        'lihat', 'show', 'tampilkan', 'baca', 'read',
        'install', 'run', 'execute'
    ];
    const actions = actionPatterns.filter(a => msg.includes(a));
    
    // UI Component keywords (Indonesian + English)
    const componentPatterns = [
        'button', 'tombol', 'btn',
        'notification', 'notif', 'toast', 'alert', 'bilah',
        'modal', 'dialog', 'popup',
        'form', 'input', 'field', 'textbox',
        'card', 'kartu',
        'list', 'daftar', 'table', 'tabel',
        'header', 'footer', 'sidebar', 'navbar', 'nav', 'menu',
        'icon', 'ikon', 'image', 'gambar',
        'loading', 'spinner',
        'error', 'success', 'warning',
        'page', 'halaman',
        'tab', 'panel', 'section',
        'dropdown', 'select', 'checkbox', 'radio',
        'link', 'anchor'
    ];
    const components = componentPatterns.filter(c => msg.includes(c));
    
    // Target/subject extraction
    const targets: string[] = [];
    
    // "X gak ada Y" pattern → Y is the target
    const gakAdaMatch = message.match(/(?:gak ada|tidak ada|hilang|missing)\s+(?:tombol\s+)?(\w+)/i);
    if (gakAdaMatch) targets.push(gakAdaMatch[1]);
    
    // "tambah X" pattern → X is the target
    const tambahMatch = message.match(/(?:tambah|add|buat|create)\s+(\w+)/i);
    if (tambahMatch) targets.push(tambahMatch[1]);
    
    // "fix X" pattern → X is the target
    const fixMatch = message.match(/(?:fix|perbaiki|benerin)\s+(\w+)/i);
    if (fixMatch) targets.push(fixMatch[1]);
    
    // File mentions
    const files: string[] = [];
    const filePatterns = [
        /`([^`]+\.(tsx?|jsx?|css|json))`/gi,
        /(components\/[\w\/]+\.tsx)/gi,
        /(app\/[\w\/]+\.tsx)/gi,
        /(lib\/[\w\/]+\.ts)/gi,
        /(\w+\.tsx?)/gi
    ];
    for (const pattern of filePatterns) {
        const matches = message.matchAll(pattern);
        for (const m of matches) {
            if (m[1] && !files.includes(m[1])) files.push(m[1]);
        }
    }
    
    // All unique keywords for search
    const allKeywords = [...new Set([...actions, ...components, ...targets])];
    
    return { actions, targets, components, files, allKeywords };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 SMART TOOL PLANNING - Plan tools based on extracted keywords
// ═══════════════════════════════════════════════════════════════════════════════
function planTools(
    keywords: ReturnType<typeof extractKeywords>,
    openFile?: { path: string; content?: string }
): { tool: string; params: Record<string, any>; priority: number }[] {
    const tools: { tool: string; params: Record<string, any>; priority: number }[] = [];
    
    const { actions, targets, components, files, allKeywords } = keywords;
    
    // Priority 1: If specific files mentioned, read them
    for (const file of files.slice(0, 2)) {
        tools.push({
            tool: 'read_file',
            params: { filePath: file, startLine: 1, endLine: 300 },
            priority: 1
        });
    }
    
    // Priority 2: Search for components mentioned
    if (components.length > 0) {
        // Build smart search query
        const searchQuery = components.slice(0, 3).join('|');
        tools.push({
            tool: 'grep_search',
            params: { query: searchQuery, includePattern: '**/*.tsx' },
            priority: 2
        });
        
        // Also search for file names
        for (const comp of components.slice(0, 2)) {
            const capitalComp = comp.charAt(0).toUpperCase() + comp.slice(1);
            tools.push({
                tool: 'file_search',
                params: { pattern: `**/*${capitalComp}*.tsx` },
                priority: 2
            });
        }
    }
    
    // Priority 3: Search for targets
    if (targets.length > 0) {
        const targetQuery = targets.join('|');
        tools.push({
            tool: 'grep_search',
            params: { query: targetQuery, includePattern: '**/*.tsx' },
            priority: 3
        });
    }
    
    // Priority 4: If action is delete/hapus, search for related handlers
    if (actions.some(a => ['hapus', 'delete', 'remove', 'hilangkan'].includes(a))) {
        tools.push({
            tool: 'grep_search',
            params: { query: 'onDelete|handleDelete|remove|dismiss|onClose', includePattern: '**/*.tsx' },
            priority: 4
        });
    }
    
    // Priority 5: If we have an open file and nothing else, read it
    if (tools.length === 0 && openFile?.path) {
        tools.push({
            tool: 'read_file',
            params: { filePath: openFile.path, startLine: 1, endLine: 300 },
            priority: 5
        });
    }
    
    // Priority 6: If still nothing, search for any keyword
    if (tools.length === 0 && allKeywords.length > 0) {
        tools.push({
            tool: 'grep_search',
            params: { query: allKeywords[0], includePattern: '**/*.tsx' },
            priority: 6
        });
    }
    
    // Priority 7: Fallback - list main directories
    if (tools.length === 0) {
        tools.push({ tool: 'list_dir', params: { path: 'components' }, priority: 7 });
        tools.push({ tool: 'list_dir', params: { path: 'app' }, priority: 7 });
    }
    
    // Sort by priority and limit
    return tools.sort((a, b) => a.priority - b.priority).slice(0, 5);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔄 SECOND ROUND PLANNING - Plan more tools based on first results
// ═══════════════════════════════════════════════════════════════════════════════
function planSecondRound(
    firstResults: { tool: string; result: any }[],
    keywords: ReturnType<typeof extractKeywords>
): { tool: string; params: Record<string, any> }[] {
    const tools: { tool: string; params: Record<string, any> }[] = [];
    
    for (const res of firstResults) {
        // If grep_search found files, read the top matches
        if (res.tool === 'grep_search' && Array.isArray(res.result)) {
            const matches = res.result as { file: string; line: number }[];
            const uniqueFiles = [...new Set(matches.slice(0, 3).map(m => m.file))];
            
            for (const file of uniqueFiles) {
                tools.push({
                    tool: 'read_file',
                    params: { filePath: file, startLine: 1, endLine: 300 }
                });
            }
        }
        
        // If file_search found files, read them
        if (res.tool === 'file_search' && Array.isArray(res.result)) {
            const files = res.result as string[];
            for (const file of files.slice(0, 2)) {
                tools.push({
                    tool: 'read_file',
                    params: { filePath: file, startLine: 1, endLine: 300 }
                });
            }
        }
    }
    
    return tools.slice(0, 3); // Limit second round
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📝 FORMAT TOOL RESULTS - Build context string from tool results
// ═══════════════════════════════════════════════════════════════════════════════
function formatToolResults(results: { tool: string; result: any }[]): string {
    let context = '';
    
    for (const res of results) {
        context += `\n### 📌 ${res.tool} Result:\n`;
        
        if (res.tool === 'read_file' && res.result?.content) {
            const content = res.result.content as string;
            const path = res.result.path || 'file';
            context += `**File: ${path}** (${res.result.totalLines || '?'} lines)\n`;
            context += `\`\`\`tsx\n${content.slice(0, 4000)}\n\`\`\`\n`;
        } else if (res.tool === 'grep_search' && Array.isArray(res.result)) {
            const matches = res.result as { file: string; line: number; preview: string }[];
            context += `Found ${matches.length} matches:\n`;
            matches.slice(0, 15).forEach(m => {
                context += `- **${m.file}:${m.line}** → \`${m.preview?.slice(0, 80)}...\`\n`;
            });
        } else if (res.tool === 'file_search' && Array.isArray(res.result)) {
            context += `Found files:\n`;
            (res.result as string[]).slice(0, 10).forEach(f => {
                context += `- 📄 ${f}\n`;
            });
        } else if (res.tool === 'list_dir' && Array.isArray(res.result)) {
            (res.result as { name: string; type: string }[]).forEach(e => {
                context += `- ${e.type === 'directory' ? '📁' : '📄'} ${e.name}\n`;
            });
        } else {
            context += JSON.stringify(res.result).slice(0, 500) + '\n';
        }
    }
    
    return context;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 BUILD SYSTEM PROMPT - Super smart prompt like GitHub Copilot
// ═══════════════════════════════════════════════════════════════════════════════
function buildSystemPrompt(toolContext: string, openFile?: { path: string }): string {
    return `# 🤖 Kamu adalah AI Coding Assistant Level Expert

Kamu adalah AI Assistant yang SANGAT MIRIP dengan GitHub Copilot di VS Code. Kamu sudah menjalankan tools dan mendapat hasil berikut:

${toolContext}

## 🎯 ATURAN PENTING:

### 1. LANGSUNG BERIKAN SOLUSI
- JANGAN pernah bertanya balik ke user
- JANGAN bilang "saya butuh informasi lebih lanjut"
- Gunakan konteks yang sudah ada untuk memberikan solusi terbaik

### 2. FORMAT KODE
Selalu gunakan format code block dengan path file:
\`\`\`tsx:path/to/file.tsx
// kode di sini
\`\`\`

### 3. UNTUK PERUBAHAN FILE, GUNAKAN FORMAT DIFF:
\`\`\`diff:path/to/file.tsx
<<<FIND>>>
// kode yang perlu diganti (copy EXACT dari hasil read_file)
<<<REPLACE>>>
// kode pengganti
\`\`\`

### 4. JELASKAN DENGAN SINGKAT
- Jelaskan masalah yang ditemukan
- Jelaskan solusinya
- Berikan kode yang bisa langsung di-copy

### 5. BAHASA
Gunakan Bahasa Indonesia yang natural dan friendly.

${openFile ? `### 📂 File yang Sedang Dibuka User: ${openFile.path}` : ''}

## ⚡ INGAT:
- Kamu SUDAH PUNYA konteks dari tool results
- LANGSUNG berikan solusi, jangan tanya
- Berikan kode yang LENGKAP dan BENAR
- Jika ada error di kode, perbaiki langsung`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 EXECUTE TOOL - Call the tools API
// ═══════════════════════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 MAIN AGENT FUNCTION - Multi-turn reasoning with streaming
// ═══════════════════════════════════════════════════════════════════════════════
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
    const allToolResults: { tool: string; result: any }[] = [];
    
    const emit = (step: AgentStep) => {
        if (onStep) onStep(step);
    };
    
    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 1: Analyze & Extract Keywords
    // ═══════════════════════════════════════════════════════════════════════════
    emit({ type: 'thinking', content: '🧠 Menganalisis permintaan...' });
    
    const keywords = extractKeywords(message);
    
    emit({ 
        type: 'thinking', 
        content: `📋 Terdeteksi: ${keywords.components.join(', ') || keywords.targets.join(', ') || 'general query'}` 
    });
    
    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 2: Execute First Round of Tools
    // ═══════════════════════════════════════════════════════════════════════════
    const firstRoundTools = planTools(keywords, context.openFile);
    
    emit({ type: 'thinking', content: `🔧 Merencanakan ${firstRoundTools.length} langkah...` });
    
    for (const toolPlan of firstRoundTools) {
        const toolLabels: Record<string, string> = {
            'file_search': '🔍 Mencari file...',
            'read_file': `📖 Membaca ${toolPlan.params.filePath || 'file'}...`,
            'grep_search': `🔎 Mencari "${String(toolPlan.params.query).slice(0, 30)}"...`,
            'list_dir': `📁 Melihat ${toolPlan.params.path}...`,
            'write_file': `✍️ Menulis file...`,
            'replace_in_file': `✏️ Mengedit file...`,
            'run_terminal': `💻 Terminal...`,
            'get_database': '🗄️ Query database...'
        };
        
        emit({ type: 'tool-call', content: toolLabels[toolPlan.tool] || `🔧 ${toolPlan.tool}...` });
        
        const result = await executeTool(toolPlan.tool, toolPlan.params, context.baseUrl);
        toolsUsed.push(result);
        
        if (result.success) {
            allToolResults.push({ tool: toolPlan.tool, result: result.result });
            emit({ type: 'tool-result', content: `✅ ${toolPlan.tool} selesai` });
        } else {
            emit({ type: 'error', content: `⚠️ ${toolPlan.tool}: ${result.error}` });
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 3: Execute Second Round (based on first results)
    // ═══════════════════════════════════════════════════════════════════════════
    const secondRoundTools = planSecondRound(allToolResults, keywords);
    
    if (secondRoundTools.length > 0) {
        emit({ type: 'thinking', content: `🔄 Mendalami ${secondRoundTools.length} file...` });
        
        for (const toolPlan of secondRoundTools) {
            // Skip if we already read this file
            const alreadyRead = allToolResults.some(
                r => r.tool === 'read_file' && r.result?.path === toolPlan.params.filePath
            );
            if (alreadyRead) continue;
            
            emit({ type: 'tool-call', content: `📖 Membaca ${toolPlan.params.filePath}...` });
            
            const result = await executeTool(toolPlan.tool, toolPlan.params, context.baseUrl);
            toolsUsed.push(result);
            
            if (result.success) {
                allToolResults.push({ tool: toolPlan.tool, result: result.result });
                emit({ type: 'tool-result', content: `✅ File dibaca` });
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 4: Build Context & Call AI
    // ═══════════════════════════════════════════════════════════════════════════
    emit({ type: 'thinking', content: '💭 Menyusun solusi...' });
    
    const toolContext = formatToolResults(allToolResults);
    const systemPrompt = buildSystemPrompt(toolContext, context.openFile);
    
    const userPrompt = `User request: "${message}"

Berdasarkan hasil pencarian dan pembacaan file di atas, berikan solusi yang LENGKAP.
Jika ada masalah, tunjukkan kode perbaikannya dengan format diff.`;
    
    // Get AI API key
    const geminiKey = await getConfig('GEMINI_API_KEY');
    const openaiKey = await getConfig('OPENAI_API_KEY');
    
    if (!geminiKey && !openaiKey) {
        return {
            response: '❌ Tidak ada API key AI yang dikonfigurasi. Silakan tambahkan GEMINI_API_KEY atau OPENAI_API_KEY di Admin Settings.',
            toolsUsed,
            filesModified
        };
    }
    
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
                            { role: 'user', parts: [{ text: `[SYSTEM]\n${systemPrompt}` }] },
                            ...(context.conversationHistory || []).slice(-4).map(m => ({
                                role: m.role === 'assistant' ? 'model' : 'user',
                                parts: [{ text: m.content }]
                            })),
                            { role: 'user', parts: [{ text: userPrompt }] }
                        ],
                        generationConfig: { 
                            temperature: 0.1, // Lower = more focused
                            maxOutputTokens: 8192,
                            topP: 0.8
                        }
                    })
                }
            );
            const data = await geminiResponse.json();
            aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            
            if (!aiResponse && data.error) {
                aiResponse = `❌ Gemini Error: ${data.error.message}`;
            }
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
                    temperature: 0.1,
                    max_tokens: 4096
                })
            });
            const data = await openaiResponse.json();
            aiResponse = data.choices?.[0]?.message?.content || '';
        }
    } catch (err) {
        aiResponse = `❌ Error calling AI: ${err instanceof Error ? err.message : 'Unknown'}`;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 5: Auto-apply DIFF changes if present
    // ═══════════════════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════════════════════
// 📤 EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

export function detectUserIntent(message: string) {
    const keywords = extractKeywords(message);
    return {
        wantsFileSearch: keywords.actions.some(a => ['cari', 'find', 'search', 'where', 'dimana'].includes(a)),
        wantsFileRead: keywords.actions.some(a => ['baca', 'read', 'lihat', 'show'].includes(a)),
        wantsFileEdit: keywords.actions.some(a => ['edit', 'ubah', 'ganti', 'fix', 'perbaiki', 'tambah', 'add', 'hapus', 'delete'].includes(a)),
        wantsTerminal: keywords.actions.some(a => ['install', 'run', 'execute'].includes(a)),
        wantsDatabase: keywords.targets.some(t => ['data', 'database', 'posts', 'events', 'members'].includes(t)),
        targetFile: keywords.files[0],
        keywords
    };
}

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
