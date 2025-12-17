import { NextRequest, NextResponse } from 'next/server';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';

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

// Check if we're in production (Vercel)
const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

// Dev Server configuration
const DEV_SERVER_URL = process.env.DEV_SERVER_URL;
const DEV_SERVER_TOKEN = process.env.DEV_SERVER_TOKEN;

// Whitelist of allowed commands
const ALLOWED_COMMANDS = [
    // Package managers
    /^(npm|pnpm|yarn)\s+(install|add|remove|uninstall|update|run|exec|init)/i,
    // Git commands
    /^git\s+(status|log|diff|add|commit|push|pull|branch|checkout|stash|merge)/i,
    // File operations (safe ones)
    /^(mkdir|touch|cat|head|tail|wc|ls|dir|pwd|cd)/i,
    // Build commands
    /^(npx|bunx)\s+/i,
    // TypeScript compiler
    /^(tsc|tsx)\s+/i,
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
        const body = await request.json();
        const { command, cwd } = body;
        
        if (!command || typeof command !== 'string') {
            return NextResponse.json({
                success: false,
                error: 'Command is required'
            }, { status: 400 });
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // 🌐 PRODUCTION MODE: Forward to Dev Server
        // ═══════════════════════════════════════════════════════════════════
        if (isProduction) {
            // Check if Dev Server is configured
            if (DEV_SERVER_URL && DEV_SERVER_TOKEN) {
                console.log(`[Terminal API] Forwarding to Dev Server: ${DEV_SERVER_URL}`);
                
                try {
                    const devRes = await fetch(`${DEV_SERVER_URL}/api/exec`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-auth-token': DEV_SERVER_TOKEN
                        },
                        body: JSON.stringify({ command, cwd })
                    });
                    
                    const devData = await devRes.json();
                    
                    return NextResponse.json({
                        ...devData,
                        source: 'dev-server'
                    });
                    
                } catch (devErr) {
                    console.error('[Terminal API] Dev Server error:', devErr);
                    return NextResponse.json({
                        success: false,
                        error: `Dev Server error: ${devErr instanceof Error ? devErr.message : 'Unknown error'}`,
                        hint: 'Make sure Dev Server is running on Railway'
                    }, { status: 200 });
                }
            }
            
            // No Dev Server configured
            return NextResponse.json({
                success: false,
                error: '⚠️ Terminal commands require Dev Server.\n\nDev Server belum dikonfigurasi.\n\n💡 Setup Dev Server:\n1. Deploy dev-server/ ke Railway\n2. Set DEV_SERVER_URL dan DEV_SERVER_TOKEN di Vercel',
                isProduction: true,
                hint: 'Run commands locally, or setup Dev Server'
            }, { status: 200 });
        }
        
        // ═══════════════════════════════════════════════════════════════════
        // 💻 LOCAL MODE: Execute directly
        // ═══════════════════════════════════════════════════════════════════
        
        // Check if command is allowed
        const check = isCommandAllowed(command);
        if (!check.allowed) {
            return NextResponse.json({
                success: false,
                error: check.reason,
                command,
                allowed_patterns: [
                    'npm install <package>',
                    'pnpm add <package>',
                    'npm run <script>',
                    'git status/add/commit/push',
                    'npx <command>',
                    'mkdir <directory>'
                ]
            }, { status: 403 });
        }
        
        const workspaceRoot = process.cwd();
        const workingDir = cwd ? `${workspaceRoot}/${cwd}` : workspaceRoot;
        
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
