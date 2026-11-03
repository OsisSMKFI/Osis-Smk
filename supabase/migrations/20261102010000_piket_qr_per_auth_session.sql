begin;

create or replace function public.generate_piket_session(
  p_created_by uuid,
  p_token_hash text,
  p_expires_at timestamptz,
  p_device_session_key text
)
returns table(id uuid, report_date date, expires_at timestamptz)
language plpgsql security definer set search_path = public, extensions
as $$
declare v_report_date date := (now() at time zone 'Asia/Jakarta')::date;
begin
  if p_created_by is null or p_token_hash !~ '^[a-f0-9]{64}$'
     or p_device_session_key !~ '^[a-f0-9-]{36}$' then
    raise exception 'invalid session input' using errcode = '22023';
  end if;
  if not exists (select 1 from public.users u where u.id=p_created_by and u.role in ('osis','admin','super_admin') and u.approved=true and u.email_verified=true) then
    raise exception 'role tidak dapat membuat QR Piket' using errcode = '42501';
  end if;
  if p_expires_at <= now() then raise exception 'session expiry must be in the future' using errcode = '22023'; end if;
  perform pg_advisory_xact_lock(hashtext('piket-day:' || v_report_date::text));
  if exists (select 1 from public.piket_daily_approvals a where a.report_date=v_report_date) then
    raise exception 'rekap hari ini sudah disetujui' using errcode = '55000';
  end if;
  perform pg_advisory_xact_lock(hashtext('piket-device:' || p_created_by::text || ':' || p_device_session_key));
  update public.piket_sessions s set is_active=false, revoked_at=now()
    where s.created_by=p_created_by and s.report_date=v_report_date
      and s.device_session_key=p_device_session_key and s.is_active=true;
  return query insert into public.piket_sessions(created_by,report_date,token_hash,expires_at,device_session_key)
    values(p_created_by,v_report_date,p_token_hash,p_expires_at,p_device_session_key)
    returning piket_sessions.id,piket_sessions.report_date,piket_sessions.expires_at;
end;
$$;

create or replace function public.generate_piket_session(p_created_by uuid,p_token_hash text,p_expires_at timestamptz)
returns table(id uuid, report_date date, expires_at timestamptz)
language sql security definer set search_path = public, extensions
as $$ select * from public.generate_piket_session(p_created_by,p_token_hash,p_expires_at,'legacy'); $$;

revoke all on function public.generate_piket_session(uuid,text,timestamptz,text) from public, anon, authenticated;
revoke all on function public.generate_piket_session(uuid,text,timestamptz) from public, anon, authenticated;
grant execute on function public.generate_piket_session(uuid,text,timestamptz,text) to service_role;
grant execute on function public.generate_piket_session(uuid,text,timestamptz) to service_role;
commit;
