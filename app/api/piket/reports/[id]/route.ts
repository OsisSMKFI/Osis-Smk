import { NextRequest, NextResponse } from 'next/server';
import { getPiketActor } from '@/lib/piket';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';
type RouteContext = { params: Promise<{ id: string }> };
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function authorizedAdmin() {
  const actor = await getPiketActor();
  if (!actor) return { actor: null, response: NextResponse.json({ error: 'Login Admin diperlukan.' }, { status: 401 }) };
  if (!['admin', 'super_admin'].includes(actor.role)) {
    return { actor: null, response: NextResponse.json({ error: 'Hanya Admin yang dapat mengubah laporan.' }, { status: 403 }) };
  }
  return { actor, response: null };
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { actor, response } = await authorizedAdmin();
  if (response) return response;
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return NextResponse.json({ error: 'ID laporan tidak valid.' }, { status: 400 });
  const body = await request.json().catch(() => null);
  const clean = (value: unknown, maxLength: number) => typeof value === 'string' ? value.normalize('NFC').trim().slice(0, maxLength) : null;
  const reason = clean(body?.reason, 500);
  const name = clean(body?.student_name, 120);
  const noInduk = clean(body?.student_no_induk, 40);
  const unit = clean(body?.student_unit, 80);
  const studentClass = clean(body?.student_class, 40);
  if ([reason, name, unit, studentClass].some((value) => value === null)) {
    return NextResponse.json({ error: 'Nama, unit sekolah, kelas, dan alasan wajib dikirim saat mengedit.' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.rpc('admin_manage_piket_report', {
    p_report_id: id, p_actor_id: actor!.id, p_action: 'edit', p_reason: reason,
    p_student_name: name, p_student_no_induk: noInduk,
    p_student_unit: unit, p_student_class: studentClass,
  });
  if (error) {
    console.error('[piket] Report edit failed', error.code);
    const status = error.code === '42501' ? 403 : error.code === 'P0002' ? 404 : 500;
    return NextResponse.json({ error: error.code === 'P0002' ? 'Laporan tidak ditemukan atau sudah dihapus.' : 'Laporan gagal diperbarui.' }, { status });
  }
  return NextResponse.json({ success: true, report: Array.isArray(data) ? data[0] : data });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { actor, response } = await authorizedAdmin();
  if (response) return response;
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) return NextResponse.json({ error: 'ID laporan tidak valid.' }, { status: 400 });
  const { data, error } = await supabaseAdmin.rpc('admin_manage_piket_report', {
    p_report_id: id, p_actor_id: actor!.id, p_action: 'delete', p_reason: null,
    p_student_name: null, p_student_no_induk: null, p_student_unit: null, p_student_class: null,
  });
  if (error) {
    console.error('[piket] Report delete failed', error.code);
    const status = error.code === '42501' ? 403 : error.code === 'P0002' ? 404 : 500;
    return NextResponse.json({ error: error.code === 'P0002' ? 'Laporan tidak ditemukan atau sudah dihapus.' : 'Laporan gagal dihapus.' }, { status });
  }
  return NextResponse.json({ success: true, report: Array.isArray(data) ? data[0] : data });
}
