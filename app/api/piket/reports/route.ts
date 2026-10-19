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
  const searchName = (request.nextUrl.searchParams.get('name') || '').normalize('NFC').trim().slice(0, 120);
  const allDates = requestedDate === 'all';
  if (!allDates && !isDateKey(requestedDate)) return NextResponse.json({ error: 'Format tanggal tidak valid' }, { status: 400 });

  let reportQuery = supabaseAdmin.from('piket_late_reports')
    .select('id,report_date,student_roster_id,student_user_id,student_name,student_unit,student_class,student_no_induk,reason,applicant_signature,submitted_at,edited_at,edited_by,deleted_at', { count: 'exact' })
    .is('deleted_at', null)
    .order('report_date', { ascending: false })
    .order('submitted_at', { ascending: false })
    .range(0, 9999);
  if (!allDates) reportQuery = reportQuery.eq('report_date', requestedDate);
  if (searchName) reportQuery = reportQuery.ilike('student_name', `%${searchName.replace(/[\\%_,]/g, ' ')}%`);

  const [{ data: reports, error: reportsError }, { data: summary, error: summaryError }, approvalResponse] = await Promise.all([
    reportQuery,
    supabaseAdmin.rpc('piket_lateness_summary'),
    allDates
      ? Promise.resolve({ data: null, error: null })
      : supabaseAdmin.from('piket_daily_approvals')
          .select('report_date,report_count,snapshot_sha256,approved_by,approver_name,approved_at')
          .eq('report_date', requestedDate).maybeSingle(),
  ]);

  if (reportsError || summaryError || approvalResponse.error) {
    console.error('[piket] Report read failed', reportsError?.code || summaryError?.code || approvalResponse.error?.code);
    return NextResponse.json({ error: 'Rekap belum tersedia. Pastikan migrasi Piket sudah diterapkan.' }, { status: 500 });
  }
  const counts = new Map((summary || []).map((item: { student_identity_id: string | null; late_count: number }) => [item.student_identity_id, Number(item.late_count)]));
  const enrichedReports = (reports || []).map((report: { student_roster_id: string | null; student_user_id: string | null; [key: string]: unknown }) => ({
    ...report,
    late_count: counts.get(report.student_roster_id || report.student_user_id || null) || 1,
  }));
  return NextResponse.json({ reports: enrichedReports, approval: approvalResponse.data || null, date: requestedDate, allDates, total: enrichedReports.length });
}
