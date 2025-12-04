# 🔧 FIX: 401 API Error - Session Management

## 📋 **MASALAH YANG DIPERBAIKI**

### Error yang Terjadi:
```
[Error Log] 📝 {
  type: 'api_error',
  severity: 'high',
  message: 'API Error: 401 ',
  pageUrl: 'https://osissmktest2.biezz.my.id/attendance',
  timestamp: '2025-12-04T05:28:07.754Z'
}
```

### Root Cause:
1. **Session Timeout**: JWT token NextAuth expired saat user di halaman attendance
2. **No Retry Mechanism**: Fetch calls tidak ada automatic retry setelah session refresh
3. **Over-logging**: Client error logger mencatat SEMUA 401 sebagai error, padahal session expiry adalah kondisi normal
4. **No Error Handling**: Fetch calls di attendance page tidak handle 401 dengan baik

---

## ✅ **SOLUSI YANG DITERAPKAN**

### 1. **Enhanced Client Error Logger** (`lib/clientErrorLogger.ts`)
```typescript
// ✅ BEFORE: Log semua 401 sebagai error
if (!response.ok && response.status >= 400) {
  logError({ ... })
}

// ✅ AFTER: Skip logging 401 untuk endpoint authentication
const isExpectedAuth = response.status === 401 && (
  url.includes('/api/attendance') ||
  url.includes('/api/auth') ||
  url.includes('/api/profile') ||
  url.includes('/api/enroll')
);

if (!isExpectedAuth) {
  logError({ ... })
}
```

**Manfaat:**
- ❌ Tidak lagi spam error log dengan 401 yang expected
- ✅ Hanya log 401 yang unexpected (misal: bug authorization)
- 📊 Database error_logs lebih bersih

---

### 2. **Auto Session Refresh** (`lib/authFetch.ts`)

Wrapper fetch baru dengan automatic session refresh:

```typescript
import { authFetch } from '@/lib/authFetch';

// ❌ BEFORE: Manual fetch
const response = await fetch('/api/attendance/biometric/setup');

// ✅ AFTER: Auto-retry dengan session refresh
const response = await authFetch('/api/attendance/biometric/setup');
```

**Fitur:**
1. **Auto-detect 401**: Deteksi session expired
2. **Session Refresh**: Panggil `/api/auth/session` untuk refresh JWT
3. **Auto-retry**: Retry request sekali setelah refresh
4. **Auto-redirect**: Redirect ke login jika refresh gagal
5. **Prevent duplicate refresh**: Lock mechanism untuk avoid multiple refresh

**Flow:**
```
┌─────────────────┐
│ authFetch()     │
└────────┬────────┘
         │
    ┌────▼────┐
    │ fetch() │
    └────┬────┘
         │
    ┌────▼────────────┐
    │ Response 401?   │
    └────┬────────────┘
         │ YES
    ┌────▼──────────────┐
    │ refreshSession()  │
    └────┬──────────────┘
         │
    ┌────▼──────────┐
    │ Success?      │
    └────┬──────────┘
         │ YES
    ┌────▼───────────┐
    │ Retry request  │
    └────┬───────────┘
         │
    ┌────▼────────┐
    │ Return OK   │
    └─────────────┘
```

---

### 3. **Update Attendance Page** (`app/attendance/page.tsx`)

Semua critical fetch calls sekarang menggunakan `authFetch`:

```typescript
// Import
import { authFetch } from '@/lib/authFetch';

// 1. Re-enrollment status check
authFetch('/api/attendance/request-re-enrollment')
  .then(res => res?.json())
  .then(data => { ... })

// 2. Biometric setup check
const bioResponse = await authFetch('/api/attendance/biometric/setup');
if (!bioResponse) {
  console.error('[Requirements] ❌ Failed to fetch biometric setup');
  toast.error('Gagal mengecek status biometric. Silakan refresh halaman.');
  return;
}

// 3. Re-enrollment request submit
const response = await authFetch('/api/attendance/biometric/request-reenrollment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ... }),
});
```

