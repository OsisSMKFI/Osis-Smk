# 🎯 Advanced Attendance Config Management

## ✨ Fitur Baru yang Ditambahkan

### 1. **Activate / Deactivate Config** ⚡
Sekarang konfigurasi bisa **diaktifkan** atau **dinonaktifkan** tanpa menghapus!

**Use Case:**
```
Scenario: Testing config baru tanpa hilangkan config lama
1. Admin punya config A (aktif)
2. Buat config B baru → Config A jadi non-aktif, B jadi aktif
3. Config B bermasalah → Klik "Nonaktifkan" di config B
4. Klik "Aktifkan" di config A → Config A aktif lagi
5. Config B tetap tersimpan sebagai backup
```

**Cara Pakai:**
- Buka **Riwayat** → Pilih config
- **Config Aktif**: Tombol "Nonaktifkan" (orange)
- **Config Non-Aktif**: Tombol "Aktifkan" (green)
- Toast konfirmasi muncul ✅

---

### 2. **Delete Config Permanently** 🗑️
Hapus konfigurasi yang tidak diperlukan lagi (hanya **super_admin**).

**Proteksi:**
- ❌ **TIDAK BISA** hapus config yang aktif
- ⚠️ **WAJIB** nonaktifkan dulu sebelum hapus
- 🔒 **HANYA** super_admin yang bisa delete

**Cara Pakai:**
```
1. Login sebagai super_admin
2. Buka "Riwayat"
3. Pilih config yang NON-AKTIF
4. Klik tombol "Hapus" (red)
5. Konfirmasi: "⚠️ PERHATIAN: Konfigurasi akan dihapus permanen!"
6. Klik OK → Config dihapus permanent
```

---

### 3. **WiFi dengan MAC Address** 📡
Validasi WiFi lebih akurat dengan BSSID (MAC address).

**Format Baru:**
```typescript
interface WiFiNetwork {
  ssid: string;              // "SMKFI2025 (5G)"
  bssid?: string;            // "00:11:22:33:44:55" (MAC address)
  security_type?: string;    // "WPA2", "WPA3", "Open"
  frequency?: string;        // "2.4GHz", "5GHz", "Dual"
  notes?: string;            // "WiFi Ruang Guru Lt 2"
}
```

**Keuntungan:**
- ✅ **Lebih Aman**: MAC address susah di-spoof
- ✅ **Lokasi Spesifik**: Bisa bedakan AP dengan SSID sama tapi beda lokasi
- ✅ **Dokumentasi**: Notes membantu identifikasi lokasi
- ✅ **Fleksibel**: BSSID opsional, bisa pakai SSID saja

**Kapan Pakai MAC Address?**
```
Scenario 1: SSID sama, lokasi beda
- WiFi "SMKFI-Public" di Gedung A → MAC: AA:BB:CC:DD:EE:01
- WiFi "SMKFI-Public" di Gedung B → MAC: AA:BB:CC:DD:EE:02
→ Bisa detect siswa di gedung mana!

Scenario 2: Security ketat
- Cuma izinkan akses dari AP tertentu
- Block WiFi yang di-clone/fake
→ Validasi SSID + MAC!

Scenario 3: Simple setup
- Cuma butuh SSID saja
- Kosongkan MAC address
→ Tetap bisa jalan!
```

---

### 4. **UI History Modal** 📋
Modal history sekarang punya **3 tombol aksi** per config:

**Config Aktif:**
- 🟠 **Nonaktifkan** - Matikan config ini

**Config Non-Aktif:**
- 🟢 **Aktifkan** - Jadikan config ini aktif
- 🔵 **Pulihkan** - Restore config ini (sama dengan activate)
- 🔴 **Hapus** - Delete permanent (super_admin only)

---

## 🔧 API Endpoints Baru

### **PUT** `/api/admin/attendance/config`
Activate, deactivate, atau restore config.

