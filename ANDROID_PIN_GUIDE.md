# 📱 Cara Menggunakan PIN Device di Android

## ⚠️ **PENTING - Android Users**

Saat Anda memilih **PIN Code** atau **Screen Lock PIN** di HP Android, sistem akan menampilkan **dialog passkey** terlebih dahulu. Ini adalah **behavior normal** dari Android WebAuthn.

---

## 🎯 **LANGKAH-LANGKAH:**

### **1. Pilih Metode Biometrik**

Di halaman absensi, pilih salah satu:
- **🔢 Screen Lock PIN** (rekomendasi untuk pakai PIN)
- **🔒 Fingerprint** (jika mau pakai sidik jari)
- **🔢 PIN Code** (fallback)

### **2. Dialog Passkey Muncul**

Setelah klik, Anda akan melihat dialog seperti ini:

```
┌──────────────────────────────────────┐
│  Sign in to osissmktest2.biezz.my.id │
│                                      │
│  🔑 Use a passkey                     │
│  🔓 Use screen lock                   │← KLIK INI!
│                                      │
│  [Cancel]                            │
└──────────────────────────────────────┘
```

### **3. Pilih "Use screen lock"**

**KLIK** opsi **"Use screen lock"** atau **"Gunakan kunci layar"** (bahasa Indonesia)

### **4. Masukkan PIN Device**

Sekarang Anda akan diminta memasukkan PIN lockscreen HP Anda:

```
┌──────────────────────────────────────┐
│  Confirm it's you                    │
│                                      │
│  Enter your PIN                      │
│                                      │
│  ● ● ● ● ● ●                        │
│                                      │
│  [1] [2] [3]                         │
│  [4] [5] [6]                         │
│  [7] [8] [9]                         │
│  [Cancel] [0] [OK]                   │
└──────────────────────────────────────┘
```

### **5. Selesai! ✅**

Setelah PIN benar, verifikasi berhasil dan Anda bisa lanjut absen.

---

## 🤔 **FAQ - Pertanyaan Umum**

### **Q: Kenapa muncul passkey? Saya mau pakai PIN!**
A: Ini **normal** di Android. Android WebAuthn selalu tampilkan passkey selector dulu. Pilih saja **"Use screen lock"** untuk pakai PIN device Anda.

### **Q: Apakah saya harus buat passkey?**
A: **TIDAK!** Anda tidak perlu buat passkey. Cukup pilih **"Use screen lock"** di dialog yang muncul.

### **Q: Saya sudah klik "Use screen lock" tapi tidak muncul apa-apa?**
A: Coba langkah ini:
1. Refresh halaman
2. Pastikan HP Anda sudah punya screen lock PIN/pattern
3. Coba pilih **Fingerprint** sebagai alternatif
4. Jika masih gagal, hubungi admin

### **Q: Lebih mudah pakai apa di Android?**
A: **Rekomendasi**:
1. **🔒 Fingerprint** ← PALING MUDAH! Langsung scan sidik jari
2. **🤖 Face Unlock** ← Jika HP support face unlock
3. **🔢 Screen Lock PIN** ← Jika mau pakai PIN (perlu klik "Use screen lock")

### **Q: Saya pilih Fingerprint tapi tetap minta passkey?**
A: Sama seperti PIN, pilih **"Use screen lock"** lalu nanti akan muncul fingerprint sensor.

---

## 📊 **DIAGRAM FLOW**

```
User pilih "Screen Lock PIN"
         ↓
WebAuthn triggered
         ↓
Dialog passkey muncul
         ↓
User klik "Use screen lock" ← PENTING!
         ↓
PIN prompt muncul
         ↓
User enter PIN device
         ↓
Verified! ✅
```

---

## 💡 **TIPS PRO**

### **Jika Tidak Mau Lihat Dialog Passkey:**

Gunakan **Fingerprint** atau **Face Unlock** langsung!

```
1. Pilih: 🔒 Fingerprint
2. Dialog passkey muncul
3. Klik: "Use screen lock"
4. Scan sidik jari ← Lebih cepat dari PIN!
5. Done! ✅
```

### **Jika HP Tidak Punya Fingerprint:**

```
1. Pilih: 🔢 Screen Lock PIN
2. Dialog passkey muncul
3. Klik: "Use screen lock"
4. Enter PIN device
5. Done! ✅
```

---

## ⚙️ **UNTUK DEVELOPER**

### **Kenapa Android Selalu Tampilkan Passkey Selector?**

**Technical Explanation:**

Android WebAuthn API (`navigator.credentials.get()`) secara default akan menampilkan **passkey selector UI** sebelum meminta biometric/PIN. Ini adalah **design decision** dari Google untuk:

1. **Passkey Priority**: Google mempromosikan passkey sebagai metode authentication utama
2. **User Choice**: User bisa pilih antara passkey (cloud-synced) atau device biometric
3. **Cross-Device**: Mendukung passkey dari device lain via Bluetooth

**Options yang dicoba:**

```typescript
// ❌ Tidak bisa bypass passkey selector di Android
navigator.credentials.get({
  publicKey: { ... },
  mediation: 'silent',    // ❌ Tidak work di Android
  signal: abortSignal     // ❌ Tidak work
});

// ❌ Conditional UI hanya untuk autofill
if (PublicKeyCredential.isConditionalMediationAvailable?.()) {
  // Hanya work untuk input autofill
}

// ✅ SOLUSI: User manual pilih "Use screen lock"
// Tidak ada cara programmatic untuk bypass passkey selector
```

**Alternatif yang dipertimbangkan:**

1. **Custom PIN Input** ❌
   - Tidak aman (bisa dikeylog)
   - Tidak ada encryption
   - Tidak menggunakan Secure Enclave

2. **Biometric API** ❌
   - Android tidak punya unified Biometric API untuk web
   - Hanya native apps yang bisa akses langsung

3. **Passkey as Default** ✅
   - Google recommendation
   - Tapi banyak user bingung
   - Perlu edukasi user

**Conclusion:**
Dialog passkey adalah **unavoidable** di Android untuk WebAuthn. Best practice adalah **edukasi user** untuk klik "Use screen lock".

---

## 📝 **UPDATE NOTES**

**Date**: 2025-12-04  
**Issue**: User Android bingung kenapa muncul passkey  
**Solution**: Dokumentasi lengkap + tooltip di UI  
**Status**: ✅ Documented, perlu deploy  

**Next Steps:**
1. Tambahkan tooltip di UI: "Pilih 'Use screen lock' saat dialog muncul"
2. Tambahkan screenshot/video guide
3. Monitor user feedback

---

**Author**: GitHub Copilot  
**For**: Android Users  
**Priority**: HIGH (User Education)
