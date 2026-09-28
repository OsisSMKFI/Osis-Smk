-- ============================================================================
-- TABEL page_content: pastikan semua kolom yang dipakai aplikasi ADA
--
-- GANGGUAN YANG DIPERBAIKI:
--   * GET /api/public/background?key=... error "column page_content.content_type
--     does not exist" (semua key konten/design tak bisa dibaca)
--   * GET /api/admin/content 500 (select kolom eksplisit termasuk content_type)
--   * Simpan konten dari admin panel bisa gagal kalau title/published/updated_at
--     belum ada
--
-- CARA PAKAI:
--   Supabase Dashboard -> SQL Editor -> New query -> tempel isi file ini -> Run
--   (Aman dijalankan berulang — semua langkah IF NOT EXISTS, tidak mengubah
--    data yang sudah ada)
-- ============================================================================

-- 1) Lihat struktur sekarang
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'page_content'
ORDER BY ordinal_position;

-- 2) Tambah kolom yang belum ada
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='page_content' AND column_name='page_key') THEN
    ALTER TABLE public.page_content ADD COLUMN page_key text;
    RAISE NOTICE 'Ditambahkan: page_content.page_key';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='page_content' AND column_name='title') THEN
    ALTER TABLE public.page_content ADD COLUMN title text;
    RAISE NOTICE 'Ditambahkan: page_content.title';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='page_content' AND column_name='content') THEN
    ALTER TABLE public.page_content ADD COLUMN content text;
    RAISE NOTICE 'Ditambahkan: page_content.content';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='page_content' AND column_name='category') THEN
    ALTER TABLE public.page_content ADD COLUMN category text DEFAULT 'general';
    RAISE NOTICE 'Ditambahkan: page_content.category';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='page_content' AND column_name='content_type') THEN
    ALTER TABLE public.page_content ADD COLUMN content_type text DEFAULT 'text';
    RAISE NOTICE 'Ditambahkan: page_content.content_type';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='page_content' AND column_name='published') THEN
    ALTER TABLE public.page_content ADD COLUMN published boolean DEFAULT true;
    RAISE NOTICE 'Ditambahkan: page_content.published';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='page_content' AND column_name='created_at') THEN
    ALTER TABLE public.page_content ADD COLUMN created_at timestamptz DEFAULT now();
    RAISE NOTICE 'Ditambahkan: page_content.created_at';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='page_content' AND column_name='updated_at') THEN
    ALTER TABLE public.page_content ADD COLUMN updated_at timestamptz DEFAULT now();
    RAISE NOTICE 'Ditambahkan: page_content.updated_at';
  END IF;
END $$;

-- 3) Reload schema cache PostgREST
NOTIFY pgrst, 'reload schema';

-- 4) Verifikasi akhir
SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) AS page_content_columns
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'page_content';
