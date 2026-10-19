begin;

alter table public.piket_late_reports
  add column if not exists reason text,
  add column if not exists applicant_signature text,
  add column if not exists edited_at timestamptz,
  add column if not exists edited_by uuid references public.users(id) on delete set null,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.users(id) on delete set null;
alter table public.piket_student_roster
  add column if not exists name_aliases text[] not null default '{}';

update public.piket_late_reports
   set reason = 'Tidak dicatat (laporan lama)'
 where reason is null or length(btrim(reason)) = 0;
alter table public.piket_late_reports alter column reason set not null;

alter table public.piket_late_reports drop constraint if exists piket_one_report_per_roster_day;
alter table public.piket_late_reports drop constraint if exists piket_one_report_per_student_day;
create unique index if not exists piket_one_active_report_per_roster_day
  on public.piket_late_reports(student_roster_id, report_date)
  where student_roster_id is not null and deleted_at is null;
create unique index if not exists piket_one_active_report_per_account_day
  on public.piket_late_reports(student_user_id, report_date)
  where student_user_id is not null and deleted_at is null;
create index if not exists piket_active_reports_date_student_idx
  on public.piket_late_reports(report_date, student_name)
  where deleted_at is null;

create or replace function public.suggest_piket_student_names(p_query text)
returns table(id uuid, name text, unit text, kelas text)
language sql
security definer
set search_path = public
stable
as $$
  select r.id, r.name, r.unit_sekolah, r.kelas
    from public.piket_student_roster r
   where r.is_active = true
     and length(regexp_replace(btrim(coalesce(p_query, '')), '[^[:alnum:]]', '', 'g')) >= 2
     and (
       r.name ilike ('%' || replace(replace(btrim(p_query), '%', ' '), '_', ' ') || '%')
       or exists (
         select 1 from unnest(r.name_aliases) alias_name
          where alias_name ilike ('%' || replace(replace(btrim(p_query), '%', ' '), '_', ' ') || '%')
       )
     )
   order by r.name
   limit 8;
$$;
revoke all on function public.suggest_piket_student_names(text) from public, anon, authenticated;
grant execute on function public.suggest_piket_student_names(text) to service_role;

create table if not exists public.piket_report_audit (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null,
  report_date date not null,
  action text not null check (action in ('edited', 'deleted')),
  before_data jsonb not null,
  after_data jsonb,
  actor_id uuid references public.users(id) on delete set null,
  actor_name text not null,
  changed_at timestamptz not null default now()
);
create index if not exists piket_report_audit_report_idx
  on public.piket_report_audit(report_id, changed_at desc);
alter table public.piket_report_audit enable row level security;
revoke all on public.piket_report_audit from anon, authenticated;
grant all on public.piket_report_audit to service_role;

create table if not exists public.piket_approval_history (
  id uuid primary key default gen_random_uuid(),
  report_date date not null,
  report_count integer not null,
  snapshot_sha256 text not null,
  approved_by uuid references public.users(id) on delete set null,
  approver_name text not null,
  approved_at timestamptz not null,
  invalidated_by uuid references public.users(id) on delete set null,
  invalidated_at timestamptz not null default now(),
  invalidation_reason text not null
);
alter table public.piket_approval_history enable row level security;
revoke all on public.piket_approval_history from anon, authenticated;
grant all on public.piket_approval_history to service_role;

drop function if exists public.submit_piket_late_report(text, uuid, text, text, text);
drop function if exists public.submit_piket_late_report(text, uuid, text, text, text, text, text);
create function public.submit_piket_late_report(
  p_token_hash text,
  p_student_roster_id uuid,
  p_student_name text,
  p_student_unit text,
  p_student_class text,
  p_reason text,
  p_applicant_signature text
)
returns table(id uuid, report_date date, submitted_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.piket_sessions%rowtype;
  v_student public.piket_student_roster%rowtype;
  v_report_date date := (now() at time zone 'Asia/Jakarta')::date;
begin
  if p_token_hash !~ '^[a-f0-9]{64}$'
     or p_student_roster_id is null
     or length(btrim(coalesce(p_student_name, ''))) = 0
     or length(btrim(coalesce(p_student_unit, ''))) = 0
     or length(btrim(coalesce(p_student_class, ''))) = 0
     or length(btrim(coalesce(p_reason, ''))) = 0
     or length(p_reason) > 500
     or coalesce(p_applicant_signature, '') !~ '^data:image/png;base64,[A-Za-z0-9+/]+=*$'
     or length(p_applicant_signature) > 60000 then
    raise exception 'data formulir tidak lengkap' using errcode = '22023';
  end if;
  select * into v_student
    from public.piket_student_roster r
   where r.id = p_student_roster_id and r.is_active = true
     and r.name = btrim(p_student_name)
     and r.unit_sekolah = btrim(p_student_unit)
     and r.kelas = btrim(p_student_class)
   limit 1;
  if not found or length(btrim(coalesce(v_student.no_induk, ''))) = 0 then
    raise exception 'data siswa tidak cocok atau belum lengkap' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtext('piket-day:' || v_report_date::text));
  select * into v_session from public.piket_sessions s
   where s.token_hash = p_token_hash and s.report_date = v_report_date
     and s.is_active = true and s.expires_at > now()
   limit 1;
  if not found then raise exception 'tautan QR tidak aktif atau sudah kedaluwarsa' using errcode = '28000'; end if;
  if exists (select 1 from public.piket_daily_approvals a where a.report_date = v_report_date) then
    raise exception 'rekap hari ini sudah disetujui' using errcode = '55000';
  end if;

  return query
    insert into public.piket_late_reports(
      session_id, report_date, student_user_id, student_roster_id,
      student_name, student_unit, student_class, student_no_induk, reason, applicant_signature
    ) values (
      v_session.id, v_report_date, v_student.student_user_id, v_student.id,
      btrim(p_student_name), btrim(p_student_unit), btrim(p_student_class),
      btrim(v_student.no_induk), btrim(p_reason), p_applicant_signature
    ) returning piket_late_reports.id, piket_late_reports.report_date, piket_late_reports.submitted_at;
