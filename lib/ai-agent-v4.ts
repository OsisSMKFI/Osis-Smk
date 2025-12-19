import { getConfig } from '@/lib/adminConfig';

// ═══════════════════════════════════════════════════════════════════════════════
// 🤖 AI AGENT v4.0 - COPILOT-CLASS AUTONOMOUS CODING AGENT
// ═══════════════════════════════════════════════════════════════════════════════
//
// ARCHITECTURE: CONTROLLER-FORCED EXECUTION
//
// User Input → Controller (Forces) → AI Agent → Tools → Controller (Verifies) → Output
//
// HARD RULES:
// - No response without tool execution
// - No idle state
// - No "no changes" without search
// - If intent unclear → SEARCH ANYWAY
// - AI does NOT control itself
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

interface ExecutionLog {
    search: boolean;
    read: boolean;
    edit: boolean;
    verify: boolean;
    filesFound: string[];
    filesRead: string[];
    filesEdited: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 INTENT ENGINE - Aggressive, not NLP-soft
// ═══════════════════════════════════════════════════════════════════════════════
type Intent = 'FIX' | 'EDIT' | 'METADATA' | 'UI' | 'SEARCH' | 'TERMINAL' | 'UNKNOWN';

function detectIntent(input: string): Intent {
    const lower = input.toLowerCase();
    
    // FIX intent
    if (/bug|error|gak|tidak|hilang|rusak|salah|broken|fail|issue|problem|masalah/.test(lower)) {
        return 'FIX';
    }
    
    // EDIT intent
    if (/ubah|edit|ganti|tambah|hapus|remove|delete|add|change|modify|update|perbaiki|fix/.test(lower)) {
        return 'EDIT';
    }
    
    // METADATA intent
    if (/thumbnail|og|meta|seo|share|opengraph|twitter|preview|image/.test(lower)) {
        return 'METADATA';
    }
    
    // UI intent
    if (/preview|tampil|design|ui|style|css|warna|color|layout|component|komponen/.test(lower)) {
        return 'UI';
    }
    
    // TERMINAL intent
    if (/install|npm|yarn|run|build|deploy|terminal|command/.test(lower)) {
        return 'TERMINAL';
    }
    
    // SEARCH intent
    if (/cari|find|search|where|dimana|letak|locate/.test(lower)) {
        return 'SEARCH';
    }
    
    // UNKNOWN = SEARCH MODE (not stop)
    return 'UNKNOWN';
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 CONTEXT COLLECTOR - Always injected, never asked
// ═══════════════════════════════════════════════════════════════════════════════
function collectContext(message: string, openFile?: { path: string; content?: string }): {
    intent: Intent;
    keywords: string[];
    targets: string[];
    searchPatterns: string[];
} {
    const intent = detectIntent(message);
    
    // Extract all potential keywords
    const words = message.toLowerCase().match(/\b[a-zA-Z]{3,}\b/g) || [];
    const keywords = [...new Set(words)];
    
    // Extract targets (nouns after action verbs)
    const targets: string[] = [];
    const targetPatterns = [
        /(?:gak ada|tidak ada|hilang|missing)\s+(?:tombol\s+)?(\w+)/gi,
        /(?:tambah|add|buat|create)\s+(\w+)/gi,
        /(?:hapus|delete|remove)\s+(\w+)/gi,
        /(?:fix|perbaiki|benerin)\s+(\w+)/gi,
        /(?:ubah|edit|ganti|change)\s+(\w+)/gi,
    ];
    
    for (const pattern of targetPatterns) {
        const matches = message.matchAll(pattern);
        for (const m of matches) {
            if (m[1]) targets.push(m[1].toLowerCase());
        }
    }
    
    // Build search patterns based on intent
    const searchPatterns: string[] = [];
    
    if (intent === 'METADATA') {
        searchPatterns.push('generateMetadata|openGraph|og:|twitter:');
        searchPatterns.push('OG_VERSION|SITE_URL|metadata');
    } else if (intent === 'UI') {
        searchPatterns.push('className|style|css|tailwind');
    } else if (intent === 'FIX' || intent === 'EDIT') {
        // Use targets as search patterns
        if (targets.length > 0) {
            searchPatterns.push(targets.join('|'));
        }
        // Add common patterns
        searchPatterns.push(keywords.slice(0, 5).join('|'));
    }
    
    // Add file path from open file
    if (openFile?.path) {
        searchPatterns.push(openFile.path.split('/').pop()?.replace('.tsx', '') || '');
    }
    
    return { intent, keywords, targets, searchPatterns: [...new Set(searchPatterns)].filter(Boolean) };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔧 TOOL EXECUTOR
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
// 🔄 ENFORCE EXECUTION - This is what makes it Copilot-like
// ═══════════════════════════════════════════════════════════════════════════════
async function enforceExecution(
    context: ReturnType<typeof collectContext>,
    openFile: { path: string; content?: string } | undefined,
    baseUrl: string,
    emit: (step: AgentStep) => void
): Promise<{
    log: ExecutionLog;
    toolResults: { tool: string; result: any; params?: any }[];
}> {
    const log: ExecutionLog = {
        search: false,
        read: false,
        edit: false,
        verify: false,
        filesFound: [],
        filesRead: [],
        filesEdited: []
    };
    
    const toolResults: { tool: string; result: any; params?: any }[] = [];
    
    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 1: SEARCH (MANDATORY)
    // ═══════════════════════════════════════════════════════════════════════════
    emit({ type: 'tool-call', content: 'Searching codebase...' });
    
    // Search with all patterns
    for (const pattern of context.searchPatterns.slice(0, 3)) {
        const searchResult = await executeTool('grep_search', {
            query: pattern,
            includePattern: '**/*.{tsx,ts,css}'
        }, baseUrl);
        
        if (searchResult.success && Array.isArray(searchResult.result)) {
            log.search = true;
            const files = searchResult.result.map((r: any) => r.file);
            log.filesFound.push(...files);
            toolResults.push({ tool: 'grep_search', result: searchResult.result, params: { query: pattern } });
            
            emit({ type: 'tool-result', content: `Found ${searchResult.result.length} matches for "${pattern}"` });
        }
    }
    
    // If no results, do broader search
    if (log.filesFound.length === 0) {
        emit({ type: 'tool-call', content: 'Broadening search...' });
        
        // Search by keywords
        if (context.keywords.length > 0) {
            const broadSearch = await executeTool('grep_search', {
                query: context.keywords.slice(0, 3).join('|'),
                includePattern: '**/*.tsx'
            }, baseUrl);
            
            if (broadSearch.success && Array.isArray(broadSearch.result)) {
                log.search = true;
                const files = broadSearch.result.map((r: any) => r.file);
                log.filesFound.push(...files);
                toolResults.push({ tool: 'grep_search', result: broadSearch.result });
            }
        }
        
        // Fallback: list directories
        if (log.filesFound.length === 0) {
            const listResult = await executeTool('list_dir', { path: 'components' }, baseUrl);
            if (listResult.success) {
                toolResults.push({ tool: 'list_dir', result: listResult.result });
            }
            
            const listApp = await executeTool('list_dir', { path: 'app' }, baseUrl);
            if (listApp.success) {
                toolResults.push({ tool: 'list_dir', result: listApp.result });
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 2: READ (from search results)
    // ═══════════════════════════════════════════════════════════════════════════
    const uniqueFiles = [...new Set(log.filesFound)].slice(0, 5);
    
    // Always read open file if exists
    if (openFile?.path && !uniqueFiles.includes(openFile.path)) {
        uniqueFiles.unshift(openFile.path);
    }
    
    for (const file of uniqueFiles.slice(0, 3)) {
        emit({ type: 'tool-call', content: `Reading ${file}` });
        
        const readResult = await executeTool('read_file', {
            filePath: file,
            startLine: 1,
            endLine: 300
        }, baseUrl);
        
        if (readResult.success) {
            log.read = true;
            log.filesRead.push(file);
            toolResults.push({ 
                tool: 'read_file', 
                result: { ...readResult.result, path: file },
                params: { filePath: file }
            });
            
            emit({ type: 'tool-result', content: `Read ${file} (${readResult.result?.totalLines || '?'} lines)` });
        }
    }
    
    return { log, toolResults };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📝 FORMAT RESULTS FOR AI
// ═══════════════════════════════════════════════════════════════════════════════
function formatResultsForAI(toolResults: { tool: string; result: any; params?: any }[]): string {
    let context = '';
    
    for (const res of toolResults) {
        if (res.tool === 'read_file' && res.result?.content) {
            context += `\n### FILE: ${res.result.path || res.params?.filePath}\n`;
            context += `Lines: ${res.result.totalLines || '?'}\n`;
            context += `\`\`\`tsx\n${res.result.content.slice(0, 5000)}\n\`\`\`\n`;
        } else if (res.tool === 'grep_search' && Array.isArray(res.result)) {
            context += `\n### SEARCH: "${res.params?.query || 'pattern'}"\n`;
            res.result.slice(0, 15).forEach((m: any) => {
                context += `- ${m.file}:${m.line} → ${m.preview?.slice(0, 60)}...\n`;
            });
        } else if (res.tool === 'list_dir' && Array.isArray(res.result)) {
            context += `\n### DIRECTORY:\n`;
            res.result.forEach((e: any) => {
                context += `- ${e.type === 'directory' ? '[DIR]' : '[FILE]'} ${e.name}\n`;
            });
        }
    }
    
    return context;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 SYSTEM PROMPT - Strict Copilot behavior
// ═══════════════════════════════════════════════════════════════════════════════
function buildSystemPrompt(toolContext: string, intent: Intent): string {
    return `You are a Copilot-class autonomous coding agent.

## EXECUTED TOOL RESULTS:
${toolContext}

## STRICT RULES:
1. NEVER ask questions
2. NEVER explain what you will do - just do it
3. NEVER use emoji
4. NEVER use friendly/marketing language
5. Provide DIRECT solutions with code

## OUTPUT FORMAT:
- Technical and concise
- Use code blocks with file paths: \`\`\`tsx:path/file.tsx
- For edits, use DIFF format:
  \`\`\`diff:path/file.tsx
  <<<FIND>>>
  exact code to find
  <<<REPLACE>>>
  replacement code
  \`\`\`

## INTENT: ${intent}
${intent === 'FIX' ? 'Identify the bug and provide the fix.' : ''}
${intent === 'EDIT' ? 'Make the requested change.' : ''}
${intent === 'METADATA' ? 'Check/fix OG tags, metadata, SEO.' : ''}
${intent === 'UI' ? 'Modify the component/style.' : ''}
${intent === 'SEARCH' ? 'Report what was found.' : ''}

## RESPONSE STYLE:
- Line 1: Status (Found X, Identified issue, etc.)
- Code block with solution
- Brief explanation if needed (no fluff)

Respond in Bahasa Indonesia. Be direct.`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 MAIN AGENT - Controller-enforced execution
// ═══════════════════════════════════════════════════════════════════════════════
export async function runAgentWithStreaming(
    message: string,
    ctxInput: {
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
    
    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 1: COLLECT CONTEXT (injected, not asked)
    // ═══════════════════════════════════════════════════════════════════════════
    emit({ type: 'thinking', content: 'Analyzing intent...' });
    
    const context = collectContext(message, ctxInput.openFile);
    
    emit({ type: 'thinking', content: `Intent: ${context.intent} | Targets: ${context.targets.join(', ') || 'none'}` });
    
    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 2: ENFORCE EXECUTION (mandatory tool chain)
    // ═══════════════════════════════════════════════════════════════════════════
    const { log, toolResults } = await enforceExecution(
        context,
        ctxInput.openFile,
        ctxInput.baseUrl,
        emit
    );
    
    // Validate execution log
    if (!log.search && toolResults.length === 0) {
        emit({ type: 'error', content: 'Controller Error: NO_SEARCH_EXECUTED' });
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 3: AI SYNTHESIS
    // ═══════════════════════════════════════════════════════════════════════════
    emit({ type: 'thinking', content: 'Synthesizing response...' });
    
    const toolContext = formatResultsForAI(toolResults);
    const systemPrompt = buildSystemPrompt(toolContext, context.intent);
    
    const userPrompt = `User: "${message}"

Based on the tool results above, provide a solution.
If code changes are needed, provide the exact diff.`;
    
    // Get AI key
    const geminiKey = await getConfig('GEMINI_API_KEY');
    const openaiKey = await getConfig('OPENAI_API_KEY');
    
    if (!geminiKey && !openaiKey) {
        return {
            response: 'Error: No AI API key configured.',
            toolsUsed,
            filesModified
        };
    }
    
    let aiResponse = '';
    
    try {
        if (geminiKey) {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [
                            { role: 'user', parts: [{ text: `[SYSTEM]\n${systemPrompt}` }] },
                            ...(ctxInput.conversationHistory || []).slice(-4).map(m => ({
                                role: m.role === 'assistant' ? 'model' : 'user',
                                parts: [{ text: m.content }]
                            })),
                            { role: 'user', parts: [{ text: userPrompt }] }
                        ],
                        generationConfig: { temperature: 0.05, maxOutputTokens: 8192 }
                    })
                }
            );
            const data = await res.json();
            aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            
            if (!aiResponse && data.error) {
                aiResponse = `Error: ${data.error.message}`;
            }
        } else if (openaiKey) {
            const res = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openaiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...(ctxInput.conversationHistory || []).slice(-4),
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.05,
                    max_tokens: 4096
                })
            });
            const data = await res.json();
            aiResponse = data.choices?.[0]?.message?.content || '';
        }
    } catch (err) {
        aiResponse = `Error: ${err instanceof Error ? err.message : 'Unknown'}`;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 4: AUTO-APPLY DIFFS
    // ═══════════════════════════════════════════════════════════════════════════
    const diffRegex = /```diff:([^\n]+)\n<<<FIND>>>\n([\s\S]*?)\n<<<REPLACE>>>\n([\s\S]*?)```/gi;
    let diffMatch;
    
    while ((diffMatch = diffRegex.exec(aiResponse)) !== null) {
        const filePath = diffMatch[1].trim();
        const findText = diffMatch[2].trim();
        const replaceText = diffMatch[3].trim();
        
        emit({ type: 'tool-call', content: `Editing ${filePath}` });
        
        const editResult = await executeTool('replace_in_file', {
            filePath,
            find: findText,
            replace: replaceText
        }, ctxInput.baseUrl);
        
        toolsUsed.push(editResult);
        
        if (editResult.success) {
            filesModified.push(filePath);
            log.edit = true;
            emit({ type: 'file-edit', content: `Modified: ${filePath}` });
        } else {
            emit({ type: 'error', content: `Failed: ${filePath} - ${editResult.error}` });
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 5: VERIFY & REPORT
    // ═══════════════════════════════════════════════════════════════════════════
    emit({ 
        type: 'done', 
        content: `Executed: search=${log.search}, read=${log.read}, edit=${log.edit}`,
        data: { 
            filesRead: log.filesRead,
            filesEdited: filesModified,
            intent: context.intent
        }
    });
    
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
    const context = collectContext(message);
    return {
        intent: context.intent,
        keywords: context.keywords,
        targets: context.targets,
        wantsFileSearch: context.intent === 'SEARCH',
        wantsFileEdit: ['FIX', 'EDIT'].includes(context.intent),
        wantsMetadata: context.intent === 'METADATA',
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