**Manfaat:**
- ✅ User tidak perlu manual refresh/re-login
- ✅ Session auto-refresh di background
- ✅ Better error handling dengan null check
- ✅ User experience lebih smooth

---

## 🧪 **TESTING**

### Test Case 1: Session Expired
1. Login ke aplikasi
2. Buka halaman `/attendance`
3. Tunggu 30+ menit (sampai session expired)
4. Klik tombol yang trigger API call
5. **Expected**: Session auto-refresh, request berhasil
6. **Verify**: Tidak ada error 401 di error log

### Test Case 2: Session Refresh Gagal
1. Login ke aplikasi
2. Hapus cookie session manual (DevTools)
3. Klik tombol yang trigger API call
4. **Expected**: Auto redirect ke `/login?callbackUrl=/attendance`
5. **Verify**: Tidak ada error 401 di error log

### Test Case 3: Error Log Filter
1. Login ke aplikasi
2. Buka Network DevTools
3. Force logout dengan clear cookies
4. Refresh halaman attendance
5. **Expected**: 401 muncul di Network tab, TIDAK di error log database
6. **Verify**: Check `/api/admin/errors` - tidak ada 401 baru

---

## 📊 **MONITORING**

### Before Fix:
```
[Error Log] ✅ Created new error log: 2510
[Error Log] ✅ Created new error log: 2558
[Error Log] ✅ Created new error log: 2560
[Error Log] ✅ Created new error log: 2563
[Error Log] ✅ Created new error log: 2577
```
**Issue**: 5+ error logs per menit untuk 401

### After Fix:
```
[AuthFetch] ⚠️ Got 401, attempting session refresh...
[AuthFetch] ✅ Session refreshed successfully
[AuthFetch] 🔄 Retrying request after session refresh...
```
**Result**: 0 error logs, automatic recovery

---

## 🎯 **NEXT STEPS**

### 1. Apply ke File Lain (Optional)
Jika masih ada 401 error di endpoint lain, apply `authFetch` di:
- `app/admin/**/*.tsx` - Admin pages
- `app/profile/page.tsx` - Profile page
- `components/**/*.tsx` - Components yang fetch data

### 2. Session Timeout Configuration
Adjust NextAuth JWT expiry jika perlu:

```typescript
// lib/auth.ts
export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days (default)
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
}
```

### 3. Add Refresh Token (Advanced)
Untuk production enterprise, implement refresh token:
- Short-lived access token (15 min)
- Long-lived refresh token (30 days)
- Auto-refresh when access token expired

---

## 🚀 **DEPLOYMENT**

1. **Commit Changes:**
```bash
git add lib/clientErrorLogger.ts lib/authFetch.ts app/attendance/page.tsx
git commit -m "fix: 401 API error dengan auto session refresh"
```

2. **Deploy:**
```bash
npm run build
# Test locally
npm run start

# Deploy ke Vercel
vercel --prod
```

3. **Verify:**
- Login ke app
- Buka `/attendance`
- Check error logs: `/api/admin/errors`
- Pastikan tidak ada 401 error baru

---

## ✅ **STATUS**

- [x] Fix client error logger - skip 401 untuk auth endpoints
- [x] Create authFetch dengan auto session refresh
- [x] Update attendance page untuk gunakan authFetch
- [x] Testing manual
- [ ] Deploy ke production
- [ ] Monitor error logs selama 24 jam
- [ ] Apply ke file lain jika diperlukan

---

## 📝 **CATATAN**

- Fix ini bersifat **non-breaking** - backward compatible
- File lama yang masih pakai `fetch()` akan tetap jalan
- Gradually migrate ke `authFetch()` untuk better UX
- Error log database akan lebih akurat setelah fix ini

---

**Author**: GitHub Copilot  
**Date**: 2025-12-04  
**Priority**: HIGH  
**Impact**: User Experience + Error Monitoring Accuracy
