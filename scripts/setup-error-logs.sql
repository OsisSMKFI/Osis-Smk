-- ============================================================================
-- TABEL error_logs: sistem deteksi + AI analisis error (admin panel)
--
-- GANGGUAN YANG DIPERBAIKI:
--   * Error "Could not find the 'ai_analyzed' column of 'error_logs'" saat
--     klik Analyze di /admin/errors — tabel sudah ADA tetapi kolom AI lama
--     tidak ada (CREATE TABLE IF NOT EXISTS tidak mengubah tabel lama)
--   * /api/errors/log selalu "console-only" -> error tak tersimpan
--
-- CARA PAKAI:
--   Supabase Dashboard -> SQL Editor -> New query -> tempel isi file ini -> Run
--   (Aman dijalankan berulang — semua langkah IF NOT EXISTS)
-- ============================================================================

-- 1) Buat tabel kalau benar-benar belum ada
CREATE TABLE IF NOT EXISTS public.error_logs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type       text,
  severity         text DEFAULT 'error',
  message          text,
  stack_trace      text,
  error_code       text,
  page_url         text,
  api_endpoint     text,
  request_method   text,
  request_body     jsonb,
  response_status  integer,
  environment      text DEFAULT 'production',
  browser          text,
  os               text,
  device_type      text,
  ip_address       text,
  user_agent       text,
  metadata         jsonb DEFAULT '{}'::jsonb,
  user_id          text,
  user_email       text,
  user_role        text,
  occurrence_count integer DEFAULT 1,
  first_occurred_at timestamptz DEFAULT now(),
  last_occurred_at  timestamptz DEFAULT now(),
  created_at       timestamptz DEFAULT now(),
  deleted_at       timestamptz,
  ai_analyzed      boolean DEFAULT false,
  ai_risk_level    text,
  ai_category      text,
  ai_suggestions   jsonb,
  ai_analysis      jsonb,
  fix_status       text DEFAULT 'pending',
  auto_fixable     boolean DEFAULT false,
  auto_fix_applied boolean DEFAULT false,
  auto_fix_details jsonb,
  applied_fix      jsonb,
  status           text DEFAULT 'open',
  resolved_at      timestamptz,
  resolved_by      text,
  resolution_notes text
);

