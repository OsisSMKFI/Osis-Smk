import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { execOnDevServer, fileOnDevServer, isProduction, hasDevServer } from '@/lib/dev-server-client';
import { supabaseAdmin } from '@/lib/supabase/server';

const execAsync = promisify(exec);

// ═══════════════════════════════════════════════════════════════════════════════
// 🤖 AI TOOLS API v1.0 - Real Copilot-like Capabilities
// ═══════════════════════════════════════════════════════════════════════════════
// This API gives AI REAL capabilities like GitHub Copilot:
// - file_search: Search for files by pattern
// - read_file: Read actual file contents
// - grep_search: Search text/regex in files  
// - write_file: Write/edit files
// - run_terminal: Execute safe terminal commands
// - list_dir: List directory contents
// - get_errors: Get TypeScript/lint errors
// ═══════════════════════════════════════════════════════════════════════════════

const WORKSPACE_ROOT = process.cwd();

// Security: Allowed file extensions for reading/writing
const ALLOWED_EXTENSIONS = [
    '.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.scss', 
    '.html', '.md', '.txt', '.sql', '.mjs', '.cjs', '.yaml', '.yml'
];

// Directories to exclude from searches
const EXCLUDED_DIRS = ['node_modules', '.git', '.next', 'dist', '.vercel', 'backups'];

// ═══════════════════════════════════════════════════════════════════════════════
// 📂 FILE SEARCH - Like VS Code's file search
// ═══════════════════════════════════════════════════════════════════════════════
async function fileSearch(pattern: string, maxResults: number = 20): Promise<string[]> {
    const results: string[] = [];
    
    // Convert glob pattern to regex
    const regexPattern = pattern
        .replace(/\*\*/g, '<<<DOUBLESTAR>>>')
        .replace(/\*/g, '[^/]*')
        .replace(/<<<DOUBLESTAR>>>/g, '.*')
        .replace(/\?/g, '.')
        .replace(/\./g, '\\.');
    
    const regex = new RegExp(regexPattern, 'i');
    
    async function searchDir(dir: string): Promise<void> {
        if (results.length >= maxResults) return;
        
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                if (results.length >= maxResults) break;
                
                const fullPath = path.join(dir, entry.name);
                const relativePath = path.relative(WORKSPACE_ROOT, fullPath).replace(/\\/g, '/');
                
                // Skip excluded directories
                if (entry.isDirectory()) {
                    if (EXCLUDED_DIRS.includes(entry.name)) continue;
                    await searchDir(fullPath);
                } else {
                    // Match against pattern
                    if (regex.test(relativePath) || regex.test(entry.name)) {
                        results.push(relativePath);
                    }
                }
            }
        } catch (err) {
            // Skip inaccessible directories
        }
    }
    
    await searchDir(WORKSPACE_ROOT);
    return results;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📖 READ FILE - Read file contents with line range
