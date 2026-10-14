begin;

create extension if not exists pgcrypto;

create table if not exists public.piket_sessions (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.users(id) on delete restrict,
  report_date date not null,
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create unique index if not exists piket_one_active_session_per_owner_day
  on public.piket_sessions(created_by, report_date)
  where is_active = true;

create index if not exists piket_sessions_date_idx
  on public.piket_sessions(report_date, created_at desc);

create table if not exists public.piket_late_reports (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.piket_sessions(id) on delete restrict,
  report_date date not null,
  student_user_id uuid not null references public.users(id) on delete restrict,
  student_name text not null check (length(btrim(student_name)) > 0),
  student_class text not null check (length(btrim(student_class)) > 0),
  submitted_at timestamptz not null default now(),
  constraint piket_one_report_per_student_day unique (student_user_id, report_date)
);

create index if not exists piket_late_reports_date_idx
  on public.piket_late_reports(report_date, submitted_at asc);

create table if not exists public.piket_daily_approvals (
  report_date date primary key,
  report_count integer not null check (report_count >= 0),
  snapshot_sha256 text not null check (snapshot_sha256 ~ '^[a-f0-9]{64}$'),
  approved_by uuid not null references public.users(id) on delete restrict,
  approver_name text not null check (length(btrim(approver_name)) > 0),
  approved_at timestamptz not null default now()
);

alter table public.piket_sessions enable row level security;
alter table public.piket_late_reports enable row level security;
alter table public.piket_daily_approvals enable row level security;

revoke all on public.piket_sessions, public.piket_late_reports, public.piket_daily_approvals
  from anon, authenticated;
grant all on public.piket_sessions, public.piket_late_reports, public.piket_daily_approvals
  to service_role;

create or replace function public.generate_piket_session(
  p_created_by uuid,
  p_token_hash text,
  p_expires_at timestamptz
)
returns table(id uuid, report_date date, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report_date date := (now() at time zone 'Asia/Jakarta')::date;
begin
  if p_created_by is null or p_token_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'invalid session input' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.users u
     where u.id = p_created_by
       and u.role in ('osis', 'admin', 'super_admin')
       and u.approved = true
  ) then
    raise exception 'role tidak dapat membuat QR Piket' using errcode = '42501';
  end if;
  if p_expires_at <= now() then
    raise exception 'session expiry must be in the future' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtext('piket-day:' || v_report_date::text));
  if exists (
    select 1 from public.piket_daily_approvals a where a.report_date = v_report_date
  ) then
    raise exception 'rekap hari ini sudah disetujui' using errcode = '55000';
  end if;

  perform pg_advisory_xact_lock(hashtext('piket-owner:' || p_created_by::text));
  update public.piket_sessions
     set is_active = false, revoked_at = now()
   where created_by = p_created_by
     and piket_sessions.report_date = v_report_date
     and is_active = true;

  return query
    insert into public.piket_sessions(created_by, report_date, token_hash, expires_at)
    values (p_created_by, v_report_date, p_token_hash, p_expires_at)
    returning piket_sessions.id, piket_sessions.report_date, piket_sessions.expires_at;
end;
$$;

