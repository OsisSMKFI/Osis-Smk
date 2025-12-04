# ✅ Testing Guide - Save & Sync Validation

## 🎯 Fitur yang Harus Dicek

### 1. **Save Config - Visual Feedback**

**Langkah Testing:**
```
1. Buka /admin/attendance/settings
2. Isi semua field:
   - Nama Lokasi: "testing di lokasi klinik nur"
   - GPS: Klik "Gunakan Lokasi Saat Ini"
   - Radius: 16 meter
   - WiFi: Tambah minimal 1 SSID
3. Klik "Simpan Konfigurasi"
```

**Yang Harus Muncul:**
- ✅ Loading toast: "Menyimpan konfigurasi..."
- ✅ Success toast dengan detail:
  ```
  ✅ Konfigurasi berhasil disimpan!
  📍 testing di lokasi klinik nur • 16m • 1 WiFi
  ```
- ✅ History modal **AUTO-OPEN** dalam 0.5 detik
- ✅ Config baru muncul di history dengan badge "Aktif"
- ✅ Badge di header: "✓ Config Tersimpan (ID: X)"
- ✅ Badge status: "Status: AKTIF" (biru)
- ✅ Summary box hijau muncul dengan 3 cards:
  - Lokasi: testing di lokasi klinik nur
  - Radius: 16m
  - WiFi Terdaftar: 1 network
- ✅ Timestamp: "⏰ Terakhir update: [waktu sekarang]"

**Console Logs:**
```javascript
=== SAVE CONFIG DEBUG ===
Config state: {...}
Payload to send: {...}
Save Response: {success: true, data: {...}, message: "..."}
Fetched config: {...}
```

---

### 2. **Config Muncul di History**

**Langkah Testing:**
```
1. Setelah save, history auto-open
2. Atau klik manual tombol "Riwayat"
```

**Yang Harus Muncul:**
- ✅ Config terbaru di paling atas
- ✅ Badge hijau "Aktif"
- ✅ Nama lokasi: "testing di lokasi klinik nur"
- ✅ Koordinat: Lat: -6.865689, Lon: 107.538770
- ✅ Radius: 16m
- ✅ WiFi: [list SSID yang ditambahkan]
- ✅ Timestamp dibuat
- ✅ Tombol "Nonaktifkan" (orange) tersedia

---

### 3. **Activate / Deactivate**

**Test Nonaktifkan:**
```
1. Buka riwayat
2. Pilih config yang AKTIF
3. Klik "Nonaktifkan" (orange button)
```

**Yang Harus Terjadi:**
- ✅ Loading toast: "Menonaktifkan..."
- ✅ Success toast: "✅ Konfigurasi berhasil dinonaktifkan"
- ✅ Badge "Aktif" hilang
- ✅ Tombol berubah jadi 3 tombol:
  - Aktifkan (green)
  - Pulihkan (blue)
  - Hapus (red, hanya super_admin)

**Test Aktifkan:**
```
1. Klik "Aktifkan" di config non-aktif
```

**Yang Harus Terjadi:**
- ✅ Loading toast: "Mengaktifkan..."
- ✅ Success toast: "✅ Konfigurasi berhasil diaktifkan"
- ✅ Badge "Aktif" muncul lagi
- ✅ Config lain yang aktif jadi non-aktif
- ✅ Badge di header update ke config ini

---

### 4. **Sync ke Attendance Page**

**Langkah Testing:**
```
1. Save config dengan:
   - Lokasi: "testing di lokasi klinik nur"
   - Radius: 16m
   - GPS: -6.865689, 107.538770
   - WiFi: [SSID yang ada di lokasi]

2. Buka halaman /attendance (sebagai siswa/guru)
3. Lihat console browser
```

**Console Logs di Attendance Page:**
```javascript
// Saat check location
[Check Location] Using config: {
  id: 1,
  name: "testing di lokasi klinik nur",
  radius: 16,
  wifiCount: 1
}

[Check Location] Result: {
  distance: 5,        // jarak user dari titik GPS
  allowedRadius: 16,  // radius yang diizinkan
  within: true,       // true jika dalam radius
  user: "user@email.com"
}
```

**Test Validation:**
```
Scenario 1: User DALAM radius
- Distance: 5m < 16m → within: true ✅
- Absensi bisa dilanjutkan

Scenario 2: User LUAR radius
- Distance: 50m > 16m → within: false ❌
- Error: "Anda berada di luar area sekolah"

Scenario 3: No Config
- Error: "School location not configured"
- needsSetup: true
- User harus tunggu admin setup
```

---

### 5. **Update Config (Edit)**

**Langkah Testing:**
```
1. Config sudah ada (ID: 1, Aktif)
2. Edit nama lokasi jadi: "Klinik Nur - Updated"
3. Ubah radius jadi: 20m
4. Tambah 1 WiFi lagi
5. Klik "Simpan Konfigurasi"
```

**Yang Harus Terjadi:**
- ✅ Loading toast: "Menyimpan konfigurasi..."
- ✅ Success toast: "✅ Konfigurasi berhasil **diperbarui**!"
  - Bukan "disimpan" → Karena ini UPDATE bukan INSERT
