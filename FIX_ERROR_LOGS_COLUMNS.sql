-- FIX_ERROR_LOGS_COLUMNS.sql
-- Script untuk memperbaiki struktur tabel error_logs
-- Masalah: Kolom 'error_message' tidak ditemukan (PGRST204)
-- Ada inkonsistensi: beberapa API menggunakan 'message', yang lain 'error_message'

-- ==========================================
-- SOLUSI: Buat kedua kolom tersedia
-- ==========================================

-- Langkah 1: Tambahkan error_message jika belum ada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'error_logs' 
    AND column_name = 'error_message'
  ) THEN
    ALTER TABLE public.error_logs ADD COLUMN error_message TEXT;
    RAISE NOTICE 'Kolom error_message ditambahkan';
  ELSE
    RAISE NOTICE 'Kolom error_message sudah ada';
  END IF;
END
$$;

-- Langkah 2: Tambahkan message jika belum ada (untuk backward compatibility)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'error_logs' 
    AND column_name = 'message'
  ) THEN
    ALTER TABLE public.error_logs ADD COLUMN message TEXT;
    RAISE NOTICE 'Kolom message ditambahkan';
  ELSE
    RAISE NOTICE 'Kolom message sudah ada';
  END IF;
END
$$;

-- Langkah 3: Sinkronkan data antara kedua kolom
UPDATE public.error_logs
SET error_message = COALESCE(error_message, message)
WHERE error_message IS NULL AND message IS NOT NULL;

UPDATE public.error_logs
SET message = COALESCE(message, error_message)
WHERE message IS NULL AND error_message IS NOT NULL;

-- Langkah 4: Buat trigger untuk menjaga sinkronisasi
CREATE OR REPLACE FUNCTION sync_error_message_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Sinkronkan error_message dan message
  IF NEW.error_message IS NOT NULL AND NEW.message IS NULL THEN
    NEW.message := NEW.error_message;
  ELSIF NEW.message IS NOT NULL AND NEW.error_message IS NULL THEN
    NEW.error_message := NEW.message;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sync_error_message ON public.error_logs;
CREATE TRIGGER tr_sync_error_message
  BEFORE INSERT OR UPDATE ON public.error_logs
  FOR EACH ROW
  EXECUTE FUNCTION sync_error_message_columns();

-- Langkah 5: Tambahkan error_stack jika belum ada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'error_logs' 
    AND column_name = 'error_stack'
  ) THEN
    ALTER TABLE public.error_logs ADD COLUMN error_stack TEXT;
    RAISE NOTICE 'Kolom error_stack ditambahkan';
  END IF;
END
$$;

-- Langkah 6: Tambahkan stack_trace jika belum ada (backward compatibility)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'error_logs' 
    AND column_name = 'stack_trace'
  ) THEN
    ALTER TABLE public.error_logs ADD COLUMN stack_trace TEXT;
    RAISE NOTICE 'Kolom stack_trace ditambahkan';
  END IF;
END
$$;

-- Sinkronkan stack data
UPDATE public.error_logs
SET error_stack = COALESCE(error_stack, stack_trace)
WHERE error_stack IS NULL AND stack_trace IS NOT NULL;

UPDATE public.error_logs
SET stack_trace = COALESCE(stack_trace, error_stack)
WHERE stack_trace IS NULL AND error_stack IS NOT NULL;

-- Langkah 7: Pastikan kolom lainnya yang dibutuhkan ada
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
  
  -- occurrence_count
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='occurrence_count') THEN
    ALTER TABLE public.error_logs ADD COLUMN occurrence_count INTEGER DEFAULT 1;
    RAISE NOTICE 'Kolom occurrence_count ditambahkan';
  END IF;
  
  -- last_occurred_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='last_occurred_at') THEN
    ALTER TABLE public.error_logs ADD COLUMN last_occurred_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE 'Kolom last_occurred_at ditambahkan';
  END IF;
  
  -- deleted_at (soft delete)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='error_logs' AND column_name='deleted_at') THEN
    ALTER TABLE public.error_logs ADD COLUMN deleted_at TIMESTAMPTZ;
    RAISE NOTICE 'Kolom deleted_at ditambahkan';
  END IF;
END
$$;

-- Langkah 8: Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Langkah 9: Verifikasi hasil
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'error_logs'
ORDER BY ordinal_position;

-- Output pesan sukses
DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'FIX SELESAI! Tabel error_logs sudah diperbaiki.';
  RAISE NOTICE 'Kedua kolom error_message dan message sekarang tersedia.';
  RAISE NOTICE 'Trigger sinkronisasi sudah aktif.';
  RAISE NOTICE '===========================================';
END
$$;
