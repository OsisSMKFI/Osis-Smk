import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getIdentifier } from '@/lib/rateLimitRedis';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ token: string }> };

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

async function findActiveSession(token: string) {
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) return null;
  const { data, error } = await supabaseAdmin
    .from('piket_sessions')
    .select('id,report_date,expires_at,is_active')
    .eq('token_hash', hashToken(token))
    .eq('is_active', true)
    .maybeSingle();
  if (error || !data || new Date(data.expires_at).getTime() <= Date.now()) return null;
  return data;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { token } = await params;
  const ipLimit = await checkRateLimit(request, getIdentifier(request), { limit: 60, windowMs: 60_000 }, 'piket-token-lookup');
  if (!ipLimit.allowed) return NextResponse.json({ error: 'Terlalu banyak percobaan. Coba lagi sebentar.' }, { status: 429 });
  const session = await findActiveSession(token);
  if (!session) return NextResponse.json({ error: 'Tautan QR tidak aktif atau sudah kedaluwarsa.' }, { status: 404 });
  return NextResponse.json({ reportDate: session.report_date, expiresAt: session.expires_at });
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { token } = await params;
  const ip = getIdentifier(request);
  const ipLimit = await checkRateLimit(request, ip, { limit: 15, windowMs: 60_000 }, 'piket-submit-ip');
  if (!ipLimit.allowed) {
    return NextResponse.json({ error: 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.' }, { status: 429 });
  }
  const session = await findActiveSession(token);
  if (!session) return NextResponse.json({ error: 'Tautan QR tidak aktif atau sudah kedaluwarsa.' }, { status: 404 });
  const tokenLimit = await checkRateLimit(request, hashToken(token), { limit: 10, windowMs: 60_000 }, 'piket-submit-token');
  if (!tokenLimit.allowed) return NextResponse.json({ error: 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.' }, { status: 429 });

  try {
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > 4096) return NextResponse.json({ error: 'Data formulir terlalu besar.' }, { status: 413 });
    const body = await request.json();
    const nisn = typeof body?.nisn === 'string' ? body.nisn.trim() : '';
    const name = typeof body?.name === 'string' ? body.name.normalize('NFC').trim() : '';
    const studentClass = typeof body?.kelas === 'string' ? body.kelas.normalize('NFC').trim() : '';
    if (!nisn || !name || !studentClass || nisn.length > 32 || name.length > 120 || studentClass.length > 40) {
      return NextResponse.json({ error: 'Nama, kelas, dan NISN wajib diisi dengan benar.' }, { status: 400 });
    }

    const { data: candidates, error: userError } = await supabaseAdmin
      .from('users')
      .select('id,name,kelas')
      .eq('role', 'siswa')
      .eq('approved', true)
      .eq('nisn', nisn)
      .limit(2);
    if (userError || !candidates || candidates.length !== 1) {
      return NextResponse.json({ error: 'Data siswa tidak cocok. Periksa nama, kelas, dan NISN.' }, { status: 400 });
    }

    const student = candidates[0];
    const normalize = (value: string | null | undefined) => (value || '').normalize('NFC').trim().toLocaleLowerCase('id-ID');
    if (normalize(student.name) !== normalize(name) || normalize(student.kelas) !== normalize(studentClass)) {
      return NextResponse.json({ error: 'Data siswa tidak cocok. Periksa nama, kelas, dan NISN.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.rpc('submit_piket_late_report', {
      p_token_hash: hashToken(token),
      p_student_user_id: student.id,
      p_student_name: student.name,
      p_student_class: student.kelas,
    });
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Laporan untuk siswa ini sudah tercatat hari ini.' }, { status: 409 });
      }
      if (error.code === '28000') {
        return NextResponse.json({ error: 'Tautan QR tidak aktif atau sudah kedaluwarsa.' }, { status: 404 });
      }
      if (error.code === '55000') {
        return NextResponse.json({ error: 'Rekap hari ini sudah disetujui guru.' }, { status: 409 });
      }
      console.error('[piket] Submission failed', error.code);
      return NextResponse.json({ error: 'Laporan belum dapat disimpan. Silakan coba lagi.' }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: 'Data keterlambatan berhasil dikirim.' });
  } catch (error) {
    console.error('[piket] Invalid public submission', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Data formulir tidak valid.' }, { status: 400 });
  }
}
