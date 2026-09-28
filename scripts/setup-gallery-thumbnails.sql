-- ============================================================================
-- THUMBNAIL VIDEO GALERI
-- Menambah kolom poster/thumbnail utk item video - dipakai sebagai
-- preview saat share link (WhatsApp / Discord / Facebook / Twitter).
--
-- CARA PAKAI:
--   Supabase Dashboard -> SQL Editor -> New query -> tempel isi file ini -> Run
--
-- SETELAH RUN: kolom wajib muncul di daftar hasil SELECT terakhir.
-- Lalu kembali ke Admin -> Galeri -> Edit video -> Ambil frame -> Simpan.
-- ============================================================================

ALTER TABLE public.gallery ADD COLUMN IF NOT EXISTS thumbnail_url text;

-- Supabase/PostgREST menolak kolom baru sampai cache skema di-reload.
-- Perintah ini aman (tidak mengubah data), hanya memberi sinyal reload.
NOTIFY pgrst, 'reload schema';

-- VERIFIKASI: "thumbnail_url" HARUS muncul di hasil ini.
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'gallery'
ORDER BY ordinal_position;

-- VERIFIKASI AKHIR: tidak boleh ada error "column thumbnail_url does not exist".
SELECT id, title, thumbnail_url FROM public.gallery ORDER BY id;
