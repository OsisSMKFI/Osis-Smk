import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getPiketActor } from '@/lib/piket';

export const runtime = 'nodejs';

async function requireRosterAdmin() {
  const actor = await getPiketActor();
  if (!actor) return { actor: null, response: NextResponse.json({ error: 'Login Admin diperlukan.' }, { status: 401 }) };
  if (!['admin', 'super_admin'].includes(actor.role)) {
    return { actor: null, response: NextResponse.json({ error: 'Roster siswa hanya dapat dikelola Admin.' }, { status: 403 }) };
  }
  return { actor, response: null };
}

function clean(value: unknown, maxLength: number) {
  const normalized = typeof value === 'string' ? value.normalize('NFC').trim() : '';
  return normalized.length <= maxLength ? normalized : '';
}

function validateRow(value: unknown) {
  const row = value as Record<string, unknown>;
  const aliases = typeof row?.name_aliases === 'string'
    ? row.name_aliases.split(/[;,|]/).map((alias) => clean(alias, 120)).filter(Boolean)
    : Array.isArray(row?.name_aliases) ? row.name_aliases.map((alias: unknown) => clean(alias, 120)).filter(Boolean) : [];
  const normalized = {
    no_induk: clean(row?.no_induk, 40),
    name: clean(row?.name, 120),
    unit_sekolah: clean(row?.unit_sekolah, 80),
    kelas: clean(row?.kelas, 40),
    name_aliases: Array.from(new Set(aliases)).slice(0, 10),
    is_active: row?.is_active === undefined ? true : row.is_active === true,
  };
  if (!normalized.no_induk || !normalized.name || !normalized.unit_sekolah || !normalized.kelas) return null;
  return normalized;
}

export async function GET() {
  const { response } = await requireRosterAdmin();
  if (response) return response;
  const { data, error } = await supabaseAdmin.from('piket_student_roster')
    .select('id,no_induk,name,unit_sekolah,kelas,name_aliases,is_active,student_user_id,updated_at')
    .order('unit_sekolah').order('kelas').order('name');
  if (error) {
    console.error('[piket] Roster load failed', error.code);
    return NextResponse.json({ error: 'Roster belum dapat dimuat. Pastikan migrasi terbaru sudah diterapkan.' }, { status: 500 });
  }
  return NextResponse.json({ students: (data || []).map(({ student_user_id, ...student }) => ({ ...student, has_account: !!student_user_id })) });
}

export async function POST(request: NextRequest) {
  const { response } = await requireRosterAdmin();
  if (response) return response;
  const body = await request.json().catch(() => null);
  if (!Array.isArray(body?.students) || body.students.length < 1 || body.students.length > 1000) {
    return NextResponse.json({ error: 'Kirim antara 1 dan 1000 baris data roster.' }, { status: 400 });
  }
  const students = body.students.map(validateRow);
  if (students.some((student: unknown) => !student)) {
    return NextResponse.json({ error: 'Setiap baris wajib memiliki No Induk, nama, unit sekolah, dan kelas.' }, { status: 400 });
  }
  const seenKeys = new Set<string>();
  for (const student of students as NonNullable<ReturnType<typeof validateRow>>[]) {
    const key = JSON.stringify([student.no_induk, student.unit_sekolah]);
    if (seenKeys.has(key)) return NextResponse.json({ error: `No Induk ${student.no_induk} muncul lebih dari sekali pada unit yang sama.` }, { status: 400 });
    seenKeys.add(key);
  }

  const { data, error } = await supabaseAdmin.from('piket_student_roster')
    .upsert(students, { onConflict: 'no_induk,unit_sekolah' })
    .select('id');
  if (error) {
    console.error('[piket] Roster import failed', error.code);
    const status = error.code === '23505' ? 409 : 500;
    return NextResponse.json({ error: status === 409 ? 'Data bertabrakan dengan No Induk yang sudah terdaftar.' : 'Data roster gagal disimpan.' }, { status });
  }
  return NextResponse.json({ success: true, count: data?.length || 0 });
}

export async function PATCH(request: NextRequest) {
  const { response } = await requireRosterAdmin();
  if (response) return response;
  const body = await request.json().catch(() => null);
  if (typeof body?.id !== 'string') return NextResponse.json({ error: 'ID data roster tidak valid.' }, { status: 400 });

  if (typeof body.is_active === 'boolean') {
    const { data, error } = await supabaseAdmin.from('piket_student_roster')
      .update({ is_active: body.is_active }).eq('id', body.id).select('id,is_active').maybeSingle();
    if (error || !data) return NextResponse.json({ error: 'Status roster gagal diperbarui.' }, { status: 500 });
    return NextResponse.json({ student: data });
  }

  const student = validateRow(body);
  if (!student) return NextResponse.json({ error: 'No Induk, nama, unit sekolah, dan kelas wajib diisi.' }, { status: 400 });
  const { data, error } = await supabaseAdmin.from('piket_student_roster')
    .update({
      no_induk: student.no_induk,
      name: student.name,
      unit_sekolah: student.unit_sekolah,
      kelas: student.kelas,
      name_aliases: student.name_aliases,
    }).eq('id', body.id)
    .select('id,no_induk,name,unit_sekolah,kelas,name_aliases,is_active,student_user_id,updated_at').maybeSingle();
  if (error || !data) {
    console.error('[piket] Roster edit failed', error?.code);
    return NextResponse.json({ error: error?.code === '23505' ? 'No Induk ini sudah tercatat pada unit tersebut.' : 'Data roster gagal diperbarui.' }, { status: error?.code === '23505' ? 409 : 500 });
  }
  const { student_user_id, ...result } = data;
  return NextResponse.json({ student: { ...result, has_account: !!student_user_id } });
}
