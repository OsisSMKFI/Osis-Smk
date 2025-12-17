-- ═══════════════════════════════════════════════════════════════════════════════
-- 🔔 ADMIN NOTIFICATIONS SCHEMA UPDATE - Premium v5.0
-- ═══════════════════════════════════════════════════════════════════════════════
-- Add columns for LiveChat message forwarding and reply system
-- ═══════════════════════════════════════════════════════════════════════════════

-- Add new columns for forwarded messages
DO $$
BEGIN
  -- target: who should see this notification (osis, admin, super_admin, user, or null for specific user_id)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_notifications' AND column_name='target') THEN
    ALTER TABLE public.admin_notifications ADD COLUMN target TEXT;
  END IF;

  -- sender_name: name of the person who sent the message
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_notifications' AND column_name='sender_name') THEN
    ALTER TABLE public.admin_notifications ADD COLUMN sender_name TEXT;
  END IF;

  -- sender_id: ID of the sender (if authenticated)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_notifications' AND column_name='sender_id') THEN
    ALTER TABLE public.admin_notifications ADD COLUMN sender_id UUID;
  END IF;

  -- session_id: LiveChat session ID for tracking conversation
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_notifications' AND column_name='session_id') THEN
    ALTER TABLE public.admin_notifications ADD COLUMN session_id TEXT;
  END IF;

  -- original_notif_id: Reference to original notification for replies
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_notifications' AND column_name='original_notif_id') THEN
    ALTER TABLE public.admin_notifications ADD COLUMN original_notif_id UUID;
  END IF;

  -- is_urgent: Flag for urgent/priority messages
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_notifications' AND column_name='is_urgent') THEN
    ALTER TABLE public.admin_notifications ADD COLUMN is_urgent BOOLEAN DEFAULT false;
  END IF;

  -- is_read: Alias for read column (backwards compatibility)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_notifications' AND column_name='is_read') THEN
    ALTER TABLE public.admin_notifications ADD COLUMN is_read BOOLEAN DEFAULT false;
  END IF;

  -- metadata: JSON field for additional data
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_notifications' AND column_name='metadata') THEN
    ALTER TABLE public.admin_notifications ADD COLUMN metadata JSONB;
  END IF;

  -- Make user_id nullable for system/broadcast notifications
  ALTER TABLE public.admin_notifications ALTER COLUMN user_id DROP NOT NULL;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_notifications_target ON public.admin_notifications(target);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON public.admin_notifications(type);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_session ON public.admin_notifications(session_id);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON public.admin_notifications(read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created ON public.admin_notifications(created_at DESC);

-- Update RLS policies to allow service role full access
DO $$
BEGIN
  -- Drop existing policies if they exist (to recreate them properly)
  DROP POLICY IF EXISTS admin_notifications_service_full ON public.admin_notifications;
  DROP POLICY IF EXISTS admin_notifications_read_by_target ON public.admin_notifications;
  DROP POLICY IF EXISTS admin_notifications_owner_read ON public.admin_notifications;
  
  -- Service role has full access
  CREATE POLICY admin_notifications_service_full 
    ON public.admin_notifications 
    FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);
    
  -- Users can read their own notifications
  CREATE POLICY admin_notifications_owner_read 
    ON public.admin_notifications 
    FOR SELECT 
    TO authenticated 
    USING (
      user_id = auth.uid() 
      OR target IN ('admin', 'super_admin', 'osis', 'user')
      OR target IS NULL
    );

EXCEPTION WHEN others THEN
  -- Ignore errors (policies might already exist)
  NULL;
END $$;

-- Sync read and is_read columns
UPDATE public.admin_notifications 
SET is_read = read 
WHERE is_read IS NULL OR is_read != read;

-- Add trigger to keep read and is_read in sync
CREATE OR REPLACE FUNCTION sync_notification_read_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.read IS DISTINCT FROM NEW.is_read THEN
    NEW.is_read := NEW.read;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_notification_read ON public.admin_notifications;
CREATE TRIGGER trg_sync_notification_read
  BEFORE INSERT OR UPDATE ON public.admin_notifications
  FOR EACH ROW
  EXECUTE FUNCTION sync_notification_read_status();
