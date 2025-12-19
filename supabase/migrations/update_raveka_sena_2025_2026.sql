-- Migration: Update OSIS data to Raveka Sena 2025-2026
-- Created: 2025-12-19
-- Description: Update nama kabinet dari Dirgantara ke Raveka Sena dan data organisasi lainnya

-- 1. Update Visi OSIS
UPDATE admin_settings 
SET value = 'Menjadi organisasi yang membersamai terbentuknya karakter siswa yang KAMIL dan inovatif'
WHERE key = 'SITE_VISI';

INSERT INTO admin_settings (key, value) 
VALUES ('SITE_VISI', 'Menjadi organisasi yang membersamai terbentuknya karakter siswa yang KAMIL dan inovatif')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Update Misi OSIS (6 poin)
UPDATE admin_settings 
SET value = '1. Menciptakan program kerja yang inovatif dan menarik
2. Menerapkan penggunaan teknologi dalam setiap kegiatan
3. Menanamkan nilai-nilai karakter Islam pada seluruh siswa
4. Menumbuhkan rasa peduli terhadap lingkungan
5. Meningkatkan kedisiplinan seluruh warga sekolah
6. Mengembangkan jiwa kewirausahaan siswa'
WHERE key = 'SITE_MISI';

INSERT INTO admin_settings (key, value) 
VALUES ('SITE_MISI', '1. Menciptakan program kerja yang inovatif dan menarik
2. Menerapkan penggunaan teknologi dalam setiap kegiatan
3. Menanamkan nilai-nilai karakter Islam pada seluruh siswa
4. Menumbuhkan rasa peduli terhadap lingkungan
5. Meningkatkan kedisiplinan seluruh warga sekolah
6. Mengembangkan jiwa kewirausahaan siswa')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 3. Update Filosofi Nama OSIS
INSERT INTO admin_settings (key, value) 
VALUES ('SITE_FILOSOFI_NAMA', 'Raveka Sena terdiri dari dua kata: "Raveka" yang berarti sinar terang dan "Sena" yang berarti pasukan. Gabungan keduanya bermakna "pasukan yang menjadi sinar terang" - melambangkan semangat OSIS untuk membawa cahaya perubahan, inovasi, dan inspirasi bagi seluruh siswa.')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 4. Update Nama Kabinet
INSERT INTO admin_settings (key, value) 
VALUES ('SITE_KABINET_NAME', 'Raveka Sena')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 5. Update Tahun Jabatan
INSERT INTO admin_settings (key, value) 
VALUES ('SITE_TAHUN_JABATAN', '2025-2026')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 6. Update Kontak Telepon OSIS
INSERT INTO admin_settings (key, value) 
VALUES ('contact_phone', '089625276080')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 7. Update Page Content untuk hero subtitle
UPDATE page_content 
SET content = 'Raveka Sena 2025-2026'
WHERE page_key = 'home_hero_subtitle';

-- 8. Update About page description
UPDATE page_content 
SET content = 'OSIS SMK Informatika Fithrah Insani - Raveka Sena adalah organisasi siswa yang aktif, kreatif, dan berprestasi. Nama Raveka Sena berarti "pasukan yang menjadi sinar terang".'
WHERE page_key = 'about_description';

-- 9. Update visi di page_content
UPDATE page_content 
SET content = 'Menjadi organisasi yang membersamai terbentuknya karakter siswa yang KAMIL dan inovatif'
WHERE page_key = 'visi';

-- 10. Update misi di page_content
UPDATE page_content 
SET content = '1. Menciptakan program kerja yang inovatif dan menarik
2. Menerapkan penggunaan teknologi dalam setiap kegiatan
3. Menanamkan nilai-nilai karakter Islam pada seluruh siswa
4. Menumbuhkan rasa peduli terhadap lingkungan
5. Meningkatkan kedisiplinan seluruh warga sekolah
6. Mengembangkan jiwa kewirausahaan siswa'
WHERE page_key = 'misi';

-- Done!
-- Commit this migration to update all OSIS data to Raveka Sena 2025-2026
