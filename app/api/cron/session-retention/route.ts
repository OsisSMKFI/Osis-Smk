import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  if (!secret || supplied.length !== secret.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(secret))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { error, count } = await supabaseAdmin.from('app_sessions').delete({ count: 'exact' }).lt('created_at', cutoff);
  if (error) return NextResponse.json({ error: 'Retensi sesi gagal dijalankan.' }, { status: 500 });
  return NextResponse.json({ success: true, deleted: count || 0, cutoff });
}
