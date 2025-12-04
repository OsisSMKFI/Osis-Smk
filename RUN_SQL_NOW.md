# ⚠️ CRITICAL: RUN THIS SQL IN SUPABASE NOW!

## 🚨 MASALAH DETECTED:

Console log menunjukkan:
```
Allowed SSIDs: Array(0)  ← Config kosong!
Local IP: null           ← IP tidak terdeteksi
[WiFi AI] ❌ WiFi not detected
```

**Root Cause:** Database migration belum dijalankan!

---

## ✅ SOLUSI: Run SQL ini di Supabase

### Step 1: Login Supabase
1. Buka: https://supabase.com/dashboard
2. Select project Anda
3. Klik **SQL Editor** di sidebar kiri

### Step 2: Run Migration SQL

**Copy & paste SQL ini, klik RUN:**

```sql
-- ===============================================
-- CRITICAL FIX: WiFi IP Range Configuration
-- ===============================================

-- 1. Update allowed_ip_ranges (TEXT[] format)
UPDATE school_location_config 
SET allowed_ip_ranges = ARRAY['192.168.', '10.0.', '172.16.']
WHERE allowed_ip_ranges IS NULL OR allowed_ip_ranges = '{}';

-- 2. Verify config
SELECT 
  id,
  location_name,
  allowed_wifi_ssids,
  allowed_ip_ranges,
  is_active,
  require_wifi
FROM school_location_config;

-- Expected result should show:
-- allowed_wifi_ssids: {Villa Lembang}
-- allowed_ip_ranges: {192.168.,10.0.,172.16.}
-- is_active: true
```

### Step 3: Verify Result

You should see output like:
```
id | location_name      | allowed_wifi_ssids | allowed_ip_ranges              | is_active
---|-------------------|-------------------|-------------------------------|----------
1  | SMK Fithrah Insani| {Villa Lembang}   | {192.168.,10.0.,172.16.}     | true
```

**✅ If you see this, migration SUCCESS!**

---

## 🔧 Alternative: If No Config Exists

If query returns **empty** or **no rows**, run this to create config:

```sql
-- Create school location config if not exists
INSERT INTO school_location_config (
  location_name,
  latitude,
  longitude,
  radius_meters,
  allowed_wifi_ssids,
  allowed_ip_ranges,
  require_wifi,
  is_active,
  created_at,
  updated_at
) VALUES (
  'SMK Fithrah Insani',
  -6.8132,  -- Replace with actual school latitude
  107.6010, -- Replace with actual school longitude
  100,      -- 100 meters radius
  ARRAY['Villa Lembang', 'SMK-Fi-Guest'], -- Allowed WiFi names
  ARRAY['192.168.', '10.0.', '172.16.'],  -- Allowed IP ranges
  true,     -- Require WiFi for attendance
  true,     -- Config is active
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  allowed_ip_ranges = ARRAY['192.168.', '10.0.', '172.16.'],
  updated_at = NOW();
```

---

## 🧪 Test After Migration

### 1. Check API Response
Open browser console and run:
```javascript
fetch('/api/school/wifi-config')
  .then(r => r.json())
  .then(console.log)
```

**Expected output:**
```json
{
  "allowedSSIDs": ["Villa Lembang"],
  "allowedIPRanges": ["192.168.", "10.0.", "172.16."],
  "config": {
    "locationName": "SMK Fithrah Insani",
    "requireWiFi": true,
    "isActive": true
  }
}
```

### 2. Refresh Attendance Page
1. Logout
2. Login kembali
3. Navigate ke `/attendance`
4. Check console log - should see:
```
[Background Analyzer] ✅ WiFi validation with IP ranges
[WiFi AI] Config from DB: {allowedSSIDs: [...], allowedIPRanges: [...]}
```

---

## 🔍 Troubleshooting

### Issue: "Table school_location_config does not exist"

**Solution:** Create table first:
```sql
CREATE TABLE IF NOT EXISTS school_location_config (
  id SERIAL PRIMARY KEY,
  location_name TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  radius_meters INTEGER DEFAULT 100,
  allowed_wifi_ssids TEXT[],
  allowed_ip_ranges TEXT[],
  require_wifi BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

Then run the INSERT query above.

### Issue: "Column allowed_ip_ranges does not exist"

**Solution:** Add column:
```sql
ALTER TABLE school_location_config 
ADD COLUMN IF NOT EXISTS allowed_ip_ranges TEXT[] 
DEFAULT ARRAY['192.168.', '10.0.', '172.16.'];
```

---

## ⏱️ URGENT: Do This NOW!

**Time required:** 2 minutes

**Impact:** Critical - WiFi validation akan berfungsi setelah migration

**Status sebelum migration:**
- ❌ `Allowed SSIDs: Array(0)`
- ❌ WiFi detection gagal
- ❌ Button disabled terus

**Status setelah migration:**
- ✅ `Allowed SSIDs: ["Villa Lembang"]`
- ✅ IP range validation working
- ✅ Button enabled jika WiFi valid

---

**RUN SQL MIGRATION NOW!** 🚀
