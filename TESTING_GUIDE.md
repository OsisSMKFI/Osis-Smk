# Quick Testing Guide - Admin Panel Sync & GPS Accuracy

## 🎯 Priority Tests

### 1. Test Radius Synchronization (UTAMA!)
```
✅ Langkah:
1. Login sebagai admin
2. Buka: /admin/attendance
3. Tab "Lokasi Sekolah"
4. Ubah "Radius Validasi": 50m → 100m
5. Klik "Save"
6. Buka tab baru: /attendance?forceRefresh=1
7. Check di browser console:
   - Cari: "Allowed Radius"
   - Harus: 100 (bukan 50)

💡 Alternatif tanpa forceRefresh:
   - Tunggu 5 menit
   - Refresh halaman attendance
   - Radius akan update otomatis
```

### 2. Test GPS Accuracy
```
✅ Langkah:
1. Buka attendance di MOBILE (Chrome/Safari)
2. Allow location permission
3. Tunggu GPS lock (~5 detik)
4. Buka browser console
5. Cari log: "GPS accuracy"
6. Expected: ±5-10 meters

📱 Mobile Only:
   - Android: Chrome terbaik
   - iOS: Safari (akan minta permission)
   
⚠️ Desktop GPS kurang akurat (WiFi triangulation)
```

### 3. Test Data Persistence
```
✅ Langkah:
1. Buka attendance page
2. Tunggu analysis selesai
3. Hard refresh: Ctrl+Shift+R (atau Cmd+Shift+R Mac)
4. Check console:
   - Harus ada: "Restored from localStorage"
   - Tidak ada: API call ke /api/school/wifi-config
   
💾 Data tersimpan 5 menit di localStorage
   - Version: v2.0
   - Auto-cleanup di 90% quota
```

### 4. Test Bypass GPS Mode
```
✅ Langkah:
1. Admin Panel → Toggle "Bypass GPS Validation" ON
2. Save
3. Attendance page → Bisa absen dari MANA SAJA
4. GPS check di-skip
5. Cocok untuk testing/development

⚠️ Matikan di production!
```

### 5. Test Network Security Level
```
✅ Langkah:
1. Admin Panel → "Network Security Level"
2. Pilih: Low / Medium / High / Strict
3. Save
4. Attendance page → Validasi sesuai level

Level Effects:
- Low:    GPS soft, WiFi skip
- Medium: GPS yes, WiFi soft (DEFAULT)
- High:   GPS strict, WiFi yes, IP soft
- Strict: GPS strict, WiFi strict, IP yes
```

## 🌐 Browser Compatibility Check

### Desktop
```bash
✅ Chrome 90+
   Open: chrome://version
   Expected: Version 90 or higher
   
✅ Firefox 88+
   Open: about:support
   Expected: Version 88 or higher
   
✅ Edge 90+
   Open: edge://version
   Expected: Version 90 or higher
```

### Mobile
```
✅ Android Chrome
   Settings → About Chrome
   Expected: Latest version
   
✅ iOS Safari
   Settings → General → About
   Expected: iOS 14+ (Safari 14+)
```

## 🔧 Console Commands

### Check Cache Status
```javascript
// Run in browser console
const userId = 'YOUR_USER_ID'; // Ganti dengan ID user
const cache = localStorage.getItem(`bg-analysis-${userId}`);

if (cache) {
  const parsed = JSON.parse(cache);
  const age = (Date.now() - parsed.timestamp) / 1000;
  console.log(`Cache age: ${age.toFixed(0)}s (max 300s)`);
  console.log('Cached data:', parsed.result.location);
} else {
  console.log('No cache found');
}
```

### Force Refresh
```javascript
// Method 1: URL parameter
window.location.href = '/attendance?forceRefresh=1';

// Method 2: Clear cache
localStorage.clear();
location.reload();

// Method 3: Clear specific user cache
const userId = 'YOUR_USER_ID';
localStorage.removeItem(`bg-analysis-${userId}`);
location.reload();
```

### Check GPS Accuracy
```javascript
// Run in browser console
navigator.geolocation.getCurrentPosition(
  (pos) => {
    console.log('GPS Accuracy:', pos.coords.accuracy, 'meters');
    console.log('Latitude:', pos.coords.latitude);
    console.log('Longitude:', pos.coords.longitude);
  },
  (err) => console.error('GPS Error:', err),
  { enableHighAccuracy: true }
);
```

## 📊 Expected Console Output

### Successful Load
```
[Background Analyzer] 🔄 Starting analysis...
[GPS] ✅ Location detected: ±8.5m
[WiFi Config] ✅ Config loaded
[Location] ✅ Within radius: 45m / 100m allowed
✅ Analysis complete in 3.2s
```

### Cache Restored
```
[Background Analyzer] ✅ Restored from localStorage
Cache age: 127s (max 300s)
```

### Force Refresh
```
[Background Analyzer] 🔄 Force refresh requested
[API] Fetching fresh config...
✅ Cache updated
```

## ⚠️ Common Issues & Solutions

### GPS Tidak Akurat (±50m+)
```
Solusi:
1. Gunakan MOBILE device (bukan desktop)
2. Di outdoor (bukan dalam ruangan)
3. Pastikan GPS enabled di device
4. Tunggu ~10 detik untuk GPS lock
```

### Radius Tidak Update
```
Solusi:
1. Cek admin panel settings tersimpan
2. Tunggu 5 menit (cache expiry)
3. Atau force refresh: /attendance?forceRefresh=1
4. Clear localStorage jika masih gagal
```

### localStorage Full
```
Solusi:
Auto-cleanup akan jalan di 90% quota.
Manual cleanup:
  for (let key in localStorage) {
    if (key.startsWith('bg-analysis-')) {
      localStorage.removeItem(key);
    }
  }
```

### HTTPS Error
```
Error: Geolocation requires HTTPS
Solusi:
- Production: MUST use HTTPS
- Development: Use localhost (exempted)
- IP access: Use ngrok/cloudflare tunnel
```

## 📱 Testing on Real Device

### Android
```
1. Connect phone ke same network sebagai dev machine
2. Get local IP: ipconfig (Windows) / ifconfig (Mac/Linux)
3. Ngrok tunnel:
   npx ngrok http 3000
4. Open ngrok URL di mobile Chrome
5. Allow location permission
6. Test GPS accuracy
```

### iOS
```
1. Setup ngrok tunnel (HTTPS required)
2. Open Safari di iPhone
3. Navigate to ngrok URL
4. Tap "Allow" for location
5. Test GPS accuracy

⚠️ WiFi SSID detection limited on iOS
   Fallback to IP range validation
```

## 🎯 Success Criteria

### ✅ All Tests Pass When:
- [ ] Radius change di admin panel → attendance update
- [ ] GPS accuracy ±5-10m on mobile
- [ ] localStorage persist across refresh
- [ ] Force refresh clears cache & reloads
- [ ] Bypass GPS mode works
- [ ] Security levels apply correctly
- [ ] Works on Chrome, Firefox, Safari, Edge
- [ ] Mobile (Android + iOS) GPS works
- [ ] No console errors
- [ ] Page load < 2s with cache

## 📖 Full Documentation
- **Browser Compatibility**: BROWSER_COMPATIBILITY.md
- **Admin Settings**: ADMIN_PANEL_STATUS.md
- **API Documentation**: API_DOCUMENTATION.md

---

**Version:** 2.0 (High Accuracy)  
**Last Updated:** December 2, 2025
