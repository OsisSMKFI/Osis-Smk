// ═══════════════════════════════════════════════════════════════════════════
// 🌐 DEV SERVER CLIENT - Connect to Railway Dev Server from Vercel
// ═══════════════════════════════════════════════════════════════════════════

const DEV_SERVER_URL = process.env.DEV_SERVER_URL;
const DEV_SERVER_TOKEN = process.env.DEV_SERVER_TOKEN;

export const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
export const hasDevServer = !!(DEV_SERVER_URL && DEV_SERVER_TOKEN);

interface DevServerResponse {
    success: boolean;
    error?: string;
    stdout?: string;
    stderr?: string;
    output?: string;
    [key: string]: any;
}

/**
 * Execute a command on the Dev Server
 */
export async function execOnDevServer(command: string, cwd?: string): Promise<DevServerResponse> {
    if (!DEV_SERVER_URL || !DEV_SERVER_TOKEN) {
        return {
            success: false,
            error: '⚠️ Dev Server belum dikonfigurasi.\n\nSet DEV_SERVER_URL dan DEV_SERVER_TOKEN di Vercel.'
        };
    }
    
    try {
        console.log(`[DevServer] Executing: ${command}`);
        
        const res = await fetch(`${DEV_SERVER_URL}/api/exec`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': DEV_SERVER_TOKEN
            },
            body: JSON.stringify({ command, cwd })
        });
        
        const data = await res.json();
        return {
            ...data,
            source: 'dev-server'
        };
        
    } catch (err) {
        console.error('[DevServer] Error:', err);
        return {
            success: false,
            error: `Dev Server error: ${err instanceof Error ? err.message : 'Unknown error'}`
        };
    }
}

/**
 * NPM operations on Dev Server
 */
export async function npmOnDevServer(
    action: 'install' | 'uninstall' | 'update' | 'list',
    packages?: string[]
): Promise<DevServerResponse> {
    if (!DEV_SERVER_URL || !DEV_SERVER_TOKEN) {
        return {
            success: false,
            error: '⚠️ Dev Server belum dikonfigurasi.'
        };
    }
    
    try {
        const res = await fetch(`${DEV_SERVER_URL}/api/npm`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': DEV_SERVER_TOKEN
            },
            body: JSON.stringify({ action, packages })
        });
        
        return await res.json();
        
    } catch (err) {
        return {
            success: false,
            error: `NPM error: ${err instanceof Error ? err.message : 'Unknown error'}`
        };
    }
}

/**
 * Git operations on Dev Server
 */
export async function gitOnDevServer(
    action: 'status' | 'add' | 'commit' | 'push' | 'pull' | 'log' | 'diff' | 'commit-push',
    options?: { message?: string; files?: string[]; branch?: string }
): Promise<DevServerResponse> {
    if (!DEV_SERVER_URL || !DEV_SERVER_TOKEN) {
        return {
            success: false,
            error: '⚠️ Dev Server belum dikonfigurasi.'
        };
    }
    
    try {
        const res = await fetch(`${DEV_SERVER_URL}/api/git`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': DEV_SERVER_TOKEN
            },
            body: JSON.stringify({ action, ...options })
        });
        
        return await res.json();
        
    } catch (err) {
        return {
            success: false,
            error: `Git error: ${err instanceof Error ? err.message : 'Unknown error'}`
        };
    }
}

/**
 * File operations on Dev Server
 */
export async function fileOnDevServer(
    action: 'read' | 'write' | 'delete' | 'exists',
    filePath: string,
    content?: string
): Promise<DevServerResponse> {
    if (!DEV_SERVER_URL || !DEV_SERVER_TOKEN) {
        return {
            success: false,
            error: '⚠️ Dev Server belum dikonfigurasi.'
        };
    }
    
    try {
        const res = await fetch(`${DEV_SERVER_URL}/api/file`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': DEV_SERVER_TOKEN
            },
            body: JSON.stringify({ action, filePath, content })
        });
        
        return await res.json();
        
    } catch (err) {
        return {
            success: false,
            error: `File error: ${err instanceof Error ? err.message : 'Unknown error'}`
        };
    }
}

/**
 * Check Dev Server health
 */
export async function checkDevServerHealth(): Promise<{ online: boolean; message: string }> {
    if (!DEV_SERVER_URL) {
        return { online: false, message: 'DEV_SERVER_URL not configured' };
    }
    
    try {
        const res = await fetch(`${DEV_SERVER_URL}/health`, {
            method: 'GET',
            headers: { 'x-auth-token': DEV_SERVER_TOKEN || '' }
        });
        
        if (res.ok) {
            const data = await res.json();
            return { online: true, message: `Dev Server online: ${data.status}` };
        }
        
        return { online: false, message: `Dev Server returned ${res.status}` };
        
    } catch (err) {
        return { 
            online: false, 
            message: `Cannot reach Dev Server: ${err instanceof Error ? err.message : 'Unknown error'}` 
        };
    }
}
