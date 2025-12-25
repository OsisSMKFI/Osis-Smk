import { getConfig } from '@/lib/adminConfig';

// ═══════════════════════════════════════════════════════════════════════════════
// 🤖 AI AGENT v4.4 - COPILOT++ AUTONOMOUS CODING AGENT
// ═══════════════════════════════════════════════════════════════════════════════
//
// ARCHITECTURE: CONTROLLER-FORCED EXECUTION + TRANSACTION SAFETY
//
// User Input → Controller → AI Agent → Tools → Verification → Commit/Rollback
//
// HARD RULES:
// - No response without tool execution
// - No idle state
// - No "no changes" without search
// - If intent unclear → ASSUME MOST LIKELY → EXECUTE
// - AI does NOT control itself
//
// v4.4 ENHANCEMENTS:
// - BLOCK → AUTO-READ: When blocked, auto-read top result to enable editing
// - MULTI-FILE TRANSACTION: Rollback all if any diff fails
// - CONFIDENCE SCORING: Track confidence per action
// - TOOL BATCHING: Copilot-style parallel execution
//
// COPILOT PHILOSOPHY:
// - Assumption over clarification
// - Confidence over correctness
// - Momentum over politeness
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
// 📊 CONFIDENCE SCORING - Track certainty per action
// ═══════════════════════════════════════════════════════════════════════════════
interface ConfidenceScore {
    action: string;
    score: number; // 0.0 - 1.0
    reason: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔐 MULTI-FILE TRANSACTION - Atomic operations with rollback
// ═══════════════════════════════════════════════════════════════════════════════
interface FileTransaction {
    filePath: string;
    originalContent: string | null;
    newContent: string | null;
    status: 'pending' | 'applied' | 'failed' | 'rolledback';
}

interface TransactionContext {
    id: string;
    files: FileTransaction[];
    status: 'open' | 'committed' | 'rolledback';
    confidenceScores: ConfidenceScore[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🧠 SESSION MEMORY - Stateful context across messages
// ═══════════════════════════════════════════════════════════════════════════════
interface SessionMemory {
    lastFilesRead: string[];
    lastFilesEdited: string[];
    lastIntent: Intent;
    lastSearchPatterns: string[];
    lastExecutionPlan: { tool: string; params: Record<string, any> }[];
    ongoingTask: string | null;
}

// Global session memory (persists across calls in same process)
let sessionMemory: SessionMemory = {
    lastFilesRead: [],
    lastFilesEdited: [],
    lastIntent: 'UNKNOWN',
    lastSearchPatterns: [],
    lastExecutionPlan: [],
    ongoingTask: null
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🎲 ASSUMPTION ENGINE - Infer intent BEFORE explicit detection
// Copilot sering salah, tapi SELALU percaya diri
// ═══════════════════════════════════════════════════════════════════════════════
function assumeIntent(
    input: string, 
    openFile?: { path: string },
    memory: SessionMemory = sessionMemory
): Intent | null {
    const lower = input.toLowerCase().trim();
    
    // IMPLICIT CONTINUATION - "masih", "belum", "sama", "tetap", "yaudah"
    // Reuse last execution plan, don't re-analyze
    if (/^(masih|belum|sama|tetap|yaudah|lanjut|terus|ok|oke|sip|gas|next)/.test(lower)) {
        return memory.lastIntent !== 'UNKNOWN' ? memory.lastIntent : 'FIX';
    }
    
    // SHORT INPUT (< 15 chars) = likely continuation of last task
    if (lower.length < 15 && memory.lastIntent !== 'UNKNOWN') {
        // Check if it's a status word
        if (/salah|error|gagal|rusak|gak|tidak|hilang/.test(lower)) {
            return 'FIX';
        }
        return memory.lastIntent;
    }
    
    // DOMINANT FILE BIAS - if recent files are metadata-related
    if (memory.lastFilesEdited.some(f => /meta|og|seo/i.test(f))) {
        if (/masih|salah|belum|gak|tidak/.test(lower)) {
            return 'METADATA';
        }
    }
    
    // DOMINANT FILE BIAS - if recent files are UI components
    if (memory.lastFilesEdited.some(f => /component|page|tsx/i.test(f))) {
        if (/gak|tidak|muncul|hilang|tampil/.test(lower)) {
            return 'UI';
        }
    }
    
    // OPEN FILE BIAS - assume intent based on currently open file
    if (openFile?.path) {
        if (/meta|og|seo/i.test(openFile.path)) {
            return 'METADATA';
        }
        if (/page|component/i.test(openFile.path)) {
            return 'UI';
        }
    }
    
    // No assumption - let explicit detection handle it
    return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 INTENT ENGINE - Aggressive, not NLP-soft
// ═══════════════════════════════════════════════════════════════════════════════
type Intent = 'FIX' | 'EDIT' | 'METADATA' | 'UI' | 'SEARCH' | 'TERMINAL' | 'UNKNOWN';

// ═══════════════════════════════════════════════════════════════════════════════
// 🧠 SEMANTIC ALIASES - Copilot knows "notif" means "toast", "snackbar", etc.
// ═══════════════════════════════════════════════════════════════════════════════
const SEMANTIC_ALIASES: Record<string, string[]> = {
    // UI Components
    notif: ['toast', 'notification', 'snackbar', 'alert', 'message'],
    bilah: ['toast', 'notification', 'bar', 'banner', 'strip'],
    popup: ['modal', 'dialog', 'overlay', 'drawer'],
    tombol: ['button', 'btn', 'action', 'icon', 'clickable'],
    menu: ['navbar', 'nav', 'sidebar', 'header', 'navigation'],
    kartu: ['card', 'tile', 'item', 'box'],
    form: ['input', 'field', 'form', 'textarea', 'select'],
    daftar: ['list', 'table', 'grid', 'items'],
    gambar: ['image', 'img', 'photo', 'picture', 'avatar'],
    
    // Actions
    hapus: ['dismiss', 'close', 'remove', 'delete', 'clear', 'x'],
    tutup: ['close', 'dismiss', 'hide', 'collapse'],
    buka: ['open', 'show', 'expand', 'reveal'],
    tambah: ['add', 'create', 'new', 'insert', 'plus'],
    edit: ['modify', 'update', 'change', 'alter'],
    
    // States
    loading: ['spinner', 'skeleton', 'loading', 'pending'],
    error: ['error', 'fail', 'invalid', 'warning'],
    sukses: ['success', 'done', 'complete', 'valid']
};

function expandWithAliases(keywords: string[]): string[] {
    const expanded: string[] = [...keywords];
    for (const keyword of keywords) {
        const lower = keyword.toLowerCase();
        if (SEMANTIC_ALIASES[lower]) {
            expanded.push(...SEMANTIC_ALIASES[lower]);
        }
        // Also check if keyword matches any alias value
        for (const [key, aliases] of Object.entries(SEMANTIC_ALIASES)) {
            if (aliases.includes(lower)) {
                expanded.push(key, ...aliases);
            }
        }
    }
    return [...new Set(expanded)];
}

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
function collectContext(
    message: string, 
    openFile?: { path: string; content?: string },
    memory: SessionMemory = sessionMemory
): {
    intent: Intent;
    keywords: string[];
    targets: string[];
    searchPatterns: string[];
    isImplicitContinuation: boolean;
    preferredFiles: string[];
} {
    // STEP 1: Try assumption engine FIRST (Copilot behavior)
    const assumedIntent = assumeIntent(message, openFile, memory);
    
    // STEP 2: Fall back to explicit detection
    const explicitIntent = detectIntent(message);
    
    // Use assumed intent if available, otherwise explicit
    const intent = assumedIntent || explicitIntent;
    
    // Check if this is implicit continuation
    const lower = message.toLowerCase().trim();
    const isImplicitContinuation = /^(masih|belum|sama|tetap|yaudah|lanjut|terus|ok|oke|sip|gas|next)/.test(lower) ||
                                   (lower.length < 15 && memory.lastIntent !== 'UNKNOWN');
    
    // DOMINANT FILE BIAS - prefer recently edited files
    const preferredFiles = [...memory.lastFilesEdited, ...memory.lastFilesRead].slice(0, 3);
    
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
    let searchPatterns: string[] = [];
    
    // If implicit continuation, reuse last search patterns
    if (isImplicitContinuation && memory.lastSearchPatterns.length > 0) {
        searchPatterns = [...memory.lastSearchPatterns];
    } else {
        if (intent === 'METADATA') {
            searchPatterns.push('generateMetadata|openGraph|og:|twitter:');
            searchPatterns.push('OG_VERSION|SITE_URL|metadata');
        } else if (intent === 'UI') {
            searchPatterns.push('className|style|css|tailwind');
        } else if (intent === 'FIX' || intent === 'EDIT') {
            // Use targets + semantic aliases as search patterns
            const expandedTargets = expandWithAliases(targets);
            const expandedKeywords = expandWithAliases(keywords.slice(0, 5));
            
            if (expandedTargets.length > 0) {
                searchPatterns.push(expandedTargets.join('|'));
            }
            // Add expanded keywords
            searchPatterns.push(expandedKeywords.join('|'));
        }
        
        // Add file path from open file
        if (openFile?.path) {
            searchPatterns.push(openFile.path.split('/').pop()?.replace('.tsx', '') || '');
        }
    }
    
    return { 
        intent, 
        keywords, 
        targets, 
        searchPatterns: [...new Set(searchPatterns)].filter(Boolean),
        isImplicitContinuation,
        preferredFiles
    };
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
// � AUTO-PATH-RESOLVER - Resolve filename to real repo path
// Copilot NEVER uses filename-only paths
// ═══════════════════════════════════════════════════════════════════════════════
async function resolveRealFilePath(
    rawPath: string,
    baseUrl: string,
    readableFiles: Set<string>,
    log: ExecutionLog,
    emit: (step: AgentStep) => void
): Promise<string | null> {
    // 1. If already has path separator and is readable → use as-is
    if (rawPath.includes('/') && readableFiles.has(rawPath)) {
        return rawPath;
    }
    
    // 2. Check if it exists in readable files (partial match)
    for (const file of readableFiles) {
        if (file.endsWith(rawPath) || file.includes(rawPath.replace(/\.(tsx?|jsx?)$/, ''))) {
            emit({ type: 'tool-result', content: `Found in scope: ${file}` });
            return file;
        }
    }
    
    // 3. Extract filename for search
    const fileName = rawPath.split('/').pop() || rawPath;
    if (!fileName) return null;
    
    emit({ type: 'thinking', content: `Searching for: ${fileName}...` });
    
    // 4. Search for file in repo - exact match first
    let searchResult = await executeTool('file_search', {
        pattern: `**/${fileName}`
    }, baseUrl);
    
    // 5. If not found, try without extension variations
    if (!searchResult.success || !Array.isArray(searchResult.result) || searchResult.result.length === 0) {
        const baseName = fileName.replace(/\.(tsx?|jsx?)$/, '');
        
        // Try partial name match
        searchResult = await executeTool('file_search', {
            pattern: `**/*${baseName}*.tsx`
        }, baseUrl);
        
        // Still not found? Try grep search for related content
        if (!searchResult.success || !Array.isArray(searchResult.result) || searchResult.result.length === 0) {
            emit({ type: 'thinking', content: `No file match for ${baseName}, searching content...` });
            
            // Search by semantic keywords from the filename
            const keywords = baseName.replace(/([A-Z])/g, ' $1').trim().toLowerCase().split(/\s+/);
            const grepResult = await executeTool('grep_search', {
                query: keywords.join('|'),
                includePattern: '**/*.tsx'
            }, baseUrl);
            
            if (grepResult.success && Array.isArray(grepResult.result) && grepResult.result.length > 0) {
                // Convert grep results to file paths
                const filesFromGrep = [...new Set(grepResult.result.map((r: any) => r.file))];
                searchResult.result = filesFromGrep;
                emit({ type: 'tool-result', content: `Found via content search: ${filesFromGrep.length} candidates` });
            } else {
                emit({ type: 'error', content: `FAILED: "${fileName}" does not exist in codebase` });
                return null;
            }
        }
    }
    
    // 6. Rank candidates (prioritize components/ui/app paths)
    const ranked = (searchResult.result as string[]).sort((a, b) => {
        const score = (p: string) =>
            (p.includes('/components') ? 4 : 0) +
            (p.includes('/ui') ? 3 : 0) +
            (p.includes('/app') ? 2 : 0) +
            (p.includes('/lib') ? 1 : 0);
        return score(b) - score(a);
    });
    
    const resolvedPath = ranked[0];
    emit({ type: 'tool-result', content: `Resolved: ${rawPath} → ${resolvedPath}` });
    
    // 7. Auto-read file to add to editable scope
    const readResult = await executeTool('read_file', {
        filePath: resolvedPath,
        startLine: 1,
        endLine: 500
    }, baseUrl);
    
    if (!readResult.success) {
        emit({ type: 'error', content: `Resolved but failed to read: ${resolvedPath}` });
        return null;
    }
    
    readableFiles.add(resolvedPath);
    log.filesRead.push(resolvedPath);
    emit({ type: 'file-edit', content: `Added to scope: ${resolvedPath}` });
    
    return resolvedPath;
}

// ═══════════════════════════════════════════════════════════════════════════════
// �🔄 ENFORCE EXECUTION - This is what makes it Copilot-like
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
    // IMPLICIT CONTINUATION: Reuse last execution plan
    // ═══════════════════════════════════════════════════════════════════════════
    if (context.isImplicitContinuation && sessionMemory.lastFilesRead.length > 0) {
        emit({ type: 'thinking', content: 'Continuing from last context...' });
        
        // Directly read last files instead of searching again
        for (const file of sessionMemory.lastFilesRead.slice(0, 2)) {
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
                emit({ type: 'tool-result', content: `Read ${file}` });
            }
        }
        
        // Skip search phase for continuation
        log.search = true;
        return { log, toolResults };
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 1: SEARCH (MANDATORY) - Prioritize preferred files
    // ═══════════════════════════════════════════════════════════════════════════
    emit({ type: 'tool-call', content: 'Searching codebase...' });
    
    // DOMINANT FILE BIAS: Search preferred files first
    if (context.preferredFiles.length > 0) {
        for (const file of context.preferredFiles.slice(0, 2)) {
            const readResult = await executeTool('read_file', {
                filePath: file,
                startLine: 1,
                endLine: 300
            }, baseUrl);
            
            if (readResult.success) {
                log.read = true;
                log.filesRead.push(file);
                log.filesFound.push(file);
                toolResults.push({ 
                    tool: 'read_file', 
                    result: { ...readResult.result, path: file },
                    params: { filePath: file }
                });
                emit({ type: 'tool-result', content: `Read preferred: ${file}` });
            }
        }
    }
    
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
// � CODE SMELL DETECTOR - For self-initiated refactor
// ═══════════════════════════════════════════════════════════════════════════════
function detectCodeSmells(content: string): string[] {
    const smells: string[] = [];
    
    // Long functions (> 50 lines between function declaration and closing brace)
    if (/function\s+\w+[^}]{2000,}/s.test(content)) {
        smells.push('long_function');
    }
    
    // Repeated code patterns
    const lines = content.split('\n');
    const lineSet = new Set<string>();
    let duplicates = 0;
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length > 30 && lineSet.has(trimmed)) {
            duplicates++;
        }
        lineSet.add(trimmed);
    }
    if (duplicates > 3) {
        smells.push('code_duplication');
    }
    
    // console.log in production code
    if (/console\.(log|warn|error)\(/.test(content)) {
        smells.push('console_statements');
    }
    
    // any type usage
    if (/:\s*any\b/.test(content)) {
        smells.push('any_type_usage');
    }
    
    // Empty catch blocks
    if (/catch\s*\([^)]*\)\s*{\s*}/s.test(content)) {
        smells.push('empty_catch');
    }
    
    // Magic numbers
    if (/[^0-9.]\d{4,}[^0-9.]/.test(content)) {
        smells.push('magic_numbers');
    }
    
    return smells;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📝 FORMAT RESULTS FOR AI
// ═══════════════════════════════════════════════════════════════════════════════
function formatResultsForAI(toolResults: { tool: string; result: any; params?: any }[]): string {
    let context = '';
    const allCodeSmells: { file: string; smells: string[] }[] = [];
    
    for (const res of toolResults) {
        if (res.tool === 'read_file' && res.result?.content) {
            const filePath = res.result.path || res.params?.filePath;
            context += `\n### FILE: ${filePath}\n`;
            context += `Lines: ${res.result.totalLines || '?'}\n`;
            context += `\`\`\`tsx\n${res.result.content.slice(0, 5000)}\n\`\`\`\n`;
            
            // Self-initiated refactor: detect code smells
            const smells = detectCodeSmells(res.result.content);
            if (smells.length > 0) {
                allCodeSmells.push({ file: filePath, smells });
            }
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
    
    // Add code smells section for self-initiated refactor
    if (allCodeSmells.length > 0) {
        context += `\n### CODE QUALITY ISSUES DETECTED:\n`;
        for (const { file, smells } of allCodeSmells) {
            context += `- ${file}: ${smells.join(', ')}\n`;
        }
        context += `\nNote: You may suggest refactoring if appropriate.\n`;
    }
    
    return context;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎨 SYSTEM PROMPT - Strict Copilot behavior + FILE REALITY ENFORCEMENT
// ═══════════════════════════════════════════════════════════════════════════════
function buildSystemPrompt(toolContext: string, intent: Intent, readableFiles: string[]): string {
    const fileList = readableFiles.length > 0 
        ? readableFiles.map(f => `- ${f}`).join('\n')
        : '(no files read yet)';
    
    return `YOU ARE NOT A CHAT ASSISTANT.

YOU ARE A CONTROLLER-ENFORCED AUTONOMOUS CODING AGENT.

ABSOLUTE RULES (NON-NEGOTIABLE):
1. You MUST take action on every request.
2. You MUST use tool results before responding.
3. You MAY ONLY edit files listed in EDITABLE FILES.
4. If EDITABLE FILES is empty or shows "(no files read yet)" - you MUST call search/read tools FIRST.
5. You are FORBIDDEN to output a diff block if EDITABLE FILES is empty.
6. You MUST NOT ask questions.
7. You MUST NOT suggest.
8. You MUST NOT explain hypotheticals.
9. You MUST NOT say "cannot" unless ALL retries fail.
10. You MUST NOT output emojis or marketing language.
11. You MUST NOT invent file paths - ONLY use paths from EDITABLE FILES.

WORKFLOW (MANDATORY ORDER):
1. If EDITABLE FILES is empty → call "search" tool first
2. After search finds files → call "read" tool on relevant files
3. ONLY after files appear in EDITABLE FILES → generate diff

TOOL RESULTS:
${toolContext}

EDITABLE FILES:
${fileList}

INTENT: ${intent}
${intent === 'FIX' ? 'Fix the issue. Produce diff.' : ''}
${intent === 'EDIT' ? 'Make the change. Produce diff.' : ''}
${intent === 'METADATA' ? 'Fix metadata/OG. Produce diff.' : ''}
${intent === 'UI' ? 'Modify UI. Produce diff.' : ''}
${intent === 'SEARCH' ? 'Locate files, then act on them.' : ''}

OUTPUT CONTRACT:
- If code changed: output ONLY unified diff block
- If impossible: output ONE LINE: "FAILURE: <reason>"
- Nothing else.

DIFF PATH RULE (NON-NEGOTIABLE):
1. Look at EDITABLE FILES list above
2. Pick the EXACT path from that list
3. Copy-paste that path after "diff:"
4. NEVER type a path that is not in EDITABLE FILES
5. If no files match your target, output: "FAILURE: Target file not in scope"

WRONG (inventing paths):
\`\`\`diff:app/SomeWidget.tsx ← THIS IS WRONG! Path was invented!

CORRECT (using real path from EDITABLE FILES):
\`\`\`diff:app/admin/dashboard/page.tsx ← Path copied from EDITABLE FILES

Bahasa Indonesia. Singkat. Langsung eksekusi.`;
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
    // FILE REALITY SET - Only these files can be edited
    // ═══════════════════════════════════════════════════════════════════════════
    const readableFiles = new Set(log.filesRead);
    const readableFilesList = [...readableFiles];
    
    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 3: AI SYNTHESIS
    // ═══════════════════════════════════════════════════════════════════════════
    emit({ type: 'thinking', content: 'Synthesizing response...' });
    
    const toolContext = formatResultsForAI(toolResults);
    const systemPrompt = buildSystemPrompt(toolContext, context.intent, readableFilesList);
    
    const userPrompt = `USER REQUEST:
"${message}"

EXECUTION REQUIREMENTS:
- Execute immediately.
- If files are missing, they were already searched.
- Either apply changes via diff or output FAILURE.
- Do not ask questions.
- Do not describe possibilities.
- Do not suggest.`;
    
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
    // OUTPUT SANITIZER: Remove ChatGPT-like phrases (Copilot NEVER suggests)
    // ═══════════════════════════════════════════════════════════════════════════
    const FORBIDDEN_PHRASES = [
        'saya bisa', 'saya dapat', 'saya akan membantu',
        'mungkin', 'sebaiknya', 'suggest:', 'coba ',
        'anda bisa', 'anda dapat', 'tidak ada informasi',
        'perlu diperiksa', 'sepertinya', 'kemungkinan',
        'saya sarankan', 'disarankan', 'saran:',
        '💡', '✨', '🔥', '👋', '🚀', '📝', '🎨'
    ];
    
    for (const phrase of FORBIDDEN_PHRASES) {
        if (aiResponse.toLowerCase().includes(phrase.toLowerCase())) {
            aiResponse = aiResponse.replace(new RegExp(phrase, 'gi'), '');
        }
    }
    
    // Clean up orphaned markdown from emoji removal
    aiResponse = aiResponse.replace(/\*\*\s*\*\*/g, '').replace(/\n{3,}/g, '\n\n').trim();
    
    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 4: AUTO-APPLY DIFFS WITH TRANSACTION SAFETY
    // Copilot tidak tanya sebelum overwrite, kecuali destructive
    // ═══════════════════════════════════════════════════════════════════════════
    const diffRegex = /```diff:([^\n]+)\n<<<FIND>>>\n([\s\S]*?)\n<<<REPLACE>>>\n([\s\S]*?)```/gi;
    let diffMatch;
    
    // Collect all diffs first for transaction handling
    const pendingDiffs: { filePath: string; findText: string; replaceText: string }[] = [];
    while ((diffMatch = diffRegex.exec(aiResponse)) !== null) {
        pendingDiffs.push({
            filePath: diffMatch[1].trim(),
            findText: diffMatch[2].trim(),
            replaceText: diffMatch[3].trim()
        });
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // MULTI-FILE TRANSACTION: Initialize transaction context
    // ═══════════════════════════════════════════════════════════════════════════
    const transaction: TransactionContext = {
        id: `tx_${Date.now()}`,
        files: [],
        status: 'open',
        confidenceScores: []
    };
    
    // Pre-read all files for rollback capability
    for (const diff of pendingDiffs) {
        const { filePath } = diff;
        
        // Calculate confidence based on file match quality
        const confidence: ConfidenceScore = {
            action: `edit:${filePath}`,
            score: readableFiles.has(filePath) ? 0.95 : 0.3,
            reason: readableFiles.has(filePath) ? 'File was read' : 'File not in readable set'
        };
        transaction.confidenceScores.push(confidence);
        
        // ═══════════════════════════════════════════════════════════════════════
        // FILE REALITY ENFORCEMENT + AUTO-PATH-RESOLVER
        // Filename-only paths (e.g., "Toast.tsx") are auto-resolved to real paths
        // ═══════════════════════════════════════════════════════════════════════
        if (!readableFiles.has(filePath)) {
            // Use AUTO-PATH-RESOLVER for proper path resolution
            const resolvedPath = await resolveRealFilePath(
                filePath,
                ctxInput.baseUrl,
                readableFiles,
                log,
                emit
            );
            
            if (!resolvedPath) {
                emit({ type: 'error', content: `Edit BLOCKED: Cannot resolve ${filePath}` });
                continue; // Skip this diff
            }
            
            // Update diff to use resolved path
            diff.filePath = resolvedPath;
            
            // Store for rollback
            transaction.files.push({
                filePath: resolvedPath,
                originalContent: null, // Will be read separately if needed
                newContent: null,
                status: 'pending'
            });
            
            // Update confidence
            confidence.score = 0.85;
            confidence.reason = 'Path resolved via auto-resolver';
        } else {
            // File already readable - read for rollback
            const existingRead = await executeTool('read_file', {
                filePath,
                startLine: 1,
                endLine: 1000
            }, ctxInput.baseUrl);
            
            if (existingRead.success) {
                transaction.files.push({
                    filePath,
                    originalContent: typeof existingRead.result === 'string' ? existingRead.result : JSON.stringify(existingRead.result),
                    newContent: null,
                    status: 'pending'
                });
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // APPLY DIFFS WITH ROLLBACK ON FAILURE
    // ═══════════════════════════════════════════════════════════════════════════
    const appliedEdits: { filePath: string; success: boolean }[] = [];
    let transactionFailed = false;
    
    for (const diff of pendingDiffs) {
        const { filePath, findText, replaceText } = diff;
        
        // Skip if file still not readable
        if (!readableFiles.has(filePath)) {
            continue;
        }
        
        // Silent Overwrite: auto-apply non-destructive changes
        const isNonBreaking = replaceText.length > 0; // Not a pure deletion
        
        if (isNonBreaking) {
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
                
                // Track in transaction
                appliedEdits.push({ filePath, success: true });
                const txFile = transaction.files.find(f => f.filePath === filePath);
                if (txFile) txFile.status = 'applied';
                
                // ═══════════════════════════════════════════════════════════════
                // ASSUME SUCCESS BIAS: Mark for potential follow-up improvement
                // ═══════════════════════════════════════════════════════════════
                sessionMemory.lastFilesEdited.unshift(filePath);
                
                // ═══════════════════════════════════════════════════════════════
                // MICRO-IMPROVEMENT CHAIN: Copilot auto-adds common patterns
                // ═══════════════════════════════════════════════════════════════
                if (context.intent === 'FIX' && (replaceText.includes('dismiss') || replaceText.includes('close'))) {
                    // If adding dismiss/close, note for potential auto-dismiss
                    if (!replaceText.includes('setTimeout') && !replaceText.includes('useEffect')) {
                        // Append micro-improvement note to response (not a suggestion)
                        aiResponse += `\n\n[Auto-dismiss timeout not detected. Add useEffect with setTimeout for auto-dismiss if needed.]`;
                    }
                }
                
            } else {
                // Track failure in transaction
                appliedEdits.push({ filePath, success: false });
                const txFile = transaction.files.find(f => f.filePath === filePath);
                if (txFile) txFile.status = 'failed';
                transactionFailed = true;
                
                // ═══════════════════════════════════════════════════════════════
                // ERROR AMNESIA: Don't explain failure, try alternative
                // ═══════════════════════════════════════════════════════════════
                emit({ type: 'thinking', content: `Trying alternative approach for ${filePath}...` });
                
                // Try to find similar file if exact match failed
                const fileName = filePath.split('/').pop() || '';
                const altSearch = await executeTool('file_search', {
                    pattern: `**/*${fileName.replace('.tsx', '')}*.tsx`
                }, ctxInput.baseUrl);
                
                if (altSearch.success && Array.isArray(altSearch.result) && altSearch.result.length > 0) {
                    const altFile = altSearch.result[0];
                    if (altFile !== filePath) {
                        emit({ type: 'tool-call', content: `Trying: ${altFile}` });
                        
                        // Read the alternative file first
                        const readAlt = await executeTool('read_file', {
                            filePath: altFile,
                            startLine: 1,
                            endLine: 300
                        }, ctxInput.baseUrl);
                        
                        if (readAlt.success) {
                            log.filesRead.push(altFile);
                            readableFiles.add(altFile); // Add to editable scope
                            emit({ type: 'tool-result', content: `Found alternative: ${altFile}` });
                        }
                    }
                }
                
                // Log failure without excessive explanation
                emit({ type: 'error', content: `Edit failed: ${filePath}` });
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // MULTI-FILE TRANSACTION: ROLLBACK ON FAILURE (if enabled)
    // Only rollback if ALL edits in a batch should be atomic
    // ═══════════════════════════════════════════════════════════════════════════
    if (transactionFailed && pendingDiffs.length > 1 && appliedEdits.filter(e => e.success).length > 0) {
        emit({ type: 'thinking', content: `Transaction has failures. Rolling back ${appliedEdits.filter(e => e.success).length} successful edits...` });
        
        // Rollback: Restore original content for all applied edits
        for (const txFile of transaction.files) {
            if (txFile.status === 'applied' && txFile.originalContent) {
                emit({ type: 'tool-call', content: `Rolling back: ${txFile.filePath}` });
                
                // Read current content to get what was applied
                const currentRead = await executeTool('read_file', {
                    filePath: txFile.filePath,
                    startLine: 1,
                    endLine: 1000
                }, ctxInput.baseUrl);
                
                if (currentRead.success) {
                    // Restore original by writing it back
                    const rollbackResult = await executeTool('write_file', {
                        filePath: txFile.filePath,
                        content: txFile.originalContent
                    }, ctxInput.baseUrl);
                    
                    if (rollbackResult.success) {
                        txFile.status = 'rolledback';
                        emit({ type: 'file-edit', content: `Rolled back: ${txFile.filePath}` });
                        // Remove from modified list
                        const idx = filesModified.indexOf(txFile.filePath);
                        if (idx > -1) filesModified.splice(idx, 1);
                    }
                }
            }
        }
        
        transaction.status = 'rolledback';
        emit({ type: 'error', content: `Transaction rolled back due to failures. Please fix issues and retry.` });
    } else if (!transactionFailed && appliedEdits.length > 0) {
        transaction.status = 'committed';
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // CONFIDENCE GATE: Low confidence = force retry (Copilot behavior)
    // ═══════════════════════════════════════════════════════════════════════════
    const avgConfidence = transaction.confidenceScores.length > 0
        ? transaction.confidenceScores.reduce((sum, c) => sum + c.score, 0) / transaction.confidenceScores.length
        : 0;
    
    // If confidence too low and we have an action intent, force broader search
    if (avgConfidence < 0.6 && ['FIX', 'EDIT', 'UI'].includes(context.intent) && filesModified.length === 0) {
        emit({ type: 'thinking', content: `Low confidence (${(avgConfidence * 100).toFixed(0)}%). Broadening search...` });
        
        // Try common component patterns
        const commonPatterns = ['Toast', 'Notification', 'Alert', 'Modal', 'Button', 'Header', 'Footer'];
        for (const pattern of commonPatterns) {
            if (context.keywords.some(k => pattern.toLowerCase().includes(k) || k.includes(pattern.toLowerCase()))) {
                const broadSearch = await executeTool('file_search', {
                    pattern: `**/*${pattern}*.tsx`
                }, ctxInput.baseUrl);
                
                if (broadSearch.success && Array.isArray(broadSearch.result) && broadSearch.result.length > 0) {
                    const foundFile = broadSearch.result[0] as string;
                    if (!log.filesRead.includes(foundFile)) {
                        await executeTool('read_file', {
                            filePath: foundFile,
                            startLine: 1,
                            endLine: 300
                        }, ctxInput.baseUrl);
                        log.filesRead.push(foundFile);
                        readableFiles.add(foundFile);
                    }
                }
            }
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 5: UPDATE SESSION MEMORY (Stateful)
    // ═══════════════════════════════════════════════════════════════════════════
    sessionMemory.lastFilesRead = [...new Set([...log.filesRead, ...sessionMemory.lastFilesRead])].slice(0, 5);
    sessionMemory.lastFilesEdited = [...new Set([...filesModified, ...sessionMemory.lastFilesEdited])].slice(0, 5);
    sessionMemory.lastIntent = context.intent;
    sessionMemory.lastSearchPatterns = context.searchPatterns;
    sessionMemory.ongoingTask = message.slice(0, 100);
    
    // ═══════════════════════════════════════════════════════════════════════════
    // FORCE-RETRY: FIX/EDIT intent MUST produce edits (Copilot never gives up)
    // ═══════════════════════════════════════════════════════════════════════════
    let retryAttempted = false;
    if (['FIX', 'EDIT', 'UI'].includes(context.intent) && filesModified.length === 0 && log.filesRead.length > 0) {
        emit({ type: 'thinking', content: 'No edits applied. Expanding search...' });
        retryAttempted = true;
        
        // AUTO-RETRY: Broaden search with semantic aliases
        const broadenedPatterns = expandWithAliases(context.targets);
        emit({ type: 'tool-call', content: `Retry search: ${broadenedPatterns.slice(0, 3).join(', ')}...` });
        
        for (const pattern of broadenedPatterns.slice(0, 3)) {
            const retrySearch = await executeTool('file_search', {
                pattern: `**/*${pattern}*.tsx`
            }, ctxInput.baseUrl);
            
            if (retrySearch.success && Array.isArray(retrySearch.result) && retrySearch.result.length > 0) {
                const foundFile = retrySearch.result[0] as string;
                if (!log.filesRead.includes(foundFile)) {
                    emit({ type: 'tool-call', content: `Reading: ${foundFile}` });
                    const readResult = await executeTool('read_file', {
                        filePath: foundFile,
                        startLine: 1,
                        endLine: 300
                    }, ctxInput.baseUrl);
                    
                    if (readResult.success) {
                        log.filesRead.push(foundFile);
                        readableFiles.add(foundFile);
                        emit({ type: 'tool-result', content: `Found alternative: ${foundFile}` });
                    }
                }
            }
        }
        
        // FAIL HARD if still nothing
        if (filesModified.length === 0) {
            aiResponse = `FAILED: Intent=${context.intent}, searched=${context.searchPatterns.join(', ')}, read=${log.filesRead.join(', ')}, but no applicable edit found. File structure may differ from expected.`;
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // PHASE 6: VERIFY & REPORT
    // ═══════════════════════════════════════════════════════════════════════════
    const editSuccessRate = filesModified.length > 0 ? 
        `${filesModified.length} file(s) modified` : 
        retryAttempted ? 'retry exhausted, no match' : 
        toolsUsed.some(t => !t.success) ? 'edit attempted, no match' : 'search only';
    
    const txStatus = transaction.status === 'rolledback' 
        ? ' | TX:ROLLBACK' 
        : transaction.status === 'committed' 
            ? ' | TX:OK' 
            : '';
    
    emit({ 
        type: 'done', 
        content: `Executed: search=${log.search}, read=${log.read}, edit=${log.edit} | ${editSuccessRate} | confidence=${(avgConfidence * 100).toFixed(0)}%${txStatus}`,
        data: { 
            filesRead: log.filesRead,
            filesEdited: filesModified,
            intent: context.intent,
            isImplicitContinuation: context.isImplicitContinuation,
            transaction: {
                id: transaction.id,
                status: transaction.status,
                filesInTransaction: transaction.files.length,
                avgConfidence
            }
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

// Reset session memory (for testing)
export function resetSessionMemory() {
    sessionMemory = {
        lastFilesRead: [],
        lastFilesEdited: [],
        lastIntent: 'UNKNOWN',
        lastSearchPatterns: [],
        lastExecutionPlan: [],
        ongoingTask: null
    };
}

// Get current session memory (for debugging)
export function getSessionMemory(): SessionMemory {
    return { ...sessionMemory };
}

export function detectUserIntent(message: string) {
    const context = collectContext(message);
    return {
        intent: context.intent,
        keywords: context.keywords,
        targets: context.targets,
        isImplicitContinuation: context.isImplicitContinuation,
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

