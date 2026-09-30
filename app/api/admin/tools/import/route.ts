import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiAuth';

export async function POST(req: NextRequest) {
  const authErr = await requirePermission('tools:access');
  if (authErr) return authErr;

  try {
    // In a real implementation, parse multipart/form-data and import records.
    return NextResponse.json({ success: true, message: 'Import accepted (no-op in dev)' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Import failed' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';