exception when unique_violation then
  raise exception 'siswa ini sudah memiliki laporan keterlambatan hari ini' using errcode = '23505';
end;
$$;
revoke all on function public.submit_piket_late_report(text, uuid, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.submit_piket_late_report(text, uuid, text, text, text, text, text) to service_role;

create or replace function public.piket_lateness_summary()
returns table(student_identity_id uuid, late_count bigint)
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(r.student_roster_id, roster.id, r.student_user_id), count(*)
    from public.piket_late_reports r
    left join public.piket_student_roster roster on roster.student_user_id = r.student_user_id
   where r.deleted_at is null
   group by coalesce(r.student_roster_id, roster.id, r.student_user_id);
$$;
revoke all on function public.piket_lateness_summary() from public, anon, authenticated;
grant execute on function public.piket_lateness_summary() to service_role;

drop function if exists public.admin_manage_piket_report(uuid, uuid, text, text);
drop function if exists public.admin_manage_piket_report(uuid, uuid, text, text, text, text, text, text);
create function public.admin_manage_piket_report(
  p_report_id uuid,
  p_actor_id uuid,
  p_action text,
  p_reason text default null,
  p_student_name text default null,
  p_student_no_induk text default null,
  p_student_unit text default null,
  p_student_class text default null
)
returns table(report_id uuid, report_date date, action text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report public.piket_late_reports%rowtype;
  v_actor public.users%rowtype;
  v_approval public.piket_daily_approvals%rowtype;
  v_reason text := btrim(coalesce(p_reason, ''));
  v_name text := btrim(coalesce(p_student_name, ''));
  v_no_induk text := btrim(coalesce(p_student_no_induk, ''));
  v_unit text := btrim(coalesce(p_student_unit, ''));
  v_class text := btrim(coalesce(p_student_class, ''));
begin
  if p_action not in ('edit', 'delete') or p_report_id is null or p_actor_id is null then
    raise exception 'permintaan perubahan tidak valid' using errcode = '22023';
  end if;
  select * into v_actor from public.users u where u.id = p_actor_id;
  if not found or v_actor.role not in ('admin', 'super_admin')
     or v_actor.approved is not true or v_actor.email_verified is not true then
    raise exception 'akun Admin aktif diperlukan' using errcode = '42501';
  end if;
  select * into v_report from public.piket_late_reports r
   where r.id = p_report_id and r.deleted_at is null;
  if not found then raise exception 'laporan tidak ditemukan atau sudah dihapus' using errcode = 'P0002'; end if;
  perform pg_advisory_xact_lock(hashtext('piket-day:' || v_report.report_date::text));
  select * into v_report from public.piket_late_reports r
   where r.id = p_report_id and r.deleted_at is null for update;
  if not found then raise exception 'laporan tidak ditemukan atau sudah dihapus' using errcode = 'P0002'; end if;
  if p_action = 'edit' then
    v_reason := coalesce(nullif(v_reason, ''), v_report.reason);
    v_name := coalesce(nullif(v_name, ''), v_report.student_name);
    v_no_induk := coalesce(nullif(v_no_induk, ''), v_report.student_no_induk);
    v_unit := coalesce(nullif(v_unit, ''), v_report.student_unit);
    v_class := coalesce(nullif(v_class, ''), v_report.student_class);
    if length(v_reason) > 500 or length(v_name) = 0 or length(v_name) > 120
       or length(v_no_induk) > 40 or length(v_unit) = 0 or length(v_unit) > 80
       or length(v_class) = 0 or length(v_class) > 40 then
      raise exception 'data laporan tidak valid' using errcode = '22023';
    end if;
  end if;

  select * into v_approval from public.piket_daily_approvals a
   where a.report_date = v_report.report_date for update;
  if found then
    insert into public.piket_approval_history(
      report_date, report_count, snapshot_sha256, approved_by, approver_name, approved_at,
      invalidated_by, invalidation_reason
    ) values (
      v_approval.report_date, v_approval.report_count, v_approval.snapshot_sha256,
      v_approval.approved_by, v_approval.approver_name, v_approval.approved_at,
      v_actor.id, 'Rekap dibuka kembali karena laporan diubah Admin.'
    );
    delete from public.piket_daily_approvals a where a.report_date = v_report.report_date;
  end if;

  if p_action = 'edit' then
    update public.piket_late_reports
       set reason = v_reason, student_name = v_name, student_no_induk = v_no_induk,
           student_unit = v_unit, student_class = v_class, edited_at = now(), edited_by = v_actor.id
     where id = v_report.id;
    insert into public.piket_report_audit(report_id, report_date, action, before_data, after_data, actor_id, actor_name)
    values (v_report.id, v_report.report_date, 'edited', to_jsonb(v_report),
      to_jsonb(v_report) || jsonb_build_object('reason', v_reason, 'student_name', v_name,
        'student_no_induk', v_no_induk, 'student_unit', v_unit, 'student_class', v_class,
        'edited_at', now(), 'edited_by', v_actor.id), v_actor.id, coalesce(v_actor.name, v_actor.email, 'Admin'));
  else
    update public.piket_late_reports set deleted_at = now(), deleted_by = v_actor.id
     where id = v_report.id;
    insert into public.piket_report_audit(report_id, report_date, action, before_data, after_data, actor_id, actor_name)
    values (v_report.id, v_report.report_date, 'deleted', to_jsonb(v_report), null, v_actor.id, coalesce(v_actor.name, v_actor.email, 'Admin'));
  end if;
  return query select v_report.id, v_report.report_date, p_action;
end;
$$;
revoke all on function public.admin_manage_piket_report(uuid, uuid, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.admin_manage_piket_report(uuid, uuid, text, text, text, text, text, text) to service_role;

create or replace function public.approve_piket_daily(
  p_report_date date,
  p_approved_by uuid,
  p_approver_name text
)
returns table(report_date date, report_count integer, snapshot_sha256 text, approved_by uuid, approver_name text, approved_at timestamptz)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_rows jsonb;
  v_count integer;
  v_hash text;
begin
  if p_report_date is null or p_approved_by is null or length(btrim(coalesce(p_approver_name, ''))) = 0 then
    raise exception 'data persetujuan tidak lengkap' using errcode = '22023';
  end if;
  if not exists (select 1 from public.users u where u.id = p_approved_by and u.role = 'guru'
      and u.approved = true and u.email_verified = true and u.name = btrim(p_approver_name)) then
    raise exception 'role guru diperlukan untuk persetujuan' using errcode = '42501';
  end if;
  if p_report_date > (now() at time zone 'Asia/Jakarta')::date then
    raise exception 'tanggal rekap belum terjadi' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtext('piket-day:' || p_report_date::text));
  if exists (select 1 from public.piket_daily_approvals a where a.report_date = p_report_date) then
    raise exception 'rekap hari ini sudah disetujui' using errcode = '23505';
  end if;
  select count(*)::integer, coalesce(jsonb_agg(jsonb_build_object(
    'id', r.id, 'student_user_id', r.student_user_id, 'student_roster_id', r.student_roster_id,
    'student_name', r.student_name, 'student_unit', r.student_unit, 'student_class', r.student_class,
    'student_no_induk', r.student_no_induk, 'reason', r.reason,
    'applicant_signature', r.applicant_signature, 'submitted_at', r.submitted_at
  ) order by r.student_roster_id), '[]'::jsonb)
    into v_count, v_rows from public.piket_late_reports r
   where r.report_date = p_report_date and r.deleted_at is null;
  if v_count = 0 then raise exception 'belum ada laporan untuk disetujui' using errcode = '55000'; end if;
  v_hash := encode(digest(v_rows::text, 'sha256'), 'hex');
  return query insert into public.piket_daily_approvals(report_date, report_count, snapshot_sha256, approved_by, approver_name)
    values (p_report_date, v_count, v_hash, p_approved_by, btrim(p_approver_name))
    returning piket_daily_approvals.report_date, piket_daily_approvals.report_count,
      piket_daily_approvals.snapshot_sha256, piket_daily_approvals.approved_by,
      piket_daily_approvals.approver_name, piket_daily_approvals.approved_at;
  update public.piket_sessions set is_active = false, revoked_at = now()
   where piket_sessions.report_date = p_report_date and is_active = true;
end;
$$;
revoke all on function public.approve_piket_daily(date, uuid, text) from public, anon, authenticated;
grant execute on function public.approve_piket_daily(date, uuid, text) to service_role;

commit;
