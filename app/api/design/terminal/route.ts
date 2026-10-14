import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { auth } from '@/lib/auth';
import { fetchUserRole } from '@/lib/supabase/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { execOnDevServer, isProduction, hasDevServer } from '@/lib/dev-server-client';

const execAsync = promisify(exec);

/**
 * 🖥️ TERMINAL API - Execute commands from AI Design Studio
 * 
 * MODES:
 * 1. LOCAL: Execute directly on filesystem
 * 2. PRODUCTION: Forward to Dev Server (Railway) if configured
 * 
 * SUPPORTED COMMANDS:
 * - npm install / pnpm install
 * - npm run build / npm run dev
 * - git commands
 * - File operations (mkdir, rm, mv, cp)
 */

// Whitelist of allowed commands
const ALLOWED_COMMANDS = [
    /^(npm|pnpm|yarn)\s+(install|ci)$/i,
    /^(npm|pnpm|yarn)\s+run\s+(build|lint|dev|start|typecheck|test)$/i,
    /^git\s+(status|log|diff|branch)$/i,
    /^(pwd|ls|dir)$/i,
    /^tsc\s+--(version|noEmit)$/i,
];

// Blocked patterns for security
const BLOCKED_PATTERNS = [
    /rm\s+-rf?\s+\//i,  // Prevent rm -rf /
    /\|\s*sh/i,          // Prevent piping to shell
    /;\s*rm/i,           // Prevent chained rm
    /&&\s*rm/i,          // Prevent chained rm
    /curl.*\|/i,         // Prevent curl pipe
    /wget.*\|/i,         // Prevent wget pipe
    /eval\s*\(/i,        // Prevent eval
    /`.*`/,              // Prevent backtick command substitution
    /\$\(/,              // Prevent $() command substitution
];

function isCommandAllowed(command: string): { allowed: boolean; reason?: string } {
    if (/[\r\n;&|<>`$()]/.test(command)) {
        return { allowed: false, reason: 'Karakter shell yang dapat menggabungkan perintah tidak diizinkan' };
    }

    // Check blocked patterns first
    for (const pattern of BLOCKED_PATTERNS) {
        if (pattern.test(command)) {
            return { allowed: false, reason: 'Command contains blocked pattern for security' };
        }
    }
    
    // Check if command matches allowed patterns
    for (const pattern of ALLOWED_COMMANDS) {
        if (pattern.test(command.trim())) {
            return { allowed: true };
        }
    }
    
    return { allowed: false, reason: 'Command not in allowed list. Allowed: npm, pnpm, yarn, git, mkdir, npx' };
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Login diperlukan' }, { status: 401 });
        }
        if (await fetchUserRole(session.user.id) !== 'super_admin') {
            return NextResponse.json({ success: false, error: 'Akses super admin diperlukan' }, { status: 403 });
        }

        const body = await request.json();
        const { command, cwd } = body;
        
        if (!command || typeof command !== 'string') {
            return NextResponse.json({
                success: false,
                error: 'Command is required'
            }, { status: 400 });
        }
        
        // Validate before forwarding to the remote service too.
        const check = isCommandAllowed(command);
        if (!check.allowed) {
            return NextResponse.json({ success: false, error: check.reason }, { status: 403 });
        }

        const workspaceRoot = process.cwd();
        const workingDir = cwd ? path.resolve(workspaceRoot, cwd) : workspaceRoot;
        const relativeDir = path.relative(workspaceRoot, workingDir);
        if (relativeDir.startsWith('..') || path.isAbsolute(relativeDir)) {
            return NextResponse.json({ success: false, error: 'Direktori kerja tidak valid' }, { status: 400 });
        }

        // ═══════════════════════════════════════════════════════════════════
        // 🌐 PRODUCTION MODE: Forward to Dev Server
        // ═══════════════════════════════════════════════════════════════════
        if (isProduction) {
            if (!hasDevServer) {
                return NextResponse.json({
                    success: false,
                    error: '⚠️ Terminal commands require Dev Server.\n\nDev Server belum dikonfigurasi.\n\n💡 Setup Dev Server:\n1. Deploy dev-server/ ke Railway\n2. Set DEV_SERVER_URL dan DEV_SERVER_TOKEN di Vercel',
                    isProduction: true,
                    hint: 'Run commands locally, or setup Dev Server'
                }, { status: 200 });
            }
            
            console.log(`[Terminal API] Forwarding to Dev Server`);
            const result = await execOnDevServer(command, relativeDir || undefined);
            return NextResponse.json(result);
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // 💻 LOCAL MODE: Execute directly
        // ═══════════════════════════════════════════════════════════════════
        
        console.log(`[Terminal API] Executing: ${command}`);
        console.log(`[Terminal API] Working dir: ${workingDir}`);
        
        try {
            const { stdout, stderr } = await execAsync(command, {
                cwd: workingDir,
                timeout: 120000, // 2 minute timeout
                maxBuffer: 1024 * 1024 * 10, // 10MB buffer
                env: { ...process.env, FORCE_COLOR: '0' }
            });
            
            console.log(`[Terminal API] Success`);
            
            return NextResponse.json({
                success: true,
                command,
                output: stdout || stderr,
                stdout,
                stderr,
                cwd: workingDir
            });
            
        } catch (execError: any) {
            console.error(`[Terminal API] Exec error:`, execError.message);
            
            return NextResponse.json({
                success: false,
                command,
                error: execError.message,
                stdout: execError.stdout || '',
                stderr: execError.stderr || '',
                code: execError.code,
                killed: execError.killed
            }, { status: 200 }); // Return 200 so error can be shown to user
        }
        
    } catch (error) {
        console.error('[Terminal API] Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Login diperlukan' }, { status: 401 });
    }
    if (await fetchUserRole(session.user.id) !== 'super_admin') {
        return NextResponse.json({ error: 'Akses super admin diperlukan' }, { status: 403 });
    }
    return NextResponse.json({
        status: 'ok',
        version: '1.0.0',
        allowed_commands: [
            'npm install <package>',
            'npm run <script>',
            'pnpm add/install <package>',
            'yarn add/install <package>',
            'git status/add/commit/push/pull',
            'npx <command>',
            'mkdir <directory>',
            'tsc --version'
        ],
        security: 'Commands are restricted to safe operations only'
    });
}