-- 2) Tambahkan kolom yang BELUM ada pada tabel lama (ini fix utamanya)
DO $$
BEGIN
  -- Detail error
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='error_type') THEN ALTER TABLE public.error_logs ADD COLUMN error_type text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='severity') THEN ALTER TABLE public.error_logs ADD COLUMN severity text DEFAULT 'error'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='message') THEN ALTER TABLE public.error_logs ADD COLUMN message text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='stack_trace') THEN ALTER TABLE public.error_logs ADD COLUMN stack_trace text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='error_code') THEN ALTER TABLE public.error_logs ADD COLUMN error_code text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='page_url') THEN ALTER TABLE public.error_logs ADD COLUMN page_url text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='api_endpoint') THEN ALTER TABLE public.error_logs ADD COLUMN api_endpoint text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='request_method') THEN ALTER TABLE public.error_logs ADD COLUMN request_method text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='request_body') THEN ALTER TABLE public.error_logs ADD COLUMN request_body jsonb; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='response_status') THEN ALTER TABLE public.error_logs ADD COLUMN response_status integer; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='environment') THEN ALTER TABLE public.error_logs ADD COLUMN environment text DEFAULT 'production'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='browser') THEN ALTER TABLE public.error_logs ADD COLUMN browser text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='os') THEN ALTER TABLE public.error_logs ADD COLUMN os text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='device_type') THEN ALTER TABLE public.error_logs ADD COLUMN device_type text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='ip_address') THEN ALTER TABLE public.error_logs ADD COLUMN ip_address text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='user_agent') THEN ALTER TABLE public.error_logs ADD COLUMN user_agent text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='metadata') THEN ALTER TABLE public.error_logs ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb; END IF;

  -- Konteks pelapor
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='user_id') THEN ALTER TABLE public.error_logs ADD COLUMN user_id text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='user_email') THEN ALTER TABLE public.error_logs ADD COLUMN user_email text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='user_role') THEN ALTER TABLE public.error_logs ADD COLUMN user_role text; END IF;

  -- Deduplikasi
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='occurrence_count') THEN ALTER TABLE public.error_logs ADD COLUMN occurrence_count integer DEFAULT 1; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='first_occurred_at') THEN ALTER TABLE public.error_logs ADD COLUMN first_occurred_at timestamptz DEFAULT now(); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='last_occurred_at') THEN ALTER TABLE public.error_logs ADD COLUMN last_occurred_at timestamptz DEFAULT now(); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='created_at') THEN ALTER TABLE public.error_logs ADD COLUMN created_at timestamptz DEFAULT now(); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='deleted_at') THEN ALTER TABLE public.error_logs ADD COLUMN deleted_at timestamptz; END IF;

  -- AI analysis (kolom yang menyebabkan error Analyze)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='ai_analyzed') THEN ALTER TABLE public.error_logs ADD COLUMN ai_analyzed boolean DEFAULT false; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='ai_risk_level') THEN ALTER TABLE public.error_logs ADD COLUMN ai_risk_level text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='ai_category') THEN ALTER TABLE public.error_logs ADD COLUMN ai_category text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='ai_suggestions') THEN ALTER TABLE public.error_logs ADD COLUMN ai_suggestions jsonb; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='ai_analysis') THEN ALTER TABLE public.error_logs ADD COLUMN ai_analysis jsonb; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='fix_status') THEN ALTER TABLE public.error_logs ADD COLUMN fix_status text DEFAULT 'pending'; END IF;

  -- Ajukan / terapkan fix
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='auto_fixable') THEN ALTER TABLE public.error_logs ADD COLUMN auto_fixable boolean DEFAULT false; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='auto_fix_applied') THEN ALTER TABLE public.error_logs ADD COLUMN auto_fix_applied boolean DEFAULT false; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='auto_fix_details') THEN ALTER TABLE public.error_logs ADD COLUMN auto_fix_details jsonb; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='applied_fix') THEN ALTER TABLE public.error_logs ADD COLUMN applied_fix jsonb; END IF;

  -- Penyelesaian manual
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='status') THEN ALTER TABLE public.error_logs ADD COLUMN status text DEFAULT 'open'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='resolved_at') THEN ALTER TABLE public.error_logs ADD COLUMN resolved_at timestamptz; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='resolved_by') THEN ALTER TABLE public.error_logs ADD COLUMN resolved_by text; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='resolution_notes') THEN ALTER TABLE public.error_logs ADD COLUMN resolution_notes text; END IF;
END $$;

-- 3) Migrasi data dari kolom lama (error_message/url/method/...) ke nama baru,
--    supaya error yang sudah tercatat sebelumnya tampil di panel
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='error_message')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='message') THEN
    UPDATE public.error_logs SET message = COALESCE(message, error_message) WHERE message IS NULL AND error_message IS NOT NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='error_stack')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='stack_trace') THEN
    UPDATE public.error_logs SET stack_trace = COALESCE(stack_trace, error_stack) WHERE stack_trace IS NULL AND error_stack IS NOT NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='url')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='page_url') THEN
    UPDATE public.error_logs SET page_url = COALESCE(page_url, url) WHERE page_url IS NULL AND url IS NOT NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='method')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='request_method') THEN
    UPDATE public.error_logs SET request_method = COALESCE(request_method, method) WHERE request_method IS NULL AND method IS NOT NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='status_code')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='response_status') THEN
    UPDATE public.error_logs SET response_status = COALESCE(response_status, status_code) WHERE response_status IS NULL AND status_code IS NOT NULL;
  END IF;
END $$;

-- 4) Index
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON public.error_logs (severity);

-- 5) Reload schema cache PostgREST
NOTIFY pgrst, 'reload schema';

-- 6) Verifikasi akhir — harus muncul semua kolom, termasuk ai_analyzed & ai_analysis
SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) AS error_logs_columns
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'error_logs';
