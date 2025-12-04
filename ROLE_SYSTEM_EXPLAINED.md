# 🔐 Role System & Session Management - Penjelasan Lengkap

## ⚠️ PENTING: Cara Role System Bekerja

### Masalah yang Sering Terjadi

**Gejala:**
- Admin update role user dari `siswa` ke `admin`
- User masih tidak bisa akses halaman admin
- Halaman admin masih 404 untuk user tersebut
- Role lama masih terdeteksi

**Penyebab:**
Role disimpan dalam **JWT token** yang di-cache di browser. JWT token ini:
- Berlaku selama **5 menit** (default setting baru)
- Harus di-refresh agar role baru terdeteksi
- Tidak otomatis update saat role diubah di database

---

## ✅ Solusi: 3 Cara Update Role

### Cara 1: Refresh Browser (PALING MUDAH)
Setelah admin update role:

1. **User harus REFRESH browser** (tekan F5 atau Ctrl+R)
2. Tunggu 5-10 detik
3. Refresh sekali lagi
4. Role baru akan terdeteksi

**Kenapa perlu refresh 2x?**
- Refresh pertama: Trigger JWT refresh
- Refresh kedua: Pakai JWT yang sudah di-refresh

### Cara 2: Logout dan Login Kembali (PALING AMAN)
1. User klik Logout
2. Login kembali dengan credential yang sama
3. Role baru langsung aktif

### Cara 3: Tunggu 5 Menit (OTOMATIS)
- JWT token expire setelah 5 menit
- Role otomatis di-refresh saat token expire
- User cukup refresh browser setelah 5 menit

---

## 🔧 Konfigurasi JWT Session

### Setting Saat Ini (di `lib/auth.ts`):

```typescript
session: { 
  strategy: 'jwt', 
  maxAge: 5 * 60,      // JWT expire 5 menit
  updateAge: 60,        // Check update setiap 60 detik
}
```

**Artinya:**
- JWT token valid 5 menit
- Setiap 60 detik, system cek apakah perlu refresh
- Setiap refresh, role di-fetch ulang dari database

### Untuk Production (Nanti):

Ubah ke yang lebih lama untuk performa lebih baik:

```typescript
session: { 
  strategy: 'jwt', 
  maxAge: 30 * 60,     // 30 menit
  updateAge: 5 * 60,    // Check setiap 5 menit
}
```

---

## 📋 Checklist untuk Admin

Setelah update role user:

- [ ] Beritahu user untuk **REFRESH browser 2x**
- [ ] Atau minta user **logout dan login kembali**
- [ ] Jika masih tidak bisa, tunggu **5 menit** lalu refresh
- [ ] Cek di database: role sudah berubah?
- [ ] Cek di Vercel logs: JWT callback log "ROLE CHANGED"?

---

## 🔍 Debugging Role Issues

### Cek Role di Database
```sql
SELECT id, email, role, approved, email_verified 
FROM users 
WHERE email = 'user@example.com';
```

### Cek JWT Logs (Vercel Functions)
1. Buka Vercel Dashboard → Logs
2. Filter: Runtime Logs
3. Cari: `[NextAuth] jwt - ROLE CHANGED`
4. Harusnya muncul log saat user refresh

### Cek Middleware Logs
1. Filter: Runtime Logs
2. Cari: `[Middleware] Fetched fresh role from DB`
3. Lihat: `dbRole` vs `sessionRole`

### Test di Browser Console
```javascript
// Cek session saat ini
fetch('/api/auth/refresh-session')
  .then(r => r.json())
  .then(d => console.log('Current session:', d))

// Lihat role di session
console.log(window.sessionStorage)
```

---

## 🚨 Troubleshooting

### User sudah refresh 2x tapi role masih lama

**Solusi:**
1. Clear browser cache & cookies
2. Atau buka Incognito/Private window
3. Login kembali
4. Role baru harus muncul

### User sudah logout-login tapi role masih lama

**Kemungkinan:**
1. Database belum ter-update → Cek di Supabase
2. JWT callback error → Cek Vercel logs untuk error
3. Middleware cache → Restart Vercel deployment

**Fix:**
```bash
# Redeploy Vercel
vercel --prod
```

### Role sudah benar di DB tapi middleware masih pakai role lama

**Penyebab:** Middleware cache atau JWT belum expire

**Fix:**
1. User clear cookies
2. User logout-login
3. Redeploy Vercel jika perlu

---

## 💡 Best Practices

### Untuk Admin:
- ✅ Selalu beritahu user setelah update role
- ✅ Minta user refresh browser 2x atau logout-login
- ✅ Jangan update role saat user sedang login (bisa bingung)
- ✅ Update role saat user offline lebih baik

### Untuk Developer:
- ✅ Set `maxAge` pendek (5 menit) saat development/testing
- ✅ Set `maxAge` lebih lama (30 menit) di production
- ✅ Monitor Vercel logs untuk JWT refresh
- ✅ Tambahkan alert jelas saat role diubah

### Untuk User:
- ✅ Refresh browser setelah admin update role
- ✅ Atau logout dan login kembali
- ✅ Tunggu beberapa detik setelah login
- ✅ Jangan spam refresh (tunggu 5-10 detik)

---

## 📊 Flow Diagram

```
Admin Update Role
       ↓
Database Updated
       ↓
User Masih Pakai JWT Lama (max 5 menit)
       ↓
    3 Opsi:
       ↓
1. Refresh Browser 2x → JWT di-refresh → Role baru aktif
2. Logout → Login → JWT baru dengan role baru
3. Tunggu 5 menit → JWT expire → Auto refresh → Role baru aktif
```

---

## 🔐 Security Note

**Kenapa pakai JWT dengan expire time?**
- ✅ Performance: Tidak perlu query DB setiap request
- ✅ Security: Token expire otomatis
- ✅ Scale: Stateless, tidak perlu store session di server

**Kenapa role bisa stuck?**
- JWT di-cache untuk performance
- Refresh hanya terjadi saat token expire atau force refresh
- Ini **by design**, bukan bug

**Trade-off:**
- Performance vs Real-time updates
- Setting saat ini: 5 menit (balance antara keduanya)

---

**Last Updated:** 27 November 2025  
**Status:** ✅ Working as designed  
**Action Required:** User harus refresh browser setelah role diubah
