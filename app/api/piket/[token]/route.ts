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
    const action = body?.action === 'lookup' ? 'lookup' : 'submit';
    const name = typeof body?.name === 'string' ? body.name.normalize('NFC').trim() : '';
    const unit = typeof body?.unit === 'string' ? body.unit.normalize('NFC').trim() : '';
    const studentClass = typeof body?.kelas === 'string' ? body.kelas.normalize('NFC').trim() : '';
    if (!name || name.length > 120 || unit.length > 80 || studentClass.length > 40) {
      return NextResponse.json({ error: 'Nama wajib diisi dan panjang data tidak boleh melebihi batas.' }, { status: 400 });
    }
    if (action === 'submit' && (!unit || !studentClass)) {
      return NextResponse.json({ error: 'Periksa nama dan data sekolah sebelum mengirim.' }, { status: 400 });
    }

    let query = supabaseAdmin
      .from('piket_student_roster')
      .select('id,name,unit_sekolah,kelas,no_induk')
      .eq('is_active', true)
      .eq('name', name)
      .limit(11);
    if (unit) query = query.eq('unit_sekolah', unit);
    if (studentClass) query = query.eq('kelas', studentClass);
    const { data: candidates, error: userError } = await query;
    if (userError) {
      console.error('[piket] Student lookup failed', userError.code);
      return NextResponse.json({ error: 'Data siswa belum dapat diperiksa.' }, { status: 500 });
    }
    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ error: 'Data tidak ditemukan. Periksa ejaan nama, unit sekolah, dan kelas. Jika masih tidak cocok, ajukan koreksi kepada petugas.' }, { status: 404 });
    }
    if (candidates.length !== 1) {
      if (action === 'lookup' && candidates.length <= 10) {
        const options = Array.from(new Map(candidates.map((candidate) => {
          const option = { unit: candidate.unit_sekolah, kelas: candidate.kelas };
          return [`${option.unit || ''}\u0000${option.kelas || ''}`, option];
        })).values());
        if (options.length > 1) return NextResponse.json({ candidates: options });
      }
      return NextResponse.json({ error: 'Ada lebih dari satu data dengan identitas tersebut. Minta petugas OSIS membantu mencocokkan data.' }, { status: 409 });
    }

    const student = candidates[0];
    const normalize = (value: string | null | undefined) => (value || '').normalize('NFC').trim().toLocaleLowerCase('id-ID');
    if (action === 'lookup' && (!unit || !studentClass)) {
      if (!student.no_induk?.trim() || !student.unit_sekolah?.trim() || !student.kelas?.trim()) {
        return NextResponse.json({ error: 'Data sekolah belum lengkap. Ajukan keluhan agar Admin memperbaikinya.' }, { status: 400 });
      }
      return NextResponse.json({ student: { name: student.name, unit: student.unit_sekolah, kelas: student.kelas } });
    }
    if (!student.no_induk?.trim() || normalize(student.name) !== normalize(name) || normalize(student.unit_sekolah) !== normalize(unit) || normalize(student.kelas) !== normalize(studentClass)) {
      return NextResponse.json({ error: 'Data belum lengkap atau tidak cocok. Periksa kembali nama, unit sekolah, dan kelas, atau ajukan koreksi kepada petugas.' }, { status: 400 });
    }

    if (action === 'lookup') {
      return NextResponse.json({ student: { name: student.name, unit: student.unit_sekolah, kelas: student.kelas } });
    }

    const { error } = await supabaseAdmin.rpc('submit_piket_late_report', {
      p_token_hash: hashToken(token),
      p_student_roster_id: student.id,
      p_student_name: student.name,
      p_student_unit: student.unit_sekolah,
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