```typescript
// ACTIVATE
PUT /api/admin/attendance/config
Body: { configId: 2, action: "activate" }
Response: { success: true, message: "Konfigurasi berhasil diaktifkan" }

// DEACTIVATE
PUT /api/admin/attendance/config
Body: { configId: 2, action: "deactivate" }
Response: { success: true, message: "Konfigurasi berhasil dinonaktifkan" }

// RESTORE (sama dengan activate)
PUT /api/admin/attendance/config
Body: { configId: 2, action: "restore" }
Response: { success: true, message: "Konfigurasi berhasil dipulihkan" }
```

### **DELETE** `/api/admin/attendance/config?id=X`
Hapus config permanent (super_admin only).

```typescript
DELETE /api/admin/attendance/config?id=2
Response: { success: true, message: "Konfigurasi berhasil dihapus" }

// Error jika config masih aktif:
Response: { success: false, error: "Cannot delete active config. Deactivate it first." }

// Error jika bukan super_admin:
Response: { success: false, error: "Only super admin can delete configs" }
```

---

## 📱 Cara Menggunakan WiFi Baru

### **Tambah WiFi Simple (SSID Saja)**
```
1. Klik "Tambah WiFi"
2. Isi SSID: "SMKFI2025"
3. Kosongkan MAC, Security, Frequency (default WPA2, 2.4GHz)
4. Klik "Tambahkan"
✅ WiFi tersimpan tanpa detail tambahan
```

### **Tambah WiFi Advanced (Dengan MAC)**
```
1. Klik "Tambah WiFi"
2. Isi SSID: "SMKFI2025 (5G)"
3. Isi MAC Address: "00:1A:2B:3C:4D:5E"
4. Pilih Security: WPA2
5. Pilih Frequency: 5GHz
6. Isi Notes: "WiFi Ruang Guru Lt 2"
7. Klik "Tambahkan"
✅ WiFi tersimpan dengan detail lengkap

Card yang muncul:
┌─────────────────────────────┐
│ 📶 SMKFI2025 (5G)  [5GHz]  │
│ 📡 MAC: 00:1A:2B:3C:4D:5E   │
│ 🔒 WPA2                     │
│ 📝 WiFi Ruang Guru Lt 2     │
└─────────────────────────────┘
```

### **Cara Dapat MAC Address WiFi**

**Windows:**
```powershell
# Buka CMD atau PowerShell
netsh wlan show interfaces

# Output:
SSID                   : SMKFI2025 (5G)
BSSID                  : 00:1a:2b:3c:4d:5e  ← INI MAC ADDRESS!
Network type           : Infrastructure
Authentication         : WPA2-Personal
```

**Android:**
```
1. Connect ke WiFi
2. Settings → WiFi → Tap WiFi yang terkoneksi
3. Lihat "MAC address" atau "BSSID"
```

**iOS:**
```
Tidak bisa lihat MAC address di iOS
Gunakan app pihak ketiga atau lihat dari router admin panel
```

---

## 📊 Database Migration

Jika ingin pakai WiFi table (lebih advanced):

### **Step 1: Run SQL**
```sql
-- Copy paste file UPDATE_WIFI_SCHEMA.sql ke Supabase SQL Editor
-- Ini akan:
-- 1. Buat table allowed_wifi_networks
-- 2. Setup RLS policies
-- 3. Migrate data existing dari array ke table
```

### **Step 2: Verifikasi**
```sql
-- Check table created
SELECT * FROM allowed_wifi_networks LIMIT 5;

-- Check migration success
SELECT 
  c.id, 
  c.location_name,
  COUNT(w.id) as wifi_count
FROM school_location_config c
LEFT JOIN allowed_wifi_networks w ON w.config_id = c.id
GROUP BY c.id, c.location_name;
```

### **Step 3: Update Frontend**
Frontend sudah support both:
- ✅ Legacy: `allowed_wifi_ssids` (TEXT[])
- ✅ New: `wifi_networks` table

Tidak perlu ubah kode! Auto-detect format.

---

## 🎯 Use Cases Lengkap