// ═══════════════════════════════════════════════════════════════════════════════
async function readFile(filePath: string, startLine?: number, endLine?: number): Promise<{
    content: string;
    totalLines: number;
    language: string;
}> {
    const fullPath = path.join(WORKSPACE_ROOT, filePath);
    
    // Security check
    if (!fullPath.startsWith(WORKSPACE_ROOT)) {
        throw new Error('Invalid path: outside workspace');
    }
    
    const ext = path.extname(filePath);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        throw new Error(`File type not allowed: ${ext}`);
    }
    
    const content = await fs.readFile(fullPath, 'utf-8');
    const lines = content.split('\n');
    const totalLines = lines.length;
    
    // Get language from extension
    const langMap: Record<string, string> = {
        '.ts': 'typescript', '.tsx': 'tsx', '.js': 'javascript', '.jsx': 'jsx',
        '.json': 'json', '.css': 'css', '.scss': 'scss', '.html': 'html',
        '.md': 'markdown', '.sql': 'sql', '.yaml': 'yaml', '.yml': 'yaml'
    };
    
    // Extract line range if specified
    let resultContent = content;
    if (startLine !== undefined && endLine !== undefined) {
        const start = Math.max(0, startLine - 1);
        const end = Math.min(totalLines, endLine);
        resultContent = lines.slice(start, end).join('\n');
    }
    
    return {
        content: resultContent,
        totalLines,
        language: langMap[ext] || 'text'
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔍 GREP SEARCH - Search text/regex in files
// ═══════════════════════════════════════════════════════════════════════════════
interface GrepMatch {
    file: string;
    line: number;
    text: string;
    preview: string;
}

async function grepSearch(
    query: string, 
    options: { 
        isRegexp?: boolean; 
        includePattern?: string;
        maxResults?: number;
    } = {}
): Promise<GrepMatch[]> {
    const results: GrepMatch[] = [];
    const maxResults = options.maxResults || 30;
    const regex = options.isRegexp ? new RegExp(query, 'gi') : new RegExp(escapeRegex(query), 'gi');
    
    // Get files to search
    let filesToSearch: string[] = [];
    
    if (options.includePattern) {
        filesToSearch = await fileSearch(options.includePattern, 100);
    } else {
        // Search in common code directories
        const commonPatterns = ['**/*.tsx', '**/*.ts', '**/*.css', '**/*.json'];
        for (const pattern of commonPatterns) {
            const files = await fileSearch(pattern, 50);
            filesToSearch.push(...files);
        }
    }
    
    // Remove duplicates
    filesToSearch = [...new Set(filesToSearch)];
    
    for (const file of filesToSearch) {
        if (results.length >= maxResults) break;
        
        try {
            const { content } = await readFile(file);
            const lines = content.split('\n');
            
            for (let i = 0; i < lines.length; i++) {
                if (results.length >= maxResults) break;
                
                if (regex.test(lines[i])) {
                    results.push({
                        file,
                        line: i + 1,
                        text: lines[i].trim(),
                        preview: lines[i].slice(0, 150)
                    });
                }
                regex.lastIndex = 0; // Reset regex
            }
        } catch {
            // Skip unreadable files
        }
    }
    
    return results;
}

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📁 LIST DIRECTORY - List directory contents
// ═══════════════════════════════════════════════════════════════════════════════
interface DirEntry {
    name: string;
    type: 'file' | 'directory';
    size?: number;
    extension?: string;
}

async function listDir(dirPath: string): Promise<DirEntry[]> {
    const fullPath = path.join(WORKSPACE_ROOT, dirPath);
    
    if (!fullPath.startsWith(WORKSPACE_ROOT)) {
        throw new Error('Invalid path');
    }
    
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    const results: DirEntry[] = [];
    
    for (const entry of entries) {
        // Skip excluded
        if (EXCLUDED_DIRS.includes(entry.name)) continue;
        
        if (entry.isDirectory()) {
            results.push({ name: entry.name + '/', type: 'directory' });
        } else {
            const ext = path.extname(entry.name);
            const stats = await fs.stat(path.join(fullPath, entry.name)).catch(() => null);
            results.push({
                name: entry.name,
                type: 'file',
                size: stats?.size,
                extension: ext
            });
        }
    }
    
    // Sort: directories first, then files
    return results.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
        return a.name.localeCompare(b.name);
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ✏️ WRITE FILE - Write/edit file contents
// ═══════════════════════════════════════════════════════════════════════════════
async function writeFile(filePath: string, content: string, options: { 
    action?: 'create' | 'update' | 'replace'; 
    createBackup?: boolean 
} = {}): Promise<{ success: boolean; message: string }> {
    
    // Production mode: forward to dev server
    if (isProduction) {
        if (!hasDevServer) {
            return {
                success: false,
                message: 'Dev Server required for file operations in production'
            };
        }
        const result = await fileOnDevServer('write', filePath, content);
        return {
            success: result.success,
            message: result.success ? `File saved: ${filePath}` : (result.error || 'Failed')
        };
    }
    
    const fullPath = path.join(WORKSPACE_ROOT, filePath);
    
    if (!fullPath.startsWith(WORKSPACE_ROOT)) {
        return { success: false, message: 'Invalid path' };
    }
    
    const ext = path.extname(filePath);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return { success: false, message: `File type not allowed: ${ext}` };
    }
    
    // Create backup if file exists
    if (options.createBackup !== false) {
        try {
            const existing = await fs.readFile(fullPath, 'utf-8');
            const backupDir = path.join(WORKSPACE_ROOT, 'backups', 'ai-edits');
            await fs.mkdir(backupDir, { recursive: true });
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(backupDir, `${path.basename(filePath)}.${timestamp}.bak`);
            await fs.writeFile(backupPath, existing, 'utf-8');
        } catch {
            // No existing file to backup
        }
    }
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    
    // Write file
    await fs.writeFile(fullPath, content, 'utf-8');
    
    return { success: true, message: `File saved: ${filePath}` };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔄 REPLACE IN FILE - Find and replace in file (DIFF-like)
// ═══════════════════════════════════════════════════════════════════════════════
async function replaceInFile(filePath: string, find: string, replace: string): Promise<{
    success: boolean;
    message: string;
    matchCount?: number;
}> {
    try {
        const { content } = await readFile(filePath);
        
        // Normalize line endings
        const normalizedContent = content.replace(/\r\n/g, '\n');
        const normalizedFind = find.replace(/\r\n/g, '\n').trim();
        
        // Check if find string exists
        if (!normalizedContent.includes(normalizedFind)) {
            // Try fuzzy match with trimmed lines
            const findLines = normalizedFind.split('\n').map(l => l.trim());
            const contentLines = normalizedContent.split('\n').map(l => l.trim());
            
            let fuzzyMatch = false;
            for (let i = 0; i <= contentLines.length - findLines.length; i++) {
                let matches = true;
                for (let j = 0; j < findLines.length; j++) {
                    if (contentLines[i + j] !== findLines[j]) {
                        matches = false;
                        break;
                    }
                }
                if (matches) {
                    fuzzyMatch = true;
                    break;
                }
            }
            
            if (!fuzzyMatch) {
                return {
                    success: false,
                    message: `Text not found in file. Make sure to use exact text including whitespace.`
                };
            }
        }
        
        // Do the replacement
        const newContent = normalizedContent.replace(normalizedFind, replace.replace(/\r\n/g, '\n').trim());
        
        // Save the file
        const writeResult = await writeFile(filePath, newContent);
        
        return {
            success: writeResult.success,
            message: writeResult.success ? `✅ Replaced in ${filePath}` : writeResult.message,
            matchCount: 1
        };
    } catch (err) {
        return {
            success: false,
            message: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🖥️ RUN TERMINAL - Execute safe commands
// ═══════════════════════════════════════════════════════════════════════════════
const ALLOWED_COMMANDS = [
    /^(npm|pnpm|yarn)\s+(install|add|remove|run|build|dev|start)/i,
    /^git\s+(status|log|diff|add|commit|push|pull|branch|checkout)/i,
    /^(mkdir|touch|cat|head|tail|ls|dir|pwd)/i,
    /^(npx|bunx)\s+/i,
    /^tsc\s*/i,
];

const BLOCKED_PATTERNS = [
    /rm\s+-rf?\s+\//i,
    /\|\s*sh/i,
    /;\s*rm/i,
    /eval\s*\(/i,
];

async function runTerminal(command: string): Promise<{
    success: boolean;
    output: string;
    error?: string;
}> {
    // Check blocked patterns
    for (const pattern of BLOCKED_PATTERNS) {
        if (pattern.test(command)) {
            return { success: false, output: '', error: 'Command blocked for security' };
        }
    }
    
    // Check allowed patterns
    let allowed = false;
    for (const pattern of ALLOWED_COMMANDS) {
        if (pattern.test(command.trim())) {
            allowed = true;
            break;
        }
    }
    
    if (!allowed) {
        return { 
            success: false, 
            output: '', 
            error: 'Command not allowed. Allowed: npm, pnpm, yarn, git, npx, tsc' 
        };
    }
    
    // Production: forward to dev server
    if (isProduction) {
        if (!hasDevServer) {
            return { success: false, output: '', error: 'Dev Server required for terminal' };
        }
        const result = await execOnDevServer(command);
        return {
            success: result.success,
            output: result.output || '',
            error: result.error
        };
    }
    
    // Local execution
    try {
        const { stdout, stderr } = await execAsync(command, {
            cwd: WORKSPACE_ROOT,
            timeout: 60000,
            maxBuffer: 1024 * 1024
        });
        
        return {
            success: true,
            output: stdout || stderr || 'Command completed'
        };
    } catch (err: any) {
        return {
            success: false,
            output: err.stdout || '',
            error: err.stderr || err.message
        };
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 GET DATABASE CONTEXT - Query Supabase for context
// ═══════════════════════════════════════════════════════════════════════════════
async function getDatabaseContext(table: string, query?: string): Promise<any[]> {
    try {
        let supabaseQuery = supabaseAdmin.from(table).select('*').limit(50);
        
        if (query) {
            // Add search filter for common text columns
            const searchColumns = ['title', 'name', 'content', 'description', 'excerpt'];
            const orFilters = searchColumns.map(col => `${col}.ilike.%${query}%`).join(',');
            supabaseQuery = supabaseQuery.or(orFilters);
        }
        
        const { data, error } = await supabaseQuery;
        
        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Database context error:', err);
        return [];
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════════════════
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { tool, params } = body;
        
        if (!tool) {
            return NextResponse.json({ success: false, error: 'Tool name required' }, { status: 400 });
        }
        
        let result: any;
        
        switch (tool) {
            case 'file_search':
                result = await fileSearch(params.pattern, params.maxResults);
                break;
                
            case 'read_file':
                result = await readFile(params.filePath, params.startLine, params.endLine);
                break;
                
            case 'grep_search':
                result = await grepSearch(params.query, {
                    isRegexp: params.isRegexp,
                    includePattern: params.includePattern,
                    maxResults: params.maxResults
                });
                break;
                
            case 'list_dir':
                result = await listDir(params.path || '');
                break;
                
            case 'write_file':
                result = await writeFile(params.filePath, params.content, {
                    action: params.action,
                    createBackup: params.createBackup
                });
                break;
                
            case 'replace_in_file':
                result = await replaceInFile(params.filePath, params.find, params.replace);
                break;
                
            case 'run_terminal':
                result = await runTerminal(params.command);
                break;
                
            case 'get_database':
                result = await getDatabaseContext(params.table, params.query);
                break;
                
            default:
                return NextResponse.json({ 
                    success: false, 
                    error: `Unknown tool: ${tool}` 
                }, { status: 400 });
        }
        
        return NextResponse.json({
            success: true,
            tool,
            result
        });
        
    } catch (error) {
        console.error('AI Tools API error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// Health check
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        version: '1.0',
        tools: [
            'file_search',
            'read_file', 
            'grep_search',
            'list_dir',
            'write_file',
            'replace_in_file',
            'run_terminal',
            'get_database'
        ],
        isProduction,
        hasDevServer
    });
}
