-- ============================================================================
-- FITUR KOMENTAR: kolom yang kurang di tabel comments + tabel comment_likes
--
-- GANGGUAN YANG DIPERBAIKI:
--   * POST komentar error 500 "Could not find the 'parent_id' column"
--   * Fitur like komentar tidak tersimpan (tabel comment_likes belum ada)
--   * Reply tidak menempel (parent_id belum ada)
--
-- CARA PAKAI:
--   Supabase Dashboard -> SQL Editor -> New query -> tempel isi file ini -> Run
--   (Aman dijalankan berulang; semua langkah IF NOT EXISTS)
-- ============================================================================

-- 1) Lihat struktur sekarang (harus muncul tabel comments & comment_likes)
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name IN ('comments', 'comment_likes')
ORDER BY table_name, ordinal_position;

-- 2) Tambah kolom comments yang belum ada (tipe mengikuti kolom id yang ada)
DO $$
DECLARE
  c_id_type text;
  u_id_type text;
BEGIN
  SELECT data_type INTO c_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'id';
  IF c_id_type IS NULL THEN
    RAISE EXCEPTION 'Tabel public.comments tidak ditemukan';
  END IF;

  SELECT data_type INTO u_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id';
  IF u_id_type IS NULL THEN
    u_id_type := 'text';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'parent_id') THEN
    EXECUTE format('ALTER TABLE public.comments ADD COLUMN parent_id %s', c_id_type);
    RAISE NOTICE 'Ditambahkan: comments.parent_id (%)', c_id_type;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'user_id') THEN
    EXECUTE format('ALTER TABLE public.comments ADD COLUMN user_id %s', u_id_type);
    RAISE NOTICE 'Ditambahkan: comments.user_id (%)', u_id_type;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'author_id') THEN
    EXECUTE format('ALTER TABLE public.comments ADD COLUMN author_id %s', u_id_type);
    RAISE NOTICE 'Ditambahkan: comments.author_id (%)', u_id_type;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'is_anonymous') THEN
    ALTER TABLE public.comments ADD COLUMN is_anonymous boolean DEFAULT false;
    RAISE NOTICE 'Ditambahkan: comments.is_anonymous';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'updated_at') THEN
    ALTER TABLE public.comments ADD COLUMN updated_at timestamptz DEFAULT now();
    RAISE NOTICE 'Ditambahkan: comments.updated_at';
  END IF;
END $$;

-- 3) Tabel like komentar (belum ada di banyak instalasi)
DO $$
DECLARE
  c_id_type text;
  u_id_type text;
BEGIN
  SELECT data_type INTO c_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'id';
  IF c_id_type IS NULL THEN
    RAISE EXCEPTION 'Tabel public.comments tidak ditemukan';
  END IF;

  SELECT data_type INTO u_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id';
  IF u_id_type IS NULL THEN
    u_id_type := 'text';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comment_likes') THEN
    EXECUTE format(
      'CREATE TABLE public.comment_likes (
         comment_id %s NOT NULL,
         user_id %s NOT NULL,
         created_at timestamptz DEFAULT now(),
         PRIMARY KEY (comment_id, user_id)
       )',
      c_id_type, u_id_type
    );
    RAISE NOTICE 'Dibuat: tabel public.comment_likes';
  END IF;
END $$;

-- 4) Reload schema cache PostgREST (aman, tidak mengubah data)
NOTIFY pgrst, 'reload schema';

-- 5) Hapus komentar probe pengujian (tidak tampil di halaman mana pun)
DELETE FROM public.comments WHERE content_id = '__probe__';

-- 6) Verifikasi akhir — kedua tabel harus muncul dgn kolom lengkap
SELECT table_name, string_agg(column_name, ', ' ORDER BY ordinal_position) AS columns
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name IN ('comments', 'comment_likes')
GROUP BY table_name;
