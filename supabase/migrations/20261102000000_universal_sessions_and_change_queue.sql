begin;

alter table public.users
  add column if not exists is_universal boolean not null default false;

create table if not exists public.app_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  session_key text not null unique,
  alias text,
  user_agent text,
  ip_address text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);
create index if not exists app_sessions_user_active_idx
  on public.app_sessions(user_id, last_seen_at desc) where revoked_at is null;
alter table public.app_sessions enable row level security;
revoke all on public.app_sessions from anon, authenticated;
grant all on public.app_sessions to service_role;

create table if not exists public.universal_change_proposals (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references public.users(id) on delete restrict,
  actor_session_id uuid references public.app_sessions(id) on delete set null,
  entity_type text not null,
  entity_id text,
  operation text not null check (operation in ('create','update','delete')),
  before_data jsonb,
  proposed_data jsonb not null,
  payload_sha256 text not null check (payload_sha256 ~ '^[a-f0-9]{64}$'),
  status text not null default 'pending' check (status in ('pending','approved','rejected','duplicate','conflict')),
  duplicate_of uuid references public.universal_change_proposals(id) on delete set null,
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists universal_proposals_pending_idx
  on public.universal_change_proposals(created_at desc) where status in ('pending','conflict');
alter table public.universal_change_proposals enable row level security;
revoke all on public.universal_change_proposals from anon, authenticated;
grant all on public.universal_change_proposals to service_role;

alter table public.piket_sessions
  add column if not exists device_session_key text not null default 'legacy';
drop index if exists public.piket_one_active_session_per_owner_day;
create unique index if not exists piket_one_active_session_per_device_day
  on public.piket_sessions(created_by, device_session_key, report_date) where is_active = true;

alter table public.piket_daily_approvals
  add column if not exists teacher_signature text;

commit;
