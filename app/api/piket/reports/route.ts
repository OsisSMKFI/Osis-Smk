import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getPiketActor, isDateKey, jakartaDateKey, PIKET_VIEW_ROLES } from '@/lib/piket';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const actor = await getPiketActor();
  if (!actor) return NextResponse.json({ error: 'Login diperlukan' }, { status: 401 });
  if (!PIKET_VIEW_ROLES.includes(actor.role as (typeof PIKET_VIEW_ROLES)[number])) {
    return NextResponse.json({ error: 'Role ini tidak dapat melihat rekap Piket' }, { status: 403 });
  }

  const requestedDate = request.nextUrl.searchParams.get('date') || jakartaDateKey();
  if (!isDateKey(requestedDate)) return NextResponse.json({ error: 'Format tanggal tidak valid' }, { status: 400 });

  const [{ data: reports, error: reportsError }, { data: approval, error: approvalError }] = await Promise.all([
    supabaseAdmin
      .from('piket_late_reports')
      .select('id,report_date,student_name,student_class,submitted_at')
      .eq('report_date', requestedDate)
      .order('submitted_at', { ascending: true }),
    supabaseAdmin
      .from('piket_daily_approvals')
      .select('report_date,report_count,snapshot_sha256,approved_by,approver_name,approved_at')
      .eq('report_date', requestedDate)
      .maybeSingle(),
  ]);

  if (reportsError || approvalError) {
    console.error('[piket] Report read failed', reportsError?.code || approvalError?.code);
    return NextResponse.json({ error: 'Rekap belum tersedia. Pastikan migrasi Piket sudah diterapkan.' }, { status: 500 });
  }
  return NextResponse.json({ reports: reports || [], approval: approval || null, date: requestedDate });
}
