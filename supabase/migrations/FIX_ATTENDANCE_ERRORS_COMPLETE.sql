-- FIX ALL ATTENDANCE & ERROR LOGGING ISSUES
-- Run this SQL in Supabase SQL Editor

-- ============================================
-- 1. FIX ERROR_LOGS TABLE CONSTRAINT
-- ============================================
-- Drop existing constraint
ALTER TABLE error_logs DROP CONSTRAINT IF EXISTS error_logs_error_type_check;

-- Add new constraint with all valid error types including performance_issue
ALTER TABLE error_logs ADD CONSTRAINT error_logs_error_type_check 
CHECK (error_type IN (
  'client_error',          -- Frontend errors
  'server_error',          -- Backend errors  
  'database_error',        -- DB query errors
  'api_error',             -- External API errors
  'validation_error',      -- Data validation errors
  'authentication_error',  -- Auth errors
  'authorization_error',   -- Permission errors
  'network_error',         -- Network/timeout errors
  'performance_issue',     -- NEW: Performance monitoring
  '404_page',              -- NEW: 404 page not found
  'runtime_error',         -- NEW: Runtime errors
  'build_error',           -- NEW: Build errors
  'unknown_error'          -- Unclassified errors
));

COMMENT ON COLUMN error_logs.error_type IS 'Type of error - extended to include performance and runtime issues';

-- ============================================
-- 2. UPDATE EXISTING INVALID RECORDS
-- ============================================
-- No action needed since we expanded the constraint

-- ============================================
-- 3. CREATE INDEX FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_error_logs_page_url ON error_logs(page_url);
CREATE INDEX IF NOT EXISTS idx_error_logs_api_endpoint ON error_logs(api_endpoint);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_email ON error_logs(user_email);

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 
  'Error Logs Table Fixed' as status,
  COUNT(*) as total_errors,
  COUNT(DISTINCT error_type) as error_types,
  array_agg(DISTINCT error_type) as types_found
FROM error_logs
WHERE deleted_at IS NULL;

-- Test insert with new types
INSERT INTO error_logs (
  error_type,
  severity,
  message,
  page_url,
  environment
) VALUES 
  ('performance_issue', 'medium', 'Test: High CLS detected', '/test', 'production'),
  ('runtime_error', 'low', 'Test: Runtime error', '/test', 'production'),
  ('404_page', 'low', 'Test: Page not found', '/test', 'production')
ON CONFLICT DO NOTHING;

SELECT 'Test records inserted successfully' as result;