- ✅ Summary box update dengan data baru
- ✅ WiFi count jadi 2 network
- ✅ Timestamp "Terakhir update" berubah
- ✅ ID tetap sama (tidak berubah)
- ✅ History auto-open, config di-update (bukan duplikat baru)

**Console Logs:**
```javascript
Save Response: {
  success: true,
  data: {...},
  message: "Konfigurasi berhasil diperbarui"  // ← Bukan "disimpan"
}
```

---

### 6. **Delete Config (Super Admin Only)**

**Langkah Testing:**
```
1. Login sebagai super_admin
2. Buat config baru (akan jadi ID: 2)
3. Nonaktifkan config ID: 2
4. Klik "Hapus" (red button)
```

**Yang Harus Terjadi:**
- ✅ Konfirmasi dialog:
  ```
  ⚠️ PERHATIAN: Konfigurasi akan dihapus permanen!
  
  Yakin ingin menghapus?
  ```
- ✅ Klik OK → Loading toast: "Menghapus konfigurasi..."
- ✅ Success toast: "✅ Konfigurasi berhasil dihapus!"
- ✅ Config hilang dari history
- ✅ History auto-refresh

**Test Protection:**
```
Scenario: Coba hapus config AKTIF
- Error: "Cannot delete active config. Deactivate it first."
- Delete button disabled/tidak muncul

Scenario: User bukan super_admin
- Delete button TIDAK MUNCUL sama sekali
- API return 403: "Only super admin can delete configs"
```

---

## 📊 Expected Console Logs (Full Flow)

### **Saat Save Config:**
```javascript
=== SAVE CONFIG DEBUG ===
Config state: {
  location_name: 'testing di lokasi klinik nur',
  latitude: -6.865689288977589,
  longitude: 107.53877033163025,
  radius_meters: 16,
  allowed_wifi_ssids: ['WIFI-TEST'],
  wifi_networks: [],
  is_active: true
}

Payload to send: {
  location_name: 'testing di lokasi klinik nur',
  latitude: -6.865689288977589,
  longitude: 107.53877033163025,
  radius_meters: 16,
  allowed_wifi_ssids: ['WIFI-TEST'],
  is_active: true
}

Save Response: {
  success: true,
  data: {
    id: 1,
    location_name: 'testing di lokasi klinik nur',
    latitude: -6.865689288977589,
    longitude: 107.53877033163025,
    radius_meters: 16,
    allowed_wifi_ssids: ['WIFI-TEST'],
    is_active: true,
    created_at: '2025-11-29T12:00:00Z',
    updated_at: '2025-11-29T12:00:00Z'
  },
  message: 'Konfigurasi berhasil disimpan'
}

Fetched config: {success: true, data: {...}}
```

### **Saat Check Location di Attendance:**
```javascript
[Check Location] Using config: {
  id: 1,
  name: 'testing di lokasi klinik nur',
  radius: 16,
  wifiCount: 1
}

[Check Location] Result: {
  distance: 8,
  allowedRadius: 16,
  within: true,
  user: 'student@school.com'
}
```

---

## 🐛 Troubleshooting

### **Problem: Config tidak muncul di history**
**Fix:**
```
1. Check console: Apakah Save Response success: true?
2. Refresh halaman (Ctrl+R)
3. Klik "Riwayat" manual
4. Check database Supabase:
   SELECT * FROM school_location_config ORDER BY created_at DESC;
```

### **Problem: Toast muncul tapi data tidak update**
**Fix:**
```
1. Check console: Apakah fetchConfig() dipanggil?
2. Check console: Apakah fetchHistory() dipanggil?
3. Hard refresh: Ctrl+Shift+R
4. Clear localStorage dan coba lagi
```

### **Problem: Attendance page error "not configured"**
**Fix:**
```
1. Pastikan ada config dengan is_active = true
2. Check query di Supabase:
   SELECT * FROM school_location_config WHERE is_active = true;
3. Jika kosong, aktifkan salah satu config
4. Refresh attendance page
```

### **Problem: Delete button tidak muncul**
**Fix:**
```
1. Check role user: Harus super_admin
2. Config harus NON-AKTIF
3. Refresh halaman
4. Check session.user.role di console
```

---

## ✅ Checklist Final

**Settings Page:**
- [ ] Save config → Toast dengan detail ✅
- [ ] Auto-open history setelah save ✅
- [ ] Badge "Config Tersimpan" muncul ✅
- [ ] Badge "Status: AKTIF" muncul ✅
- [ ] Summary box dengan 3 cards ✅
- [ ] Timestamp update ✅

**History Modal:**
- [ ] Config baru muncul di top ✅
- [ ] Badge "Aktif" ada ✅
- [ ] Tombol Nonaktifkan (orange) ✅
- [ ] Tombol Aktifkan (green) untuk non-aktif ✅
- [ ] Tombol Hapus (red) untuk super_admin ✅

**Sync & Validation:**
- [ ] Config ID sama antara save & history ✅
- [ ] Update (bukan insert duplikat) ✅
- [ ] Attendance page detect config ✅
- [ ] Distance calculation bekerja ✅
- [ ] Within radius validation works ✅

**Console Logs:**
- [ ] Save response lengkap ✅
- [ ] Check location logs detail ✅
- [ ] No error di console ✅

---

**Semua test PASSED = Ready for production! 🎉**
