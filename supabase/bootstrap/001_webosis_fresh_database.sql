-- Web OSIS / OSIS SMK Fithrah Insani
-- Fresh Supabase bootstrap for the current Next.js application.
-- Run once in Supabase Dashboard -> SQL Editor.
--
-- This file intentionally does NOT create:
--   * sample members/events/content
--   * default admin accounts or passwords
--   * school coordinates/Wi-Fi values
--   * Supabase service keys
--
-- The application uses NextAuth with public.users as its user directory.
-- The server uses SUPABASE_SERVICE_ROLE_KEY for privileged API operations.

begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Shared timestamp trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Identity and core CMS
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  nickname text,
  unit_sekolah text,
  kelas text,
  nik text,
  nisn text,
  instagram_username text,
  password_hash text,
  role text not null default 'siswa',
  requested_role text,
  sekbid_id integer,
  photo_url text,
  email_verified boolean not null default false,
  approved boolean not null default false,
  rejected boolean not null default false,
  rejection_reason text,
  verification_token text,
  verification_expires timestamptz,
  preferences jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_role_check check (role in ('super_admin','admin','moderator','osis','siswa','guru','other','editor','viewer','pending'))
);

create table if not exists public.profiles (
  id uuid primary key,
  role text,
  display_name text,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sekbid (
  id serial primary key,
  name text not null,
  slug text not null unique,
  description text,
  vision text,
  mission text,
  icon text,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.members (
  id bigserial primary key,
  name text not null,
  role text not null,
  sekbid_id integer references public.sekbid(id) on delete set null,
  photo_url text,
  quote text,
  instagram text,
  instagram_username text,
  email text,
  class text,
  nisn text,
  achievements text[] not null default '{}',
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id bigserial primary key,
  title text not null,
  slug text not null unique,
  content text,
  excerpt text,
  featured_image text,
  author_id uuid references public.users(id) on delete set null,
  sekbid_id integer references public.sekbid(id) on delete set null,
  category text,
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  is_featured boolean not null default false,
  published_at timestamptz,
  views integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id bigserial primary key,
  title text not null,
  slug text unique,
  description text,
  sekbid_id integer references public.sekbid(id) on delete set null,
  start_date timestamptz not null,
  end_date timestamptz,
  event_date timestamptz,
  event_time text,
  location text,
  image_url text,
  poster_url text,
  registration_link text,
  max_participants integer,
  registration_deadline timestamptz,
  status text not null default 'upcoming' check (status in ('upcoming','ongoing','completed','cancelled')),
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_registrations (
  id bigserial primary key,
  event_id bigint not null references public.events(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  name text not null,
  email text,
  phone text,
  class text,
  ticket_code text not null unique,
  status text not null default 'registered' check (status in ('registered','attended','cancelled')),
  registered_at timestamptz not null default now()
);

create table if not exists public.program_kerja (
  id bigserial primary key,
  sekbid_id integer references public.sekbid(id) on delete set null,
  nama text not null,
  penanggung_jawab text,
  dasar_pemikiran text,
  tujuan text,
  waktu text,
  teknis text,
  anggaran text,
  evaluasi text,
  status text not null default 'planned' check (status in ('planned','ongoing','completed')),
  progress integer not null default 0 check (progress between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gallery (
  id bigserial primary key,
  title text not null,
  description text,
  image_url text not null,
  event_id bigint references public.events(id) on delete set null,
  sekbid_id integer references public.sekbid(id) on delete set null,
  uploaded_by uuid references public.users(id) on delete set null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id bigserial primary key,
  title text not null,
  content text not null,
  image_url text,
  priority text not null default 'medium' check (priority in ('low','normal','medium','high','urgent')),
  target_audience text,
  published boolean not null default true,
  expires_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  description text,
  options jsonb not null default '[]'::jsonb,
  multiple_choice boolean not null default false,
  sekbid_id integer references public.sekbid(id) on delete set null,
  active boolean not null default true,
  ends_at timestamptz,
  expires_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.poll_options (
  id bigserial primary key,
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_text text not null,
  votes integer not null default 0,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  option_id bigint not null references public.poll_options(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  voter_role text not null default 'anonymous',
  voter_identifier text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- CMS, comments, interactions, and user activity
-- ---------------------------------------------------------------------------
create table if not exists public.page_content (
  id uuid primary key default gen_random_uuid(),
  page_key text not null unique,
  category text not null default 'general',
  title text,
  content text,
  html_content text,
  meta_description text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  content_id text not null,
  content_type text not null check (content_type in ('post','event','poll','announcement')),
  content text not null,
  author_name text not null,
  author_id uuid references public.users(id) on delete set null,
  is_anonymous boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comment_likes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  voter_identifier text,
  created_at timestamptz not null default now()
);

create table if not exists public.content_views (
  id uuid primary key default gen_random_uuid(),
  content_id text not null,
  content_type text not null,
  viewer_id text not null,
  user_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.content_likes (
  id uuid primary key default gen_random_uuid(),
  content_id text not null,
  content_type text not null,
  user_id uuid references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id bigserial primary key,
  user_id uuid references public.users(id) on delete set null,
  user_name text,
  user_email text,
  user_role text,
  activity_type text not null,
  action text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  device_info jsonb,
  location_data jsonb,
  related_id text,
  related_type text,
  status text not null default 'success',
  error_message text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.auth_logs (
  id bigserial primary key,
  level text not null default 'info',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Auth support and runtime settings
-- ---------------------------------------------------------------------------
create table if not exists public.email_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash varchar(64) not null,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.password_resets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash varchar(64) not null,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_preferences (
  user_id uuid primary key references public.users(id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_settings (
  key text primary key,
  value text not null default '',
  is_secret boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  action text not null,
  payload jsonb,
  result jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  type text not null default 'info',
  target text,
  title text not null,
  message text not null default '',
  sender_name text,
  sender_id uuid references public.users(id) on delete set null,
  session_id text,
  original_notif_id uuid references public.admin_notifications(id) on delete set null,
  is_urgent boolean not null default false,
  read boolean not null default false,
  is_read boolean not null default false,
  link text,
  action text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  session_id text unique,
  messages jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.design_overrides (
  id uuid primary key default gen_random_uuid(),
  component text not null,
  css_code text not null,
  styles jsonb not null default '{}'::jsonb,
  preset text not null default 'custom',
  description text,
  applied_by uuid references public.users(id) on delete set null,
  applied_at timestamptz not null default now(),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Attendance, enrollment, biometric verification, and WebAuthn
-- ---------------------------------------------------------------------------
create table if not exists public.school_location_config (
  id serial primary key,
  location_name text not null,
  latitude numeric(10,8) not null,
  longitude numeric(11,8) not null,
  radius_meters numeric(10,2) not null default 50,
  allowed_wifi_ssids text[] not null default '{}',
  allowed_ip_ranges text[] not null default '{}',
  is_active boolean not null default true,
  require_enrollment boolean not null default true,
  require_face_anchor boolean not null default true,
  require_device_binding boolean not null default false,
  ai_verification_threshold numeric(3,2) not null default 0.75,
  anti_spoofing_threshold numeric(3,2) not null default 0.90,
  min_anti_spoofing_layers integer not null default 6,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.biometric_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  reference_photo_url text,
  fingerprint_template text,
  biometric_type text not null default 'fingerprint',
  device_info jsonb not null default '{}'::jsonb,
  webauthn_credential_id text,
  enrollment_status text not null default 'pending',
  is_first_attendance_enrollment boolean not null default false,
  re_enrollment_allowed boolean not null default false,
  re_enrollment_reason text,
  re_enrollment_approved_by uuid references public.users(id) on delete set null,
  re_enrollment_approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attendance (
  id bigserial primary key,
  user_id uuid not null references public.users(id) on delete cascade,
  user_name text not null,
  user_role text not null,
  check_in_time timestamptz not null default now(),
  check_out_time timestamptz,
  latitude numeric(10,8),
  longitude numeric(11,8),
  location_accuracy numeric(10,2),
  photo_selfie_url text,
  fingerprint_hash text,
  wifi_ssid text,
  wifi_bssid text,
  device_info jsonb not null default '{}'::jsonb,
  network_info jsonb not null default '{}'::jsonb,
  ai_verification jsonb,
  status text not null default 'present',
  notes text,
  is_verified boolean not null default false,
  verified_at timestamptz,
  verified_by uuid references public.users(id) on delete set null,
  is_enrollment_attendance boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.biometric_reset_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  reason text,
  status text not null default 'pending',
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.users(id) on delete set null
);

create table if not exists public.webauthn_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  credential_id text not null unique,
  public_key text not null,
  counter bigint not null default 0,
  device_name text,
  device_type text,
  authenticator_type text,
  transports text[],
  last_used_at timestamptz,
  use_count integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.webauthn_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  challenge text not null,
  type text not null check (type in ('registration','authentication')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.event_qr_codes (
  id uuid primary key default gen_random_uuid(),
  event_id bigint not null references public.events(id) on delete cascade,
  code text not null unique,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.security_events (
  id bigserial primary key,
  user_id uuid references public.users(id) on delete set null,
  event_type text not null,
  severity text not null default 'LOW' check (severity in ('LOW','MEDIUM','HIGH','CRITICAL')),
  metadata jsonb not null default '{}'::jsonb,
  resolved boolean not null default false,
  resolved_at timestamptz,
  resolved_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_verification_logs (
  id bigserial primary key,
  user_id uuid references public.users(id) on delete set null,
  current_photo_url text not null,
  reference_photo_url text not null,
  face_detected boolean not null default false,
  match_score numeric(3,2) not null default 0 check (match_score between 0 and 1),
  is_live boolean not null default false,
  is_fake boolean not null default false,
  confidence numeric(3,2) not null default 0 check (confidence between 0 and 1),
  ai_provider text not null default 'basic-fallback',
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.error_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  error_type text not null default 'runtime_error',
  severity text not null default 'medium',
  error_message text,
  error_stack text,
  url text,
  method text default 'GET',
  status_code integer,
  user_id uuid references public.users(id) on delete set null,
  user_agent text,
  ip_address text,
  request_body jsonb,
  response_body jsonb,
  headers jsonb,
  context jsonb,
  ai_analysis jsonb,
  fix_status text not null default 'pending',
  fix_applied_at timestamptz,
  applied_fix text
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists users_role_idx on public.users(role);
create index if not exists users_sekbid_idx on public.users(sekbid_id);
create index if not exists posts_status_idx on public.posts(status);
create index if not exists posts_published_idx on public.posts(published_at desc);
create index if not exists events_start_idx on public.events(start_date);
create index if not exists members_sekbid_idx on public.members(sekbid_id);
create index if not exists members_order_idx on public.members(display_order);
create index if not exists gallery_created_idx on public.gallery(created_at desc);
create index if not exists program_kerja_sekbid_idx on public.program_kerja(sekbid_id);
create index if not exists poll_options_poll_idx on public.poll_options(poll_id, order_index);
create index if not exists poll_votes_poll_idx on public.poll_votes(poll_id);
create index if not exists activity_logs_created_idx on public.activity_logs(created_at desc);
create index if not exists activity_logs_user_idx on public.activity_logs(user_id, created_at desc);
create index if not exists error_logs_created_idx on public.error_logs(created_at desc);
create index if not exists error_logs_status_idx on public.error_logs(fix_status);
create index if not exists attendance_user_time_idx on public.attendance(user_id, check_in_time desc);
create index if not exists security_events_created_idx on public.security_events(created_at desc);
create index if not exists biometric_reset_user_idx on public.biometric_reset_requests(user_id, status);
create index if not exists webauthn_challenges_expiry_idx on public.webauthn_challenges(expires_at);
create index if not exists notifications_user_idx on public.admin_notifications(user_id, created_at desc);
create index if not exists page_content_category_idx on public.page_content(category);
create index if not exists comments_content_idx on public.comments(content_id, content_type);
create unique index if not exists poll_votes_user_unique on public.poll_votes(poll_id, user_id) where user_id is not null;
create unique index if not exists content_likes_unique on public.content_likes(content_id, content_type, user_id) where user_id is not null;
create unique index if not exists content_views_unique on public.content_views(content_id, content_type, viewer_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'users','profiles','sekbid','members','posts','events','program_kerja','gallery',
    'announcements','polls','page_content','comments','email_verifications',
    'password_resets','user_preferences','admin_settings','chat_sessions',
    'school_location_config','biometric_data','attendance','webauthn_credentials'
  ] LOOP
    EXECUTE format('drop trigger if exists %I on public.%I', table_name || '_updated_at', table_name);
    EXECUTE format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', table_name || '_updated_at', table_name);
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- Safe non-secret defaults. School-specific settings must be configured later.
-- ---------------------------------------------------------------------------
insert into public.admin_settings (key, value, is_secret) values
  ('ALLOW_ADMIN_OPS', 'false', false),
  ('ALLOW_UNSAFE_TERMINAL', 'false', false),
  ('ADMIN_OPS_TOKEN', '', true),
  ('wifi_required', 'false', false),
  ('location_required', 'true', false)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- RLS
-- The Next.js server uses service_role for database writes. Public browser reads
-- are limited to intentionally public content. No sensitive table is public-read.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'users','profiles','sekbid','members','posts','events','event_registrations',
    'program_kerja','gallery','announcements','polls','poll_options','poll_votes',
    'page_content','comments','comment_likes','content_views','content_likes',
    'activity_logs','auth_logs','email_verifications','password_resets','user_preferences',
    'admin_settings','admin_actions','admin_notifications','chat_sessions','design_overrides',
    'school_location_config','biometric_data','attendance','biometric_reset_requests',
    'webauthn_credentials','webauthn_challenges','event_qr_codes','security_events',
    'ai_verification_logs','error_logs'
  ] LOOP
    EXECUTE format('alter table public.%I enable row level security', table_name);
  END LOOP;
END;
$$;

-- Public read policies used by public pages and client-side homepage fetches.
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['sekbid','members','posts','events','gallery','announcements','polls','poll_options','page_content','comments','content_views','content_likes'] LOOP
    EXECUTE format('drop policy if exists public_read on public.%I', table_name);
    EXECUTE format('create policy public_read on public.%I for select to anon, authenticated using (true)', table_name);
  END LOOP;
END;
$$;

-- Public error logging is intentionally insert-only. It is required by the
-- global browser error handler, while reads remain service-role/admin only.
drop policy if exists public_insert on public.error_logs;
create policy public_insert on public.error_logs for insert to anon, authenticated with check (true);

drop policy if exists public_comment_insert on public.comments;
create policy public_comment_insert on public.comments for insert to anon, authenticated with check (true);

drop policy if exists public_view_insert on public.content_views;
create policy public_view_insert on public.content_views for insert to anon, authenticated with check (true);

drop policy if exists public_like_insert on public.content_likes;
create policy public_like_insert on public.content_likes for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists public_like_delete on public.content_likes;
create policy public_like_delete on public.content_likes for delete to authenticated using (auth.uid() = user_id);

-- Users can see and manage only their own client-owned records.
drop policy if exists own_profile on public.profiles;
create policy own_profile on public.profiles for select to authenticated using (auth.uid() = id);
drop policy if exists own_preferences on public.user_preferences;
create policy own_preferences on public.user_preferences for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists own_comments_delete on public.comments;
create policy own_comments_delete on public.comments for delete to authenticated using (auth.uid() = author_id);
drop policy if exists own_attendance on public.attendance;
create policy own_attendance on public.attendance for select to authenticated using (auth.uid() = user_id);
drop policy if exists own_biometric on public.biometric_data;
create policy own_biometric on public.biometric_data for select to authenticated using (auth.uid() = user_id);
drop policy if exists own_webauthn on public.webauthn_credentials;
create policy own_webauthn on public.webauthn_credentials for select to authenticated using (auth.uid() = user_id);

-- Service role is intentionally explicit for privileged API access.
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'users','profiles','sekbid','members','posts','events','event_registrations',
    'program_kerja','gallery','announcements','polls','poll_options','poll_votes',
    'page_content','comments','comment_likes','content_views','content_likes',
    'activity_logs','auth_logs','email_verifications','password_resets','user_preferences',
    'admin_settings','admin_actions','admin_notifications','chat_sessions','design_overrides',
    'school_location_config','biometric_data','attendance','biometric_reset_requests',
    'webauthn_credentials','webauthn_challenges','event_qr_codes','security_events',
    'ai_verification_logs','error_logs'
  ] LOOP
    EXECUTE format('drop policy if exists service_role_all on public.%I', table_name);
    EXECUTE format('create policy service_role_all on public.%I for all to service_role using (true) with check (true)', table_name);
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- Storage buckets. Files are private by default; APIs issue signed URLs.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('gallery', 'gallery', false, 10485760, array['image/jpeg','image/png','image/gif','image/webp','image/svg+xml']),
  ('attendance', 'attendance', false, 10485760, array['image/jpeg','image/png','image/webp']),
  ('avatars', 'avatars', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Service role handles uploads. Authenticated users may read only through
-- signed URLs generated by the server, so no broad storage read policy exists.

-- ---------------------------------------------------------------------------
-- Verification result. This query is safe to run after the transaction commits.
-- ---------------------------------------------------------------------------
commit;

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'users','sekbid','members','posts','events','gallery','announcements','polls',
    'poll_options','page_content','comments','activity_logs','admin_settings',
    'attendance','biometric_data','webauthn_credentials','security_events','error_logs'
  )
order by table_name;

select id, name, public
from storage.buckets
where id in ('gallery','attendance','avatars')
order by id;
