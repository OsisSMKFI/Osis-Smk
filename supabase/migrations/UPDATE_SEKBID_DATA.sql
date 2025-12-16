-- Update sekbid with proper descriptions
-- Run this in Supabase SQL Editor

UPDATE sekbid SET 
  description = 'Membina keimanan dan ketakwaan siswa melalui kegiatan keagamaan',
  name = 'Sekbid 1 - Keagamaan'
WHERE id = 1;

UPDATE sekbid SET 
  description = 'Meningkatkan kedisiplinan, tanggung jawab, dan keteladanan bagi seluruh siswa dan pengurus OSIS',
  name = 'Sekbid 2 - Kaderisasi'
WHERE id = 2;

UPDATE sekbid SET 
  description = 'Mengembangkan prestasi akademik dan non-akademik siswa',
  name = 'Sekbid 3 - Akademik'
WHERE id = 3;

UPDATE sekbid SET 
  description = 'Meningkatkan keterampilan dan jiwa wirausaha siswa',
  name = 'Sekbid 4 - Ekonomi Kreatif'
WHERE id = 4;

UPDATE sekbid SET 
  description = 'Menjaga kesehatan dan kelestarian lingkungan sekolah',
  name = 'Sekbid 5 - Kesehatan'
WHERE id = 5;

UPDATE sekbid SET 
  description = 'Mengelola informasi, dokumentasi, dan teknologi digital OSIS',
  name = 'Sekbid 6 - Kominfo'
WHERE id = 6;

-- Add display_name column if not exists
ALTER TABLE sekbid ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE sekbid ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE sekbid ADD COLUMN IF NOT EXISTS bg_color TEXT;
ALTER TABLE sekbid ADD COLUMN IF NOT EXISTS border_color TEXT;

-- Update display info
UPDATE sekbid SET 
  display_name = 'Keagamaan',
  tagline = 'Membina Iman & Takwa',
  bg_color = 'bg-green-50 dark:bg-green-900/20',
  border_color = 'border-green-200 dark:border-green-700'
WHERE id = 1;

UPDATE sekbid SET 
  display_name = 'Kaderisasi',
  tagline = 'Mencetak Pemimpin Masa Depan',
  bg_color = 'bg-blue-50 dark:bg-blue-900/20',
  border_color = 'border-blue-200 dark:border-blue-700'
WHERE id = 2;

UPDATE sekbid SET 
  display_name = 'Akademik',
  tagline = 'Prestasi Tanpa Batas',
  bg_color = 'bg-purple-50 dark:bg-purple-900/20',
  border_color = 'border-purple-200 dark:border-purple-700'
WHERE id = 3;

UPDATE sekbid SET 
  display_name = 'Ekonomi Kreatif',
  tagline = 'Berkarya & Berwirausaha',
  bg_color = 'bg-yellow-50 dark:bg-yellow-900/20',
  border_color = 'border-yellow-200 dark:border-yellow-700'
WHERE id = 4;

UPDATE sekbid SET 
  display_name = 'Kesehatan',
  tagline = 'Sehat Jasmani & Rohani',
  bg_color = 'bg-teal-50 dark:bg-teal-900/20',
  border_color = 'border-teal-200 dark:border-teal-700'
WHERE id = 5;

UPDATE sekbid SET 
  display_name = 'Kominfo',
  tagline = 'Digital & Teknologi',
  bg_color = 'bg-cyan-50 dark:bg-cyan-900/20',
  border_color = 'border-cyan-200 dark:border-cyan-700'
WHERE id = 6;

-- Verify
SELECT id, name, display_name, description, color, icon FROM sekbid ORDER BY id;
