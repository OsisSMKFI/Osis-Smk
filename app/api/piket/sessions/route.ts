import { createHash, randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getPiketActor, jakartaDateKey, jakartaEndOfDay, PIKET_GENERATE_ROLES } from '@/lib/piket';
import { getTrustedAppBaseUrl } from '@/lib/trustedOrigin';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const actor = await getPiketActor();
  if (!actor) return NextResponse.json({ error: 'Login diperlukan' }, { status: 401 });
  if (!PIKET_GENERATE_ROLES.includes(actor.role as (typeof PIKET_GENERATE_ROLES)[number])) {
    return NextResponse.json({ error: 'Fitur generate QR hanya untuk role OSIS, admin, dan super admin' }, { status: 403 });
  }

  try {
    const token = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const reportDate = jakartaDateKey();
    const expiresAt = jakartaEndOfDay(reportDate);
    const { data, error } = await supabaseAdmin.rpc('generate_piket_session', {
      p_created_by: actor.id,
      p_token_hash: tokenHash,
      p_expires_at: expiresAt.toISOString(),
    });
    if (error) {
      if (error.code === '55000') {
        return NextResponse.json({ error: 'Rekap hari ini sudah disetujui guru. QR baru tidak dapat dibuat.' }, { status: 409 });
      }
      console.error('[piket] QR session generation failed', error.code);
      return NextResponse.json({ error: 'QR belum dapat dibuat. Pastikan migrasi Piket sudah diterapkan.' }, { status: 500 });
    }

    const origin = getTrustedAppBaseUrl(request);
    const row = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({
      success: true,
      sessionId: row?.id,
      reportDate: row?.report_date || reportDate,
      expiresAt: row?.expires_at || expiresAt.toISOString(),
      url: `${origin}/piket/${token}`,
    });
  } catch (error) {
    console.error('[piket] QR session generation failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Terjadi kesalahan saat membuat QR.' }, { status: 500 });
  }
}
