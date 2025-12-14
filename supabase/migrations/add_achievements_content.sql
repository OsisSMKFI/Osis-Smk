-- Migration: Add achievements content to page_content table
-- Created: 2025-12-14

-- Insert default achievements data
INSERT INTO public.page_content (page_key, content_type, content_value, category, published) VALUES
-- Achievement 1
('achievement_1_year', 'text', '2024', 'about_achievements', true),
('achievement_1_title', 'text', 'Terbentuknya OSIS Dirgantara', 'about_achievements', true),
('achievement_1_desc', 'richtext', 'OSIS SMK Informatika resmi terbentuk dengan nama Dirgantara, membawa semangat baru dalam organisasi siswa.', 'about_achievements', true),
('achievement_1_icon', 'text', '🚀', 'about_achievements', true),

-- Achievement 2
('achievement_2_year', 'text', '2024', 'about_achievements', true),
('achievement_2_title', 'text', 'Peluncuran Website Resmi', 'about_achievements', true),
('achievement_2_desc', 'richtext', 'Website OSIS dengan fitur modern dan interaktif diluncurkan untuk memudahkan komunikasi dan informasi.', 'about_achievements', true),
('achievement_2_icon', 'text', '💻', 'about_achievements', true),

-- Achievement 3
('achievement_3_year', 'text', '2025', 'about_achievements', true),
('achievement_3_title', 'text', 'Program Kerja Inovatif', 'about_achievements', true),
('achievement_3_desc', 'richtext', 'Meluncurkan berbagai program kerja yang fokus pada pengembangan soft skill dan hard skill siswa.', 'about_achievements', true),
('achievement_3_icon', 'text', '🎯', 'about_achievements', true)

ON CONFLICT (page_key) DO UPDATE SET 
  content_value = EXCLUDED.content_value,
  category = EXCLUDED.category,
  published = EXCLUDED.published,
  updated_at = NOW();

-- Verify
SELECT * FROM public.page_content WHERE category = 'about_achievements' ORDER BY page_key;
