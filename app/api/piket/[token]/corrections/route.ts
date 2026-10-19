import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getIdentifier } from '@/lib/rateLimitRedis';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';
type RouteContext = { params: Promise<{ token: string }> };

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { token } = await params;
  const ipLimit = await checkRateLimit(request, getIdentifier(request), { limit: 5, windowMs: 60_000 }, 'piket-correction-ip');
  if (!ipLimit.allowed) return NextResponse.json({ error: 'Terlalu banyak percobaan. Coba lagi sebentar.' }, { status: 429 });
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return NextResponse.json({ error: 'Tautan QR tidak aktif.' }, { status: 404 });
  const tokenHash = hashToken(token);
  const { data: session } = await supabaseAdmin
    .from('piket_sessions').select('id,report_date,expires_at,is_active')
    .eq('token_hash', tokenHash).eq('is_active', true).maybeSingle();
  if (!session || new Date(session.expires_at).getTime() <= Date.now()) {
    return NextResponse.json({ error: 'Tautan QR tidak aktif atau sudah kedaluwarsa.' }, { status: 404 });
  }

  try {
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > 4096) return NextResponse.json({ error: 'Data formulir terlalu besar.' }, { status: 413 });
    const body = await request.json();
    const clean = (value: unknown, maxLength: number) => typeof value === 'string' ? value.normalize('NFC').trim().slice(0, maxLength) : '';
    const studentName = clean(body?.name, 120);
    const unit = clean(body?.unit, 80);
    const studentClass = clean(body?.kelas, 40);
    const details = clean(body?.details, 1000);
    const suggestedName = clean(body?.suggestedName, 120) || null;
    const suggestedUnit = clean(body?.suggestedUnit, 80) || null;
    const suggestedClass = clean(body?.suggestedClass, 40) || null;
    if (!studentName || !unit || !studentClass || !details) {
      return NextResponse.json({ error: 'Nama, unit sekolah, kelas, dan penjelasan keluhan wajib diisi.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from('piket_data_corrections').insert({
      session_id: session.id,
      report_date: session.report_date,
      student_name: studentName,
      student_unit: unit,
      student_class: studentClass,
      details,
      suggested_name: suggestedName,
      suggested_unit: suggestedUnit,
      suggested_class: suggestedClass,
    });
    if (error) {
      console.error('[piket] Correction submission failed', error.code);
      return NextResponse.json({ error: 'Keluhan belum dapat disimpan.' }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: 'Keluhan terkirim kepada petugas.' });
  } catch {
    return NextResponse.json({ error: 'Data keluhan tidak valid.' }, { status: 400 });
  }
}
