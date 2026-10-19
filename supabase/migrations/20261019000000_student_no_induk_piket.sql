begin;

alter table public.users add column if not exists no_induk text;
alter table public.piket_late_reports add column if not exists student_unit text;
alter table public.piket_late_reports add column if not exists student_no_induk text;

create table if not exists public.piket_student_roster (
  id uuid primary key default gen_random_uuid(),
  no_induk text not null check (length(btrim(no_induk)) > 0),
  name text not null check (length(btrim(name)) > 0),
  unit_sekolah text not null check (length(btrim(unit_sekolah)) > 0),
  kelas text not null check (length(btrim(kelas)) > 0),
  student_user_id uuid unique references public.users(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint piket_student_roster_induk_unit_key unique (no_induk, unit_sekolah)
);

create index if not exists piket_student_roster_match_idx
  on public.piket_student_roster(name, unit_sekolah, kelas) where is_active = true;
alter table public.piket_student_roster enable row level security;
revoke all on public.piket_student_roster from anon, authenticated;
grant all on public.piket_student_roster to service_role;

alter table public.piket_late_reports alter column student_user_id drop not null;
alter table public.piket_late_reports add column if not exists student_roster_id uuid references public.piket_student_roster(id) on delete restrict;
alter table public.piket_late_reports add constraint piket_one_report_per_roster_day unique (student_roster_id, report_date);

create or replace function public.sync_piket_roster_from_user()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_match_count integer;
  v_roster_id uuid;
  v_no_induk text;
  v_roster_found boolean;
begin
  if pg_trigger_depth() > 1 then return new; end if;
  if tg_op = 'INSERT' then
    select count(*)::integer, (array_agg(r.id))[1], (array_agg(r.no_induk))[1]
      into v_match_count, v_roster_id, v_no_induk
      from public.piket_student_roster r
     where r.student_user_id is null
       and r.name = btrim(new.name)
       and r.unit_sekolah = btrim(new.unit_sekolah)
       and r.kelas = btrim(new.kelas);
    if v_match_count = 1 then
      update public.piket_student_roster set student_user_id = new.id, updated_at = now()
       where id = v_roster_id;
      update public.users set no_induk = v_no_induk where id = new.id and no_induk is distinct from v_no_induk;
    end if;
    return new;
  end if;
  update public.piket_student_roster
     set name = new.name,
         unit_sekolah = coalesce(nullif(btrim(new.unit_sekolah), ''), unit_sekolah),
         kelas = coalesce(nullif(btrim(new.kelas), ''), kelas),
         no_induk = coalesce(nullif(btrim(new.no_induk), ''), no_induk),
         updated_at = now()
   where student_user_id = new.id
     and (name, unit_sekolah, kelas, no_induk)
         is distinct from (new.name, new.unit_sekolah, new.kelas, new.no_induk);
  v_roster_found := found;
  if not v_roster_found then
    select count(*)::integer, (array_agg(r.id))[1], (array_agg(r.no_induk))[1]
      into v_match_count, v_roster_id, v_no_induk
      from public.piket_student_roster r
     where r.student_user_id is null
       and r.name = old.name
       and r.unit_sekolah = old.unit_sekolah
       and r.kelas = old.kelas;
    if v_match_count = 1 then
      update public.piket_student_roster set student_user_id = new.id, updated_at = now()
       where id = v_roster_id;
      update public.users set no_induk = v_no_induk where id = new.id and no_induk is distinct from v_no_induk;
      v_roster_found := true;
    end if;
  end if;
  if v_roster_found then
    update public.users u
       set name = r.name, unit_sekolah = r.unit_sekolah,
           kelas = r.kelas, no_induk = r.no_induk
      from public.piket_student_roster r
     where r.student_user_id = new.id and u.id = new.id
       and (u.name, u.unit_sekolah, u.kelas, u.no_induk)
           is distinct from (r.name, r.unit_sekolah, r.kelas, r.no_induk);
  end if;
  return new;
end;
$$;

drop trigger if exists users_sync_piket_roster on public.users;
create trigger users_sync_piket_roster
after insert or update of name, unit_sekolah, kelas, no_induk on public.users
for each row execute function public.sync_piket_roster_from_user();

create or replace function public.sync_piket_user_from_roster()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_match_count integer;
  v_user_id uuid;
begin
  if pg_trigger_depth() > 1 then return new; end if;
  if new.student_user_id is null then
    select count(*)::integer, (array_agg(u.id))[1]
      into v_match_count, v_user_id
      from public.users u
     where u.role = 'siswa'
       and u.name = btrim(new.name)
       and u.unit_sekolah = btrim(new.unit_sekolah)
       and u.kelas = btrim(new.kelas);
    if v_match_count = 1 and not exists (
      select 1 from public.piket_student_roster r
       where r.student_user_id = v_user_id and r.id <> coalesce(new.id, gen_random_uuid())
    ) then
      new.student_user_id := v_user_id;
    end if;
  end if;
  if new.student_user_id is not null then
    update public.users
       set name = btrim(new.name), unit_sekolah = btrim(new.unit_sekolah),
           kelas = btrim(new.kelas), no_induk = btrim(new.no_induk)
     where id = new.student_user_id
       and (name, unit_sekolah, kelas, no_induk)
           is distinct from (btrim(new.name), btrim(new.unit_sekolah), btrim(new.kelas), btrim(new.no_induk));
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists piket_roster_sync_user on public.piket_student_roster;
create trigger piket_roster_sync_user
before insert or update of no_induk, name, unit_sekolah, kelas, student_user_id on public.piket_student_roster
for each row execute function public.sync_piket_user_from_roster();

revoke all on function public.sync_piket_roster_from_user() from public, anon, authenticated;
revoke all on function public.sync_piket_user_from_roster() from public, anon, authenticated;

create table if not exists public.piket_data_corrections (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.piket_sessions(id) on delete restrict,
  report_date date not null,
  student_name text not null check (length(btrim(student_name)) > 0),
  student_unit text not null check (length(btrim(student_unit)) > 0),
  student_class text not null check (length(btrim(student_class)) > 0),
  details text not null check (length(btrim(details)) > 0),
  suggested_name text,
  suggested_unit text,
  suggested_class text,
  status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  submitted_at timestamptz not null default now()
);

create index if not exists piket_data_corrections_status_idx
  on public.piket_data_corrections(status, submitted_at desc);
alter table public.piket_data_corrections enable row level security;
revoke all on public.piket_data_corrections from anon, authenticated;
grant all on public.piket_data_corrections to service_role;

drop function if exists public.submit_piket_late_report(text, uuid, text, text);
drop function if exists public.submit_piket_late_report(text, uuid, text, text, text);

create function public.submit_piket_late_report(
  p_token_hash text,
  p_student_roster_id uuid,
  p_student_name text,
  p_student_unit text,
  p_student_class text
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
  v_no_induk text;
begin
  if p_token_hash !~ '^[a-f0-9]{64}$'
     or p_student_roster_id is null
     or length(btrim(coalesce(p_student_name, ''))) = 0
     or length(btrim(coalesce(p_student_unit, ''))) = 0
     or length(btrim(coalesce(p_student_class, ''))) = 0 then
    raise exception 'data formulir tidak lengkap' using errcode = '22023';
  end if;
  select * into v_student
    from public.piket_student_roster r
   where r.id = p_student_roster_id
     and r.is_active = true
     and r.name = btrim(p_student_name)
     and r.unit_sekolah = btrim(p_student_unit)
     and r.kelas = btrim(p_student_class)
   limit 1;
  if not found or length(btrim(coalesce(v_student.no_induk, ''))) = 0 then
    raise exception 'data siswa tidak cocok atau belum lengkap' using errcode = '42501';
  end if;
  v_no_induk := v_student.no_induk;

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
  if exists (select 1 from public.piket_daily_approvals a where a.report_date = v_report_date) then
    raise exception 'rekap hari ini sudah disetujui' using errcode = '55000';
  end if;

  return query
    insert into public.piket_late_reports(
      session_id, report_date, student_user_id, student_roster_id,
      student_name, student_unit, student_class, student_no_induk
    )
    values (
      v_session.id, v_report_date, v_student.student_user_id, v_student.id, btrim(p_student_name),
      btrim(p_student_unit), btrim(p_student_class), btrim(v_no_induk)
    )
    returning piket_late_reports.id, piket_late_reports.report_date, piket_late_reports.submitted_at;
exception
  when unique_violation then
    raise exception 'siswa ini sudah memiliki laporan keterlambatan hari ini' using errcode = '23505';
end;
$$;

revoke all on function public.submit_piket_late_report(text, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.submit_piket_late_report(text, uuid, text, text, text) to service_role;

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
  if p_report_date is null or p_approved_by is null
     or length(btrim(coalesce(p_approver_name, ''))) = 0 then
    raise exception 'data persetujuan tidak lengkap' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.users u
     where u.id = p_approved_by and u.role = 'guru'
       and u.approved = true and u.email_verified = true
       and u.name = btrim(p_approver_name)
  ) then
    raise exception 'role guru diperlukan untuk persetujuan' using errcode = '42501';
  end if;
  if p_report_date > (now() at time zone 'Asia/Jakarta')::date then
    raise exception 'tanggal rekap belum terjadi' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtext('piket-day:' || p_report_date::text));
  if exists (select 1 from public.piket_daily_approvals a where a.report_date = p_report_date) then
    raise exception 'rekap hari ini sudah disetujui' using errcode = '23505';
  end if;

  select count(*)::integer,
         coalesce(jsonb_agg(jsonb_build_object(
           'id', r.id, 'student_user_id', r.student_user_id, 'student_roster_id', r.student_roster_id,
           'student_name', r.student_name, 'student_unit', r.student_unit,
           'student_class', r.student_class, 'student_no_induk', r.student_no_induk,
           'submitted_at', r.submitted_at
         ) order by r.student_roster_id), '[]'::jsonb)
    into v_count, v_rows
    from public.piket_late_reports r where r.report_date = p_report_date;
  if v_count = 0 then raise exception 'belum ada laporan untuk disetujui' using errcode = '55000'; end if;
  v_hash := encode(digest(v_rows::text, 'sha256'), 'hex');
  return query
    insert into public.piket_daily_approvals(report_date, report_count, snapshot_sha256, approved_by, approver_name)
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