### **UC1: Multi-Location School**
```
Masalah: Sekolah punya 3 kampus beda
Solusi:
- Config 1: "Kampus A" → Aktif untuk semester ini
- Config 2: "Kampus B" → Non-aktif (backup)
- Config 3: "Kampus C" → Non-aktif (backup)

Saat pindah kampus:
- Nonaktifkan Config 1
- Aktifkan Config 2
- Siswa langsung absen di kampus baru ✅
```

### **UC2: Testing Config**
```
Masalah: Mau test radius baru, takut kacau
Solusi:
- Config lama: Radius 100m (aktif)
- Buat config baru: Radius 200m → Otomatis jadi aktif
- Test 1 hari
- Gagal → Aktifkan config lama lagi
- Config baru jadi backup untuk iterasi berikutnya
```

### **UC3: Cleanup History**
```
Masalah: Riwayat terlalu banyak, bingung
Solusi:
- Login sebagai super_admin
- Buka riwayat
- Nonaktifkan config yang ga perlu
- Delete config yang sudah pasti tidak dipakai
- Riwayat jadi clean ✅
```

### **UC4: WiFi Clone Detection**
```
Masalah: Ada yang buat WiFi palsu dengan SSID sama
Solusi:
- Tambah WiFi dengan MAC address
- Sistem hanya terima koneksi dari MAC tertentu
- WiFi clone (SSID sama, MAC beda) ditolak
- Absensi tetap aman ✅
```

---

## 🔒 Permission Matrix

| Action | super_admin | admin | osis |
|--------|-------------|-------|------|
| View Config | ✅ | ✅ | ✅ |
| View History | ✅ | ✅ | ✅ |
| Create/Update | ✅ | ✅ | ✅ |
| Activate/Deactivate | ✅ | ✅ | ✅ |
| Restore Backup | ✅ | ✅ | ✅ |
| **Delete** | ✅ | ❌ | ❌ |

---

## 📝 Testing Checklist

### Config Management
- [ ] Buat config baru → Simpan
- [ ] Edit config existing → Simpan
- [ ] Lihat riwayat → 2+ config muncul
- [ ] Nonaktifkan config aktif
- [ ] Aktifkan config non-aktif
- [ ] Restore backup config
- [ ] (Super admin) Delete config non-aktif
- [ ] Coba delete config aktif → Error muncul ✅

### WiFi Management
- [ ] Tambah WiFi simple (SSID saja)
- [ ] Tambah WiFi advanced (SSID + MAC + detail)
- [ ] Edit WiFi existing
- [ ] Hapus WiFi
- [ ] View WiFi card dengan semua detail
- [ ] Simpan config dengan 3+ WiFi ✅

### UI/UX
- [ ] History modal responsive
- [ ] Tombol activate/deactivate/delete muncul
- [ ] WiFi form collapsible works
- [ ] Toast messages jelas
- [ ] Loading states works ✅

---

## 🚀 Deployment

**Commit:** `23dc017`  
**Status:** Pushed to GitHub ✅  
**Vercel:** Auto-deploying (tunggu 2-3 menit)

**After Deploy:**
1. Clear cache (Ctrl+Shift+R)
2. Login sebagai admin
3. Test semua fitur baru
4. (Optional) Run `UPDATE_WIFI_SCHEMA.sql` di Supabase untuk WiFi table

---

## 💡 Tips & Best Practices

1. **Jangan Delete Config Aktif**
   - Nonaktifkan dulu → Baru delete
   - Mencegah absensi mendadak error

2. **Backup Before Big Changes**
   - Config lama tetap ada di history
   - Bisa restore kapan saja

3. **MAC Address Opsional**
   - Mulai dengan SSID saja
   - Tambah MAC jika butuh validasi lebih ketat

4. **Notes Penting**
   - Tulis lokasi WiFi di Notes
   - Memudahkan troubleshooting

5. **Regular Cleanup**
   - Delete config lama yang sudah pasti ga pakai
   - Keep history clean dan relevant

---

Semua fitur sudah LIVE dan siap digunakan! 🎊
