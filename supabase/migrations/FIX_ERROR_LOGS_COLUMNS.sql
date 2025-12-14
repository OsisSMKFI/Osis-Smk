-- FIX_ERROR_LOGS_COLUMNS.sql
-- Script untuk memperbaiki struktur tabel error_logs
-- Masalah: Kolom 'error_message' tidak ditemukan (PGRST204)

-- Pertama, cek struktur tabel saat ini dan tambahkan kolom yang hilang

-- Tambahkan kolom error_message jika belum ada (alias dari message)
DO $$
BEGIN
  -- Jika kolom 'error_message' tidak ada, tambahkan
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'error_logs' 
    AND column_name = 'error_message'
  ) THEN
    -- Cek apakah ada kolom 'message' yang bisa di-rename
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'error_logs' 
      AND column_name = 'message'
    ) THEN
      -- Rename message ke error_message
      ALTER TABLE public.error_logs RENAME COLUMN message TO error_message;
      RAISE NOTICE 'Kolom message di-rename ke error_message';
    ELSE
      -- Tambahkan kolom error_message baru
      ALTER TABLE public.error_logs ADD COLUMN error_message TEXT;
      RAISE NOTICE 'Kolom error_message ditambahkan';
    END IF;
  ELSE
    RAISE NOTICE 'Kolom error_message sudah ada';
  END IF;
END
$$;

-- Tambahkan kolom error_stack jika belum ada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'error_logs' 
    AND column_name = 'error_stack'
  ) THEN
    -- Cek apakah ada kolom 'stack_trace' yang bisa di-rename
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'error_logs' 
      AND column_name = 'stack_trace'
    ) THEN
      ALTER TABLE public.error_logs RENAME COLUMN stack_trace TO error_stack;
      RAISE NOTICE 'Kolom stack_trace di-rename ke error_stack';
    ELSE
      ALTER TABLE public.error_logs ADD COLUMN error_stack TEXT;
      RAISE NOTICE 'Kolom error_stack ditambahkan';
    END IF;
  ELSE
    RAISE NOTICE 'Kolom error_stack sudah ada';
  END IF;
END
$$;

-- Pastikan kolom lainnya yang dibutuhkan ada
DO $$
BEGIN
  -- url
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='url') THEN
    ALTER TABLE public.error_logs ADD COLUMN url TEXT;
    RAISE NOTICE 'Kolom url ditambahkan';
  END IF;
  
  -- method
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='method') THEN
    ALTER TABLE public.error_logs ADD COLUMN method TEXT DEFAULT 'GET';
    RAISE NOTICE 'Kolom method ditambahkan';
  END IF;
  
  -- status_code
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='status_code') THEN
    ALTER TABLE public.error_logs ADD COLUMN status_code INTEGER;
    RAISE NOTICE 'Kolom status_code ditambahkan';
  END IF;
  
  -- user_agent
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='user_agent') THEN
    ALTER TABLE public.error_logs ADD COLUMN user_agent TEXT;
    RAISE NOTICE 'Kolom user_agent ditambahkan';
  END IF;
  
  -- ip_address
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='ip_address') THEN
    ALTER TABLE public.error_logs ADD COLUMN ip_address TEXT;
    RAISE NOTICE 'Kolom ip_address ditambahkan';
  END IF;
  
  -- context
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='context') THEN
    ALTER TABLE public.error_logs ADD COLUMN context JSONB;
    RAISE NOTICE 'Kolom context ditambahkan';
  END IF;
  
  -- severity
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='severity') THEN
    ALTER TABLE public.error_logs ADD COLUMN severity TEXT DEFAULT 'medium';
    RAISE NOTICE 'Kolom severity ditambahkan';
  END IF;
  
  -- error_type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='error_type') THEN
    ALTER TABLE public.error_logs ADD COLUMN error_type TEXT DEFAULT 'runtime_error';
    RAISE NOTICE 'Kolom error_type ditambahkan';
  END IF;
END
$$;

-- Refresh schema cache dengan mengubah timestamp
NOTIFY pgrst, 'reload schema';

-- Verifikasi hasil
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'error_logs'
ORDER BY ordinal_position;
