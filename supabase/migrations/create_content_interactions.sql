-- Content Interactions Tables
-- Tables for tracking views, likes across all content types

-- 1. Content Views Table
CREATE TABLE IF NOT EXISTS content_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL, -- 'post', 'event', 'announcement', 'poll', 'news'
  viewer_id TEXT NOT NULL, -- user_id or fingerprint for anonymous
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for content_views
CREATE INDEX IF NOT EXISTS idx_content_views_content ON content_views(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_content_views_viewer ON content_views(viewer_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_views_unique ON content_views(content_id, content_type, viewer_id);

-- 2. Content Likes Table
CREATE TABLE IF NOT EXISTS content_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL, -- 'post', 'event', 'announcement', 'poll', 'news'
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for content_likes
CREATE INDEX IF NOT EXISTS idx_content_likes_content ON content_likes(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_content_likes_user ON content_likes(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_content_likes_unique ON content_likes(content_id, content_type, user_id);

-- Enable RLS
ALTER TABLE content_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_likes ENABLE ROW LEVEL SECURITY;

-- Policies for content_views
DROP POLICY IF EXISTS "Anyone can view content_views" ON content_views;
CREATE POLICY "Anyone can view content_views"
  ON content_views FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert content_views" ON content_views;
CREATE POLICY "Anyone can insert content_views"
  ON content_views FOR INSERT
  WITH CHECK (true);

-- Policies for content_likes
DROP POLICY IF EXISTS "Anyone can view content_likes" ON content_likes;
CREATE POLICY "Anyone can view content_likes"
  ON content_likes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can like content" ON content_likes;
CREATE POLICY "Users can like content"
  ON content_likes FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can unlike content" ON content_likes;
CREATE POLICY "Users can unlike content"
  ON content_likes FOR DELETE
  USING (true);

-- Comments
COMMENT ON TABLE content_views IS 'Tracks views for all content types';
COMMENT ON TABLE content_likes IS 'Tracks likes for all content types';
