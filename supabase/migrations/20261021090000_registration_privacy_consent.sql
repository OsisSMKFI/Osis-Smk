-- Record explicit privacy notice acceptance for newly registered accounts.
-- Existing accounts remain NULL: their historical consent must not be fabricated.
alter table public.users
  add column if not exists privacy_consent_version text,
  add column if not exists privacy_consent_at timestamptz;
