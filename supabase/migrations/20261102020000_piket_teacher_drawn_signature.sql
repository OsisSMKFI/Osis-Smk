begin;
create or replace function public.approve_piket_daily(
  p_report_date date,
  p_approved_by uuid,
  p_approver_name text,
  p_teacher_signature text
)
returns table(report_date date, report_count integer, snapshot_sha256 text, approved_by uuid, approver_name text, approved_at timestamptz, teacher_signature text)
language plpgsql security definer set search_path = public, extensions
as $$
begin
  if p_teacher_signature is null or length(p_teacher_signature) > 180000
     or p_teacher_signature !~ '^data:image/png;base64,[A-Za-z0-9+/]+=*$' then
    raise exception 'tanda tangan Guru tidak valid' using errcode = '22023';
  end if;
  return query select a.report_date,a.report_count,a.snapshot_sha256,a.approved_by,a.approver_name,a.approved_at,p_teacher_signature
    from public.approve_piket_daily(p_report_date,p_approved_by,p_approver_name) a;
  update public.piket_daily_approvals set teacher_signature=p_teacher_signature where public.piket_daily_approvals.report_date=p_report_date;
end;
$$;
revoke all on function public.approve_piket_daily(date,uuid,text,text) from public, anon, authenticated;
grant execute on function public.approve_piket_daily(date,uuid,text,text) to service_role;
commit;
