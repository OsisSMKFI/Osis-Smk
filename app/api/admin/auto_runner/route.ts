import { NextRequest, NextResponse } from 'next/server';
import { getConfig, getConfigBoolean } from '@/lib/adminConfig';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('x-admin-ops-token');
    const expected = await getConfig('ADMIN_OPS_TOKEN');
    if (!expected) {
      return NextResponse.json(
        { ok: false, error: 'ADMIN_OPS_TOKEN not configured on server' },
        { status: 503 }
      );
    }
    if (!token || token !== expected) {
      return NextResponse.json(
        { ok: false, error: 'Invalid admin ops token' },
        { status: 401 }
      );
    }
    if (!(await getConfigBoolean('ALLOW_ADMIN_OPS'))) {
      return NextResponse.json(
        { ok: false, error: 'ALLOW_ADMIN_OPS is disabled' },
        { status: 403 }
      );
    }

    const processed = 0;
    return NextResponse.json({
      ok: true,
      processed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'auto_runner failed' },
      { status: 500 }
    );
  }
}
