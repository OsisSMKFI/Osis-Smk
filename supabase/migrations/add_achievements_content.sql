-- Migration: Add achievements content to page_content table
-- Created: 2025-12-14

-- Insert default achievements data
-- Note: Uses 'content' column (not content_value) per actual table schema
INSERT INTO public.page_content (page_key, category, title, content, published) VALUES
-- Achievement 1
('achievement_1_year', 'about_achievements', 'Tahun Achievement 1', '2024', true),
('achievement_1_title', 'about_achievements', 'Title Achievement 1', 'Terbentuknya OSIS Raveka Sena', true),
('achievement_1_desc', 'about_achievements', 'Deskripsi Achievement 1', 'OSIS SMK Informatika resmi terbentuk dengan nama Raveka Sena, membawa semangat baru sebagai pasukan sinar terang.', true),
('achievement_1_icon', 'about_achievements', 'Icon Achievement 1', '🚀', true),

-- Achievement 2
('achievement_2_year', 'about_achievements', 'Tahun Achievement 2', '2024', true),
('achievement_2_title', 'about_achievements', 'Title Achievement 2', 'Peluncuran Website Resmi', true),
('achievement_2_desc', 'about_achievements', 'Deskripsi Achievement 2', 'Website OSIS dengan fitur modern dan interaktif diluncurkan untuk memudahkan komunikasi dan informasi.', true),
('achievement_2_icon', 'about_achievements', 'Icon Achievement 2', '💻', true),

-- Achievement 3
('achievement_3_year', 'about_achievements', 'Tahun Achievement 3', '2025', true),
('achievement_3_title', 'about_achievements', 'Title Achievement 3', 'Program Kerja Inovatif', true),
('achievement_3_desc', 'about_achievements', 'Deskripsi Achievement 3', 'Meluncurkan berbagai program kerja yang fokus pada pengembangan soft skill dan hard skill siswa.', true),
('achievement_3_icon', 'about_achievements', 'Icon Achievement 3', '🎯', true)

ON CONFLICT (page_key) DO UPDATE SET 
  content = EXCLUDED.content,
  category = EXCLUDED.category,
  title = EXCLUDED.title,
  published = EXCLUDED.published,
  updated_at = NOW();

-- Verify
SELECT * FROM public.page_content WHERE category = 'about_achievements' ORDER BY page_key;
