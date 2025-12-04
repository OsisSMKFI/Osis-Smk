# 📋 Panduan Konfigurasi Admin Panel Absensi

## 🎯 Overview

Admin panel configuration untuk sistem absensi dengan **Enterprise IP Whitelisting** sebagai mekanisme keamanan utama. Semua user (siswa, guru, admin) **HARUS** akses dari jaringan sekolah.

---

## 🔐 Keamanan Berlapis (Multi-Layer Security)

### 1. **IP Whitelisting** (PRIMARY) ✅
- **WAJIB** untuk semua user (siswa, guru, admin)
- Server-side validation menggunakan CIDR notation
- Tidak ada role bypass
- Contoh: `192.168.0.0/16`, `182.10.0.0/16`

### 2. **GPS Validation** ✅
- Validasi lokasi dalam radius sekolah
- Minimum radius: 50 meter
- Rekomendasi: 100-200 meter

### 3. **Device Fingerprint** ✅
- Hash unik per device
- Mencegah multi-device abuse

### 4. **Face Recognition (AI)** ✅
- Verifikasi wajah saat absensi
- Model AI untuk deteksi liveness

### 5. **AI Anomaly Detection** ✅
- Deteksi pola mencurigakan
- Impossible travel detection
- WiFi switching patterns
- Time pattern analysis

---

## 📝 Langkah Konfigurasi

### Step 1: Login sebagai Admin
```
URL: https://yourapp.vercel.app/admin/attendance/settings
Role: super_admin, admin, atau osis
```

### Step 2: Konfigurasi Lokasi GPS
1. Klik **"Gunakan Lokasi Saat Ini"** (pastikan di area sekolah)
2. Atau masukkan manual:
   - **Latitude**: -6.xxxxx (contoh)
   - **Longitude**: 106.xxxxx (contoh)
3. Set **Radius**: 100-200 meter (rekomendasi)

### Step 3: 🔐 Enterprise IP Whitelisting (CRITICAL!)

#### 3.1 Cara Mendapatkan IP Range Sekolah

**Opsi A: WiFi Sekolah (Private Network)**
```bash
# Sambung ke WiFi sekolah, lalu buka Command Prompt:
ipconfig

# Cari IPv4 Address, contoh:
# IPv4 Address: 192.168.1.45
# Subnet Mask: 255.255.0.0

# Konversi ke CIDR:
# 192.168.0.0/16  ← Masukkan ini ke admin panel
```

**Opsi B: IP Public ISP**
```bash
# Buka browser, kunjungi:
https://whatismyipaddress.com/

# Contoh IP: 182.10.97.87
# Tanyakan ISP untuk IP range mereka
# Atau gunakan /16 untuk coverage luas:
# 182.10.0.0/16  ← Masukkan ini ke admin panel
```

**Opsi C: Data Seluler (CGNAT)**
```bash
# Jika pakai Telkomsel/Indosat, gunakan:
100.64.0.0/10  ← IP range CGNAT Indonesia
```

#### 3.2 Input IP Ranges di Admin Panel

Di field **"Allowed IP Ranges"**, masukkan (satu per baris):
```
192.168.0.0/16    ← WiFi lokal sekolah
182.10.0.0/16     ← IP Public ISP
100.64.0.0/10     ← CGNAT (optional)
```

#### 3.3 Quick Presets
- Klik **"WiFi Sekolah (Local Only)"** → Hanya 192.168.x.x
- Klik **"WiFi + Data Seluler"** → Kombinasi local + ISP + CGNAT

#### 3.4 Security Level
Pilih: **HIGH** (Recommended)
- ✅ Strict IP validation
- ✅ GPS radius check
- ✅ Device fingerprint
- ✅ Face recognition
- ✅ AI anomaly detection

### Step 4: WiFi Configuration (DEPRECATED)
⚠️ **SKIP bagian ini!** Browser tidak bisa deteksi WiFi SSID.
- Uncheck **"Require WiFi"**
- IP Whitelisting sudah cukup

### Step 5: Save Configuration
1. Klik **"Simpan Konfigurasi"**
2. Pastikan muncul notifikasi success:
   ```
   ✅ Konfigurasi berhasil disimpan!
   📍 SMK Example • 100m
   🔐 IP Ranges: 3 configured • Security: HIGH
   ```

---

## 🧪 Testing Configuration

### Test 1: Admin dari WiFi Sekolah
```
Expected: ✅ ALLOWED
- IP dalam range
- GPS dalam radius
- Face recognition pass
```

### Test 2: Admin dari Rumah
```
Expected: ❌ BLOCKED
- IP TIDAK dalam range
- Error: "Akses ditolak! Anda harus terhubung ke jaringan sekolah"
```

### Test 3: Siswa dari Data Seluler (di sekolah)
```
Expected: 
- Jika data seluler IP-nya dalam range (CGNAT): ✅ ALLOWED
- Jika TIDAK dalam range: ❌ BLOCKED
```

### Test 4: Guru dari Coffee Shop
```
Expected: ❌ BLOCKED
- IP berbeda (tidak dalam range sekolah)
- GPS di luar radius
```

---

## ⚙️ Database Schema

### Table: `school_location_config`

