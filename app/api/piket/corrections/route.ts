import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getPiketActor, isDateKey, jakartaDateKey, PIKET_VIEW_ROLES } from '@/lib/piket';

export const runtime = 'nodejs';

async function getAuthorizedActor() {
  const actor = await getPiketActor();
  if (!actor) return { actor: null, response: NextResponse.json({ error: 'Login diperlukan' }, { status: 401 }) };
  if (!PIKET_VIEW_ROLES.includes(actor.role as (typeof PIKET_VIEW_ROLES)[number])) {
    return { actor: null, response: NextResponse.json({ error: 'Role ini tidak dapat melihat keluhan Piket' }, { status: 403 }) };
  }
  return { actor, response: null };
}

export async function GET(request: NextRequest) {
  const { response } = await getAuthorizedActor();
  if (response) return response;
  const date = request.nextUrl.searchParams.get('date') || jakartaDateKey();
  const allDates = date === 'all';
  if (!allDates && !isDateKey(date)) return NextResponse.json({ error: 'Format tanggal tidak valid' }, { status: 400 });
  let query = supabaseAdmin.from('piket_data_corrections')
    .select('id,report_date,student_name,student_unit,student_class,details,suggested_name,suggested_unit,suggested_class,status,submitted_at')
    .order('submitted_at', { ascending: false }).range(0, 9999);
  if (!allDates) query = query.eq('report_date', date);
  const { data, error } = await query;
  if (error) {
    console.error('[piket] Correction list failed', error.code);
    return NextResponse.json({ error: 'Daftar keluhan belum tersedia. Pastikan migrasi terbaru sudah diterapkan.' }, { status: 500 });
  }
  return NextResponse.json({ corrections: data || [], date, allDates });
}

export async function PATCH(request: NextRequest) {
  const { actor, response } = await getAuthorizedActor();
  if (response) return response;
  if (!actor || !['admin', 'super_admin'].includes(actor.role)) {
    return NextResponse.json({ error: 'Perubahan status keluhan hanya dapat dilakukan Admin.' }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (typeof body?.id !== 'string' || !['resolved', 'dismissed', 'pending'].includes(body?.status)) {
    return NextResponse.json({ error: 'Data perubahan status tidak valid.' }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin.from('piket_data_corrections')
    .update({
      status: body.status,
      reviewed_by: actor.id,
      reviewed_at: body.status === 'pending' ? null : new Date().toISOString(),
    })
    .eq('id', body.id)
    .select('id,status')
    .maybeSingle();
  if (error || !data) {
    console.error('[piket] Correction update failed', error?.code);
    return NextResponse.json({ error: 'Status keluhan gagal diperbarui.' }, { status: 500 });
  }
  return NextResponse.json({ correction: data });
}
