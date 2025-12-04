# 🧪 Quick Test: Biometric After Fix

## ⚡ CARA CEPAT TEST (5 MENIT)

### **1. Test di Browser Console**

```javascript
// Buka halaman /attendance
// Open DevTools (F12)
// Paste command ini:

const script = document.createElement('script');
script.src = '/debug-biometric.js';
document.head.appendChild(script);

// Tunggu sebentar, lalu run:
testWebAuthnRegistration()
```

**Yang harus kamu perhatikan:**
- ✅ **Android**: Apa yang muncul? Langsung fingerprint atau ada passkey selector?
- ✅ **iOS**: Langsung Face ID/Touch ID muncul?
- ✅ **Windows**: Langsung Windows Hello muncul?

### **2. Test Registration Flow**

1. Login ke app
2. Buka `/attendance`
3. Pilih metode biometric:
   - **Android**: Pilih 🔒 **Fingerprint**
   - **iOS**: Pilih 🔐 **Face ID**
   - **Windows**: Pilih 🪟 **Windows Hello Face**

4. Observe prompts:
   ```
   ✅ BEST: Langsung device biometric prompt
   ⚠️  OK: Passkey selector → klik "Use screen lock" → device prompt
   ❌ BAD: Error atau tidak bisa authenticate
   ```

### **3. Test Authentication Flow**

1. Setelah setup berhasil
2. Klik "Mulai Absensi"
3. Biometric verification triggered
4. Check:
   ```
   ✅ Device prompt muncul
   ✅ Bisa authenticate
   ✅ Lanjut ke photo capture
   ```

## 📊 **EXPECTED RESULTS**

### **✅ SUCCESS INDICATORS:**

- [ ] No 401 errors in console
- [ ] Biometric registration berhasil
- [ ] Device prompt muncul (fingerprint/face/PIN)
- [ ] Bisa complete attendance submission
- [ ] No passkey selector (Android best case) OR passkey selector minimal

### **❌ FAILURE INDICATORS:**

- [ ] 401 error berulang
- [ ] WebAuthn error di console
- [ ] Device prompt tidak muncul
- [ ] Attendance submission gagal

## 🔍 **DEBUG CHECKLIST**

Jika ada masalah, check:

1. **Console Errors:**
   ```
   F12 → Console tab
   Filter: "error" atau "WebAuthn"
   ```

2. **Network Tab:**
   ```
   F12 → Network tab
   Filter: "biometric" atau "webauthn"
   Check status: 200 OK atau 401/500?
   ```

3. **Server Logs:**
   ```
   Check /api/admin/errors
   Any WebAuthn errors?
   ```

## 💡 **TIPS**

### **Android Users:**

Jika passkey selector muncul:
1. ✅ Ini NORMAL (tidak bisa 100% dihindari)
2. ✅ Klik "Use screen lock"
3. ✅ Lanjutkan dengan fingerprint/PIN

### **Lebih cepat:**
Pilih **Fingerprint** daripada **Screen Lock PIN**
→ Scan lebih cepat daripada ketik PIN

## 🚀 **PRODUCTION TEST**

Setelah deploy:
1. Test di 3 device berbeda (Android, iOS, Windows jika bisa)
2. Monitor error logs selama 1 jam
3. Gather user feedback
4. Check success rate

---

**Quick Status Check:**
```bash
# Check if fixes deployed
curl https://osissmktest2.biezz.my.id/debug-biometric.js | head -5
# Should return JavaScript file

# Check error logs
# Visit: /api/admin/errors
# Filter: Last 1 hour
# Expected: No 401 errors, no WebAuthn errors
```

---

**Need Help?**
- Check: FIX_BIOMETRIC_SCREEN_LOCK_DIRECT.md
- Check: ANDROID_PIN_GUIDE.md  
- Run: debug-biometric.js script
