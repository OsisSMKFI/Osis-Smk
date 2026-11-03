import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiAuth';
import { getMikrotikConfig } from '@/lib/mikrotikAPI';

/**
 * GET /api/admin/mikrotik/test
 *
 * Test Mikrotik connection. Super-admin only (uses stored router credentials).
 */
export async function GET(request: NextRequest) {
  try {
    const authErr = await requirePermission('settings:read');
    if (authErr) return authErr;

    console.log('[Mikrotik Test] Super admin testing connection');
    
    // Get config
    const config = await getMikrotikConfig();
    
    if (!config) {
      return NextResponse.json({
        success: false,
        connected: false,
        error: 'Mikrotik not configured',
        hint: 'Configure mikrotik_* settings in admin_settings'
      });
    }
    
    // Test connection by fetching devices
    const startTime = Date.now();
    
    try {
      const { getMikrotikConnectedDevices } = await import('@/lib/mikrotikAPI');
      const devices = await getMikrotikConnectedDevices(config);
      
      const duration = Date.now() - startTime;
      
      return NextResponse.json({
        success: true,
        connected: true,
        devices: devices.length,
        responseTime: duration + 'ms',
        config: {
          host: config.host,
          port: config.port,
          username: config.username,
          apiType: 'REST',
          timeout: config.timeout + 'ms'
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (connectionError: any) {
      const duration = Date.now() - startTime;
      
      return NextResponse.json({
        success: false,
        connected: false,
        error: connectionError.message,
        responseTime: duration + 'ms',
        config: {
          host: config.host,
          port: config.port,
          username: config.username
        },
        troubleshooting: [
          'Check if Mikrotik router is online',
          'Verify REST API is enabled (RouterOS 7.1+)',
          'Check IP address and port',
          'Verify username and password',
          'Check firewall rules allow API access'
        ]
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('[Mikrotik Test] Error:', error);
    
    return NextResponse.json({
      success: false,
      connected: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}
