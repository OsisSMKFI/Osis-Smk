-- ============================================================
-- CLEANUP LOGS — jalankan sekali di Supabase SQL Editor
-- Bersihkan: baris probe test, duplikat error, data melebihi retensi
-- ============================================================

-- 1) Reload schema cache PostgREST (PENTING: insert & filter error_logs
--    butuh cache sinkron setelah ALTER kolom)
NOTIFY pgrst, 'reload schema';

-- 2) Hapus baris probe verifikasi test (error_logs)
DELETE FROM public.error_logs
WHERE error_type IN ('verify_after_sql', 'probe', 'verification')
   OR message ILIKE 'verify%'
   OR message ILIKE 'probe%'
   OR message ILIKE '__probe__%';

-- 3) Hapus komentar probe test (kalau masih tersisa)
DELETE FROM public.comments WHERE content_id = '__probe__';

-- 4) Gabungkan duplikat error 24 jam terakhir —
--    sisakan hanya baris TERBARU per pesan+tipe
DELETE FROM public.error_logs e
USING public.error_logs keep
WHERE e.message IS NOT NULL
  AND keep.message IS NOT NULL
  AND e.message = keep.message
  AND COALESCE(e.error_type, '') = COALESCE(keep.error_type, '')
  AND e.created_at < keep.created_at
  AND keep.created_at > now() - interval '24 hours'
  AND e.created_at > now() - interval '24 hours';

-- 5) Retensi: activity 14 hari, error 30 hari
--    (setelah ini, aplikasi juga membersihkan otomatis tiap 6 jam)
DELETE FROM public.activity_logs WHERE created_at < now() - interval '14 days';
DELETE FROM public.error_logs    WHERE created_at < now() - interval '30 days';

-- 6) Verifikasi hasil
SELECT
  (SELECT count(*) FROM public.error_logs)    AS error_logs_sisa,
  (SELECT count(*) FROM public.activity_logs) AS activity_logs_sisa;
