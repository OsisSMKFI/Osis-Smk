-- Fix wrong Supabase URL in database
-- Old URL: eilrnslorvfrtwjwvbaw.supabase.co (wrong)
-- New URL: mhefqwregrldvxtqqxbb.supabase.co (correct)

-- Update members table - photo_url column
UPDATE members 
SET photo_url = REPLACE(photo_url, 'eilrnslorvfrtwjwvbaw.supabase.co', 'mhefqwregrldvxtqqxbb.supabase.co')
WHERE photo_url LIKE '%eilrnslorvfrtwjwvbaw.supabase.co%';

-- Update gallery table - url column
UPDATE gallery 
SET url = REPLACE(url, 'eilrnslorvfrtwjwvbaw.supabase.co', 'mhefqwregrldvxtqqxbb.supabase.co')
WHERE url LIKE '%eilrnslorvfrtwjwvbaw.supabase.co%';

-- Update gallery table - thumbnail_url column if exists
UPDATE gallery 
SET thumbnail_url = REPLACE(thumbnail_url, 'eilrnslorvfrtwjwvbaw.supabase.co', 'mhefqwregrldvxtqqxbb.supabase.co')
WHERE thumbnail_url LIKE '%eilrnslorvfrtwjwvbaw.supabase.co%';

-- Update events table - image_url column
UPDATE events 
SET image_url = REPLACE(image_url, 'eilrnslorvfrtwjwvbaw.supabase.co', 'mhefqwregrldvxtqqxbb.supabase.co')
WHERE image_url LIKE '%eilrnslorvfrtwjwvbaw.supabase.co%';

-- Update posts table - featured_image column
UPDATE posts 
SET featured_image = REPLACE(featured_image, 'eilrnslorvfrtwjwvbaw.supabase.co', 'mhefqwregrldvxtqqxbb.supabase.co')
WHERE featured_image LIKE '%eilrnslorvfrtwjwvbaw.supabase.co%';

-- Update posts table - content column (may contain embedded images)
UPDATE posts 
SET content = REPLACE(content, 'eilrnslorvfrtwjwvbaw.supabase.co', 'mhefqwregrldvxtqqxbb.supabase.co')
WHERE content LIKE '%eilrnslorvfrtwjwvbaw.supabase.co%';

-- Update announcements table - if has any media columns
-- UPDATE announcements 
-- SET content = REPLACE(content, 'eilrnslorvfrtwjwvbaw.supabase.co', 'mhefqwregrldvxtqqxbb.supabase.co')
-- WHERE content LIKE '%eilrnslorvfrtwjwvbaw.supabase.co%';

-- Verify the fix - count remaining old URLs
SELECT 
  'members' as table_name, 
  COUNT(*) as remaining_old_urls 
FROM members 
WHERE photo_url LIKE '%eilrnslorvfrtwjwvbaw%'
UNION ALL
SELECT 
  'gallery' as table_name, 
  COUNT(*) as remaining_old_urls 
FROM gallery 
WHERE url LIKE '%eilrnslorvfrtwjwvbaw%'
UNION ALL
SELECT 
  'events' as table_name, 
  COUNT(*) as remaining_old_urls 
FROM events 
WHERE image_url LIKE '%eilrnslorvfrtwjwvbaw%';
