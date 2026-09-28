-- ═══════════════════════════════════════════════════════════════════════════
-- RAPIKKAN ID SEKBID
-- Kondisi : 1, 2, 3, 4, 64, 65  →  menjadi  1, 2, 3, 4, 5, 6
--
-- CARA PAKAI:
--   1. Buka Supabase Dashboard → project vyorjqbrugjjeioayscg
--   2. Menu "SQL Editor" → "New query"
--   3. Tempel seluruh isi file ini → klik "Run"
--   4. Selesai. Insert sekbid berikutnya otomatis dapat id 7.
--
-- Aman dijalankan sekali saja (ada penjaga id 5/6 kosong di awal).
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- 0) Penjaga: id 5 dan 6 harus benar-benar kosong sebelum dipakai
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM sekbid WHERE id IN (5, 6)) THEN
    RAISE EXCEPTION 'ID 5 atau 6 sudah terpakai — periksa data dulu sebelum menjalankan script ini';
  END IF;
END $$;

-- 1) Pindahkan SEMUA referensi (members, gallery, proker, events, ...)
--    dari id 64/65 → 5/6, di setiap tabel yang punya kolom sekbid_id
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'sekbid_id'
  LOOP
    EXECUTE format(
      'UPDATE %I SET sekbid_id = CASE sekbid_id WHEN 64 THEN 5 WHEN 65 THEN 6 END WHERE sekbid_id IN (64, 65)',
      r.table_name
    );
    RAISE NOTICE 'referensi diperbarui di tabel %', r.table_name;
  END LOOP;
END $$;

-- 2) Rapikan id sekbid
UPDATE sekbid SET id = 5 WHERE id = 64;
UPDATE sekbid SET id = 6 WHERE id = 65;

-- 3) Sinkronkan sequence supaya insert berikutnya mendapat id 7 (bukan 66)
SELECT setval(
  pg_get_serial_sequence('sekbid', 'id'),
  (SELECT MAX(id) FROM sekbid)
);

COMMIT;

-- Verifikasi hasil
SELECT id, name FROM sekbid ORDER BY id;
