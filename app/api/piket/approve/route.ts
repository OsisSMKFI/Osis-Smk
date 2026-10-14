import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getPiketActor, isDateKey } from '@/lib/piket';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const actor = await getPiketActor();
  if (!actor) return NextResponse.json({ error: 'Login diperlukan' }, { status: 401 });
  if (actor.role !== 'guru') {
    return NextResponse.json({ error: 'Persetujuan rekap harian hanya dapat dilakukan oleh role guru' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const reportDate = typeof body?.date === 'string' ? body.date : null;
    if (!isDateKey(reportDate)) return NextResponse.json({ error: 'Tanggal rekap tidak valid' }, { status: 400 });

    const { data, error } = await supabaseAdmin.rpc('approve_piket_daily', {
      p_report_date: reportDate,
      p_approved_by: actor.id,
      p_approver_name: actor.name,
    });
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Rekap hari ini sudah disetujui.' }, { status: 409 });
      if (error.code === '55000') return NextResponse.json({ error: 'Belum ada laporan untuk disetujui pada tanggal tersebut.' }, { status: 409 });
      console.error('[piket] Approval failed', error.code);
      return NextResponse.json({ error: 'Rekap belum dapat disetujui. Pastikan migrasi Piket sudah diterapkan.' }, { status: 500 });
    }
    const approval = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({ success: true, approval });
  } catch {
    return NextResponse.json({ error: 'Permintaan persetujuan tidak valid.' }, { status: 400 });
  }
}