```sql
-- Primary Fields
location_name           TEXT NOT NULL
latitude                DECIMAL(10,8) NOT NULL
longitude               DECIMAL(11,8) NOT NULL
radius_meters           DECIMAL(10,2) DEFAULT 50

-- 🔐 Enterprise IP Whitelisting
allowed_ip_ranges       TEXT[]         -- CIDR notation
require_wifi            BOOLEAN        -- false (recommended)
network_security_level  TEXT           -- 'low', 'medium', 'high'

-- Legacy Fields
allowed_wifi_ssids      TEXT[]
block_vpn               BOOLEAN
block_proxy             BOOLEAN
```

---

## 🔧 API Endpoints

### GET `/api/admin/attendance/config`
Fetch active configuration

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 6,
    "location_name": "SMK Example",
    "latitude": -6.123456,
    "longitude": 106.789012,
    "radius_meters": 100,
    "allowed_ip_ranges": [
      "192.168.0.0/16",
      "182.10.0.0/16"
    ],
    "require_wifi": false,
    "network_security_level": "high",
    "is_active": true
  }
}
```

### POST `/api/admin/attendance/config`
Save/update configuration

**Request:**
```json
{
  "location_name": "SMK Example",
  "latitude": -6.123456,
  "longitude": 106.789012,
  "radius_meters": 100,
  "allowed_ip_ranges": ["192.168.0.0/16"],
  "require_wifi": false,
  "network_security_level": "high"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Konfigurasi berhasil disimpan",
  "data": { ... }
}
```

---

## 🚨 Troubleshooting

### Error: "IP Whitelisting belum dikonfigurasi"
**Penyebab:** `allowed_ip_ranges` kosong
**Solusi:**
1. Login admin panel
2. Tambahkan minimal 1 IP range
3. Save configuration

### Error: "Format IP Range tidak valid"
**Penyebab:** Bukan CIDR notation
**Contoh Salah:**
```
192.168.1.45        ❌ (single IP, bukan range)
192.168.0.0-255     ❌ (dash notation)
192.168.*.*         ❌ (wildcard)
```
**Contoh Benar:**
```
192.168.0.0/16      ✅ (CIDR notation)
182.10.0.0/16       ✅
10.0.0.0/8          ✅
```

### User terblokir meski di WiFi sekolah
**Debugging:**
1. Cek IP user:
   ```bash
   # Di device user, buka browser:
   https://whatismyipaddress.com/
   ```
2. Cek apakah IP dalam range:
   - IP user: `192.168.1.45`
   - Range config: `192.168.0.0/16` ✅ (dalam range)
   - Range config: `192.168.1.0/24` ✅ (dalam range)
   - Range config: `10.0.0.0/8` ❌ (beda network)

3. Update IP ranges di admin panel jika perlu

### Semua user terblokir setelah save
**Penyebab:** IP ranges salah atau terlalu restrictive
**Solusi Quick Fix:**
```sql
-- Temporary permissive mode (testing only!)
UPDATE school_location_config
SET allowed_ip_ranges = ARRAY['0.0.0.0/0']
WHERE is_active = true;

-- ⚠️ WARNING: 0.0.0.0/0 = Allow ALL IPs (INSECURE!)
-- Gunakan hanya untuk testing, lalu configure IP yang benar!
```

---

## 📊 Monitoring & Logs

### Security Events Table
Semua validasi tercatat di `security_events`:

```sql
SELECT 
  created_at,
  event_type,
  severity,
  description,
  metadata->>'role' as role,
  metadata->>'ip' as ip,
  metadata->>'client_ip' as client_ip
FROM security_events
WHERE event_type IN (
  'ip_validation_success',
  'ip_whitelist_failed',
  'ip_not_detected',
  'permissive_mode_access'
)
ORDER BY created_at DESC
LIMIT 50;
```

### Check IP Validation Failures
```sql
SELECT 
  u.email,
  se.created_at,
  se.metadata->>'client_ip' as blocked_ip,
  se.metadata->>'allowed_ranges' as allowed_ranges
FROM security_events se
JOIN users u ON u.id = se.user_id
WHERE se.event_type = 'ip_whitelist_failed'
  AND se.created_at > NOW() - INTERVAL '24 hours'
ORDER BY se.created_at DESC;
```

---

## ✅ Checklist Setup

- [ ] Run migration: `MIGRATION_ADD_IP_WHITELISTING.sql`
- [ ] Login sebagai Admin
- [ ] Set GPS coordinates (latitude, longitude, radius)
- [ ] **Configure IP ranges** (CRITICAL!)
  - [ ] Add local WiFi range (192.168.x.x/16)
  - [ ] Add ISP public IP range (if needed)
  - [ ] Add CGNAT range (if using cellular data)
- [ ] Set Security Level = **HIGH**
- [ ] Uncheck "Require WiFi"
- [ ] Save configuration
- [ ] Test dengan user siswa dari WiFi sekolah (should ALLOW)
- [ ] Test dengan user siswa dari rumah (should BLOCK)
- [ ] Test dengan user guru dari WiFi sekolah (should ALLOW)
- [ ] Test dengan user guru dari coffee shop (should BLOCK)
- [ ] Monitor `security_events` table for logs

---

## 📞 Support

Jika ada masalah:
1. Cek logs di `security_events` table
2. Verify IP ranges konfigurasi
3. Test dengan permissive mode (0.0.0.0/0) sementara
4. Review browser console untuk error details

**Contact:** Admin System
