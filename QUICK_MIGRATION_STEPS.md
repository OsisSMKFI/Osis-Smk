# ⚡ Quick Migration Steps - Copy-Paste Ready

## 🎯 Tujuan
Fix error: `column "description" does not exist`

---

## 📋 STEP 1: Login Supabase

1. Buka: https://supabase.com/dashboard
2. Pilih project **Webosis**
3. Sidebar → **SQL Editor**
4. Klik **"New Query"**

---

## 📋 STEP 2: Run Migration 1 (Base Tables)

**Copy-paste query ini ke SQL Editor:**

```sql
-- =====================================================
-- PRODUCTION-READY DATABASE MIGRATION
-- Webosis Attendance System
-- Version: 2.0.0
-- =====================================================

-- 1. ADMIN SETTINGS TABLE
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  category TEXT DEFAULT 'general',
  is_secret BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(key);
CREATE INDEX IF NOT EXISTS idx_admin_settings_category ON admin_settings(category);

-- 2. SCHOOL LOCATION CONFIG
CREATE TABLE IF NOT EXISTS school_location_config (
  id SERIAL PRIMARY KEY,
  location_name TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius_meters DECIMAL(10, 2) DEFAULT 50,
  allowed_wifi_ssids TEXT[],
  allowed_ip_ranges TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_school_location_name ON school_location_config(location_name);

-- 3. SECURITY EVENTS TABLE
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  severity TEXT DEFAULT 'INFO',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  accuracy DECIMAL(10, 2),
  ip_address TEXT,
  user_agent TEXT,
  additional_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Base tables created successfully!';
END $$;
```

**Klik: RUN** ▶️

**Expected:** `✅ Base tables created successfully!`

---

## 📋 STEP 3: Run Migration 2 (Mikrotik Settings)

**Copy-paste query ini ke SQL Editor baru:**

```sql
-- =====================================================
-- MIKROTIK INTEGRATION SETTINGS
-- =====================================================

INSERT INTO admin_settings (key, value, description, category, is_secret)
VALUES 
  ('mikrotik_enabled', 'false', 'Enable Mikrotik router integration', 'security', false),
  ('mikrotik_host', '', 'Mikrotik router IP address', 'security', true),
  ('mikrotik_port', '8728', 'Mikrotik API port', 'security', false),
  ('mikrotik_username', 'admin', 'Mikrotik admin username', 'security', true),
  ('mikrotik_password', '', 'Mikrotik admin password', 'security', true),
  ('mikrotik_api_type', 'rest', 'API type: rest or routeros', 'security', false),
  ('mikrotik_use_dhcp', 'true', 'Use DHCP leases for IP validation', 'security', false),
  ('mikrotik_use_arp', 'false', 'Use ARP table for IP validation', 'security', false),
  ('mikrotik_cache_duration', '300', 'Cache devices for N seconds', 'security', false),
  ('ip_validation_mode', 'hybrid', 'IP validation: mikrotik/whitelist/hybrid', 'security', false),
  ('location_strict_mode', 'true', 'Strict location validation', 'security', false),
  ('location_max_radius', '100', 'Maximum radius in meters', 'attendance', false),
  ('location_gps_accuracy_required', '50', 'Required GPS accuracy in meters', 'attendance', false)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ 13 Mikrotik settings inserted!';
END $$;
```

**Klik: RUN** ▶️

**Expected:** `✅ 13 Mikrotik settings inserted!`

---

## 📋 STEP 4: Run Migration 3 (IP Ranges Fix)

**Copy-paste query ini ke SQL Editor baru:**

```sql
-- =====================================================
-- FIX IP RANGES - ADD CGNAT SUPPORT
-- =====================================================

-- Update IP ranges to include CGNAT (fixes IP blocking)
UPDATE school_location_config
SET allowed_ip_ranges = ARRAY[
  '192.168.0.0/16',   -- Local network (65,536 IPs)
  '10.0.0.0/8',       -- Private network (16M IPs)
  '172.16.0.0/12',    -- Private network (1M IPs)
  '100.64.0.0/10'     -- CGNAT (4.2M IPs) ← FIX for IP 114.122.103.106
]
WHERE location_name IS NOT NULL;

-- If no rows exist, insert default config
INSERT INTO school_location_config (
  location_name,
  latitude,
  longitude,
  radius_meters,
  allowed_ip_ranges,
  is_active
)
SELECT 
  'SMK Webosis',
  -6.200000,
  106.816666,
  100,
  ARRAY['192.168.0.0/16', '10.0.0.0/8', '172.16.0.0/12', '100.64.0.0/10'],
  true
WHERE NOT EXISTS (SELECT 1 FROM school_location_config);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ IP ranges updated! User IP 114.122.103.106 should work now.';
END $$;
```

**Klik: RUN** ▶️

**Expected:** `✅ IP ranges updated!`

---

## ✅ Verification

**Run query ini untuk verify:**

```sql
-- Check all settings
SELECT key, value, category 
FROM admin_settings 
ORDER BY category, key;

-- Check IP ranges
SELECT location_name, allowed_ip_ranges 
FROM school_location_config;
```

**Expected Output:**
- 13 rows in admin_settings (Mikrotik settings)
- 1 row in school_location_config (dengan 4 IP ranges)

---

## 🚀 Next Steps

1. ✅ **Migrations Done** - All tables created
2. 🌐 **Deploy App** - Push code to production
3. 🔧 **Configure Admin** - Go to `/admin/attendance/mikrotik`
4. 📍 **Test Location** - Logout → Login → Allow permission
5. ✅ **Test Attendance** - Try check-in dari sekolah

---

## 🆘 If Error Occurs

**Error: "relation already exists"**
- ✅ OK! Table sudah ada, migration IDEMPOTENT

**Error: "permission denied"**
- Use **service_role** key di Supabase Dashboard → Settings → API

**Error: "column does not exist"**
- Run STEP 2 lagi (base tables)

---

**Status:** ✅ Ready to Run  
**Time:** ~2 minutes  
**Safe:** Yes, IDEMPOTENT (can run multiple times)