create or replace function public.submit_piket_late_report(
  p_token_hash text,
  p_student_user_id uuid,
  p_student_name text,
  p_student_class text
)
returns table(id uuid, report_date date, submitted_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.piket_sessions%rowtype;
  v_report_date date := (now() at time zone 'Asia/Jakarta')::date;
begin
  if p_token_hash !~ '^[a-f0-9]{64}$'
     or p_student_user_id is null
     or length(btrim(coalesce(p_student_name, ''))) = 0
     or length(btrim(coalesce(p_student_class, ''))) = 0 then
    raise exception 'data formulir tidak lengkap' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.users u
     where u.id = p_student_user_id
       and u.role = 'siswa'
       and u.approved = true
       and u.name = btrim(p_student_name)
       and u.kelas = btrim(p_student_class)
  ) then
    raise exception 'data siswa tidak cocok' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtext('piket-day:' || v_report_date::text));
  select * into v_session
    from public.piket_sessions s
   where s.token_hash = p_token_hash
     and s.report_date = v_report_date
     and s.is_active = true
     and s.expires_at > now()
   limit 1;
  if not found then
    raise exception 'tautan QR tidak aktif atau sudah kedaluwarsa' using errcode = '28000';
  end if;
  if exists (
    select 1 from public.piket_daily_approvals a where a.report_date = v_report_date
  ) then
    raise exception 'rekap hari ini sudah disetujui' using errcode = '55000';
  end if;

  return query
    insert into public.piket_late_reports(session_id, report_date, student_user_id, student_name, student_class)
    values (v_session.id, v_report_date, p_student_user_id, btrim(p_student_name), btrim(p_student_class))
    returning piket_late_reports.id, piket_late_reports.report_date, piket_late_reports.submitted_at;
exception
  when unique_violation then
    raise exception 'siswa ini sudah memiliki laporan keterlambatan hari ini' using errcode = '23505';
end;
$$;

create or replace function public.approve_piket_daily(
  p_report_date date,
  p_approved_by uuid,
  p_approver_name text
)
returns table(report_date date, report_count integer, snapshot_sha256 text, approved_by uuid, approver_name text, approved_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows jsonb;
  v_count integer;
  v_hash text;
begin
  if p_report_date is null or p_approved_by is null
     or length(btrim(coalesce(p_approver_name, ''))) = 0 then
    raise exception 'data persetujuan tidak lengkap' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.users u
     where u.id = p_approved_by
       and u.role = 'guru'
       and u.approved = true
       and u.name = btrim(p_approver_name)
  ) then
    raise exception 'role guru diperlukan untuk persetujuan' using errcode = '42501';
  end if;
  if p_report_date > (now() at time zone 'Asia/Jakarta')::date then
    raise exception 'tanggal rekap belum terjadi' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtext('piket-day:' || p_report_date::text));
  if exists (
    select 1 from public.piket_daily_approvals a where a.report_date = p_report_date
  ) then
    raise exception 'rekap hari ini sudah disetujui' using errcode = '23505';
  end if;

  select count(*)::integer,
         coalesce(jsonb_agg(jsonb_build_object(
           'id', r.id,
           'student_user_id', r.student_user_id,
           'student_name', r.student_name,
           'student_class', r.student_class,
           'submitted_at', r.submitted_at
         ) order by r.student_user_id), '[]'::jsonb)
    into v_count, v_rows
    from public.piket_late_reports r
   where r.report_date = p_report_date;

  if v_count = 0 then
    raise exception 'belum ada laporan untuk disetujui' using errcode = '55000';
  end if;

  v_hash := encode(digest(v_rows::text, 'sha256'), 'hex');
  return query
    insert into public.piket_daily_approvals(report_date, report_count, snapshot_sha256, approved_by, approver_name)
    values (p_report_date, v_count, v_hash, p_approved_by, btrim(p_approver_name))
    returning piket_daily_approvals.report_date, piket_daily_approvals.report_count,
              piket_daily_approvals.snapshot_sha256, piket_daily_approvals.approved_by,
              piket_daily_approvals.approver_name, piket_daily_approvals.approved_at;

  update public.piket_sessions
     set is_active = false, revoked_at = now()
   where piket_sessions.report_date = p_report_date and is_active = true;
end;
$$;

revoke all on function public.generate_piket_session(uuid, text, timestamptz) from public, anon, authenticated;
revoke all on function public.submit_piket_late_report(text, uuid, text, text) from public, anon, authenticated;
revoke all on function public.approve_piket_daily(date, uuid, text) from public, anon, authenticated;
grant execute on function public.generate_piket_session(uuid, text, timestamptz) to service_role;
grant execute on function public.submit_piket_late_report(text, uuid, text, text) to service_role;
grant execute on function public.approve_piket_daily(date, uuid, text) to service_role;

commit;
