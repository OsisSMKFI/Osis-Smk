import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { exec } from 'child_process';
import { promisify } from 'util';
import { execOnDevServer, isProduction, hasDevServer } from '@/lib/dev-server-client';

const execAsync = promisify(exec);

const ALLOWED_COMMANDS: Record<string, string> = {
  'npm-install': 'npm install',
  'npm-build': 'npm run build',
  'npm-dev': 'npm run dev',
  'npm-lint': 'npm run lint',
  'git-status': 'git status',
  'git-pull': 'git pull',
  'git-log': 'git log --oneline -10',
  'git-diff': 'git diff --stat',
  'git-push': 'git push',
};

// Allowed patterns for raw commands
const ALLOWED_RAW_PATTERNS = [
  /^npm\s+(install|add|remove|uninstall|update|run|list)/i,
  /^git\s+(status|log|diff|add|commit|push|pull|branch|checkout|stash)/i,
  /^(mkdir|touch|cat|ls|pwd)/i,
];

// Blocked patterns
const BLOCKED_PATTERNS = [
  /rm\s+-rf\s+\//i,
  /\|\s*sh/i,
  /;\s*rm/i,
  /curl.*\|/i,
  /wget.*\|/i,
  /eval\s*\(/i,
];

function isRawCommandAllowed(cmd: string): boolean {
  // Check blocked first
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(cmd)) return false;
  }
  // Check allowed
  for (const pattern of ALLOWED_RAW_PATTERNS) {
    if (pattern.test(cmd.trim())) return true;
  }
  return false;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const role = ((session.user as any)?.role || '').toLowerCase();
    if (!['super_admin', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      allowed: Object.keys(ALLOWED_COMMANDS),
      unsafeAllowed: process.env.ALLOW_ADMIN_OPS === 'true',
      isProduction,
      hasDevServer,
      message: isProduction 
        ? (hasDevServer ? 'Using Dev Server for commands' : 'Dev Server not configured')
        : 'Local execution enabled'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const role = ((session.user as any)?.role || '').toLowerCase();
    if (!['super_admin', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { id, raw, command } = body;
    
    // Determine the command to run
    let cmdToRun = '';
    
    if (id && ALLOWED_COMMANDS[id]) {
      cmdToRun = ALLOWED_COMMANDS[id];
    } else if (raw) {
      // Raw command requires ALLOW_ADMIN_OPS=true
      if (process.env.ALLOW_ADMIN_OPS !== 'true') {
        return NextResponse.json({ 
          error: 'Raw commands disabled. Set ALLOW_ADMIN_OPS=true' 
        }, { status: 403 });
      }
      
      // Verify token
      const token = request.headers.get('x-admin-ops-token');
      if (token !== process.env.ADMIN_OPS_TOKEN) {
        return NextResponse.json({ error: 'Invalid admin ops token' }, { status: 401 });
      }
      
      if (!isRawCommandAllowed(raw)) {
        return NextResponse.json({ 
          error: 'Command not in allowed patterns',
          hint: 'Allowed: npm, git, mkdir, touch, cat, ls, pwd'
        }, { status: 403 });
      }
      
      cmdToRun = raw;
    } else if (command) {
      // Direct command (from Design Studio)
      if (!isRawCommandAllowed(command)) {
        return NextResponse.json({ 
          error: 'Command not allowed',
          hint: 'Allowed: npm, git, mkdir, touch, cat, ls, pwd'
        }, { status: 403 });
      }
      cmdToRun = command;
    } else {
      return NextResponse.json({ 
        error: 'Command required. Use { id: "npm-install" } or { raw: "npm list" }' 
      }, { status: 400 });
    }

    console.log(`[Admin Terminal] Executing: ${cmdToRun}`);
    
    // ═══════════════════════════════════════════════════════════════════
    // 🌐 PRODUCTION: Forward to Dev Server
    // ═══════════════════════════════════════════════════════════════════
    if (isProduction) {
      if (!hasDevServer) {
        return NextResponse.json({
          success: false,
          error: '⚠️ Terminal memerlukan Dev Server.\n\nSetup Dev Server di Railway:\n1. Deploy dev-server/ folder\n2. Set DEV_SERVER_URL di Vercel',
          isProduction: true
        });
      }
      
      const result = await execOnDevServer(cmdToRun);
      return NextResponse.json(result);
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // 💻 LOCAL: Execute directly
    // ═══════════════════════════════════════════════════════════════════
    try {
      const { stdout, stderr } = await execAsync(cmdToRun, {
        cwd: process.cwd(),
        timeout: 120000,
        maxBuffer: 10 * 1024 * 1024
      });
      
      return NextResponse.json({
        success: true,
        command: cmdToRun,
        stdout,
        stderr,
        output: stdout || stderr
      });
      
    } catch (execErr: any) {
      return NextResponse.json({
        success: false,
        command: cmdToRun,
        error: execErr.message,
        stdout: execErr.stdout || '',
        stderr: execErr.stderr || ''
      });
    }
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
