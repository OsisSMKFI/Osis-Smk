import { NextRequest, NextResponse } from 'next/server';
import { checkDevServerHealth, isProduction, hasDevServer } from '@/lib/dev-server-client';

/**
 * 🌐 DEV SERVER STATUS API
 * Check if Dev Server is available and online
 */

export async function GET(request: NextRequest) {
    try {
        const health = await checkDevServerHealth();
        
        return NextResponse.json({
            success: true,
            isProduction,
            hasDevServer,
            devServerOnline: health.online,
            message: health.message,
            capabilities: hasDevServer ? {
                terminal: true,
                fileEdit: true,
                npm: true,
                git: true,
                gitPush: true
            } : {
                terminal: false,
                fileEdit: !isProduction,
                npm: false,
                git: false,
                gitPush: false
            }
        });
        
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message,
            isProduction,
            hasDevServer: false
        }, { status: 500 });
    }
}
