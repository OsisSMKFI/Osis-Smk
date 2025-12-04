# 🔐 WEBAUTHN BIOMETRIC - TESTING GUIDE

**Status:** ✅ COMPLETE - Professional biometric authentication implemented  
**Commit:** 66a3a3a  
**Standard:** W3C WebAuthn (like Google, Apple, Microsoft)

---

## 🚨 CRITICAL: RUN DATABASE MIGRATION FIRST!

### Step 1: Run SQL Migration in Supabase
```sql
-- Go to Supabase SQL Editor
-- Copy entire WEBAUTHN_MIGRATION.sql
-- Execute

-- Verify tables created:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'webauthn%';

-- Expected: webauthn_credentials, webauthn_challenges
```

---

## 📱 TESTING ON MOBILE (Android/iPhone)

### Android Phone:
```
1. Buka https://osissmktest.biezz.my.id/attendance (HTTPS required!)
2. Login sebagai siswa
3. Klik "Daftar Biometric"
4. Take selfie photo
5. Klik "Daftar Biometric" button

EXPECTED PROMPT:
┌─────────────────────────────────┐
│  Use your fingerprint sensor    │
│  to continue to                 │
│  OSIS SMK Fithrah Insani        │
│                                 │
│  [Fingerprint Icon]             │
│                                 │
│  Touch sensor now               │
│                                 │
│  [Cancel]                       │
└─────────────────────────────────┘

6. ✋ Touch fingerprint sensor
7. ✅ Success: "🎉 Biometric Berhasil Didaftarkan!"
8. ✅ See: "📱 Fingerprint Sensor: Active"

Submit Attendance:
9. Go to attendance page
10. Klik "Absen Sekarang"

EXPECTED PROMPT:
┌─────────────────────────────────┐
│  Verify it's you                │
│                                 │
│  [Fingerprint Icon]             │
│                                 │
│  Touch sensor to continue       │
│                                 │
│  [Cancel]                       │
└─────────────────────────────────┘

11. ✋ Touch fingerprint sensor
12. ✅ Success: "✅ Biometric Verified!"
13. ✅ Attendance submitted
```

### iPhone:
```
1. Buka https://osissmktest.biezz.my.id/attendance
2. Login sebagai siswa
3. Klik "Daftar Biometric"
4. Take selfie
5. Klik "Daftar Biometric"

EXPECTED PROMPT (Face ID):
┌─────────────────────────────────┐
│  Use Face ID to continue to     │
│  OSIS SMK Fithrah Insani        │
│                                 │
│  [Face Icon Animation]          │
│                                 │
│  Position your face in frame    │
│                                 │
│  [Cancel]                       │
└─────────────────────────────────┘

OR (Touch ID):
┌─────────────────────────────────┐
│  Use Touch ID to continue       │
│                                 │
│  [Fingerprint Icon]             │
│                                 │
│  Place your finger on           │
│  Touch ID sensor                │
│                                 │
│  [Cancel]                       │
└─────────────────────────────────┘

6. 📸 Look at camera (Face ID) or touch sensor (Touch ID)
7. ✅ Success: "🎉 Biometric Berhasil Didaftarkan!"
8. ✅ See: "🔐 Face ID / Touch ID: Active"

Submit Attendance:
9. Klik "Absen Sekarang"
10. Face ID/Touch ID prompt appears
11. Authenticate
12. ✅ Attendance submitted
```

---

## 💻 TESTING ON LAPTOP/PC

### Windows Laptop (with Windows Hello):
```
1. Buka https://osissmktest.biezz.my.id/attendance
2. Login
3. Klik "Daftar Biometric"
4. Take selfie via webcam
5. Klik "Daftar Biometric"

EXPECTED PROMPT (Windows Hello Face):
┌─────────────────────────────────┐
│  Windows Security               │
│                                 │
│  Use Windows Hello to continue  │
│  to OSIS SMK Fithrah Insani     │
│                                 │
│  [Camera Icon]                  │
│                                 │
│  Look at the camera             │
│                                 │
│  [Cancel]  [Use PIN instead]    │
└─────────────────────────────────┘

OR (Windows Hello Fingerprint):
┌─────────────────────────────────┐
│  Windows Security               │
│                                 │
│  Use Windows Hello              │
│                                 │
│  [Fingerprint Icon]             │
│                                 │
│  Place your finger on the       │
│  fingerprint reader             │
│                                 │
│  [Cancel]  [Use PIN instead]    │
└─────────────────────────────────┘

6. 📸 Look at camera or touch fingerprint reader
7. ✅ Success: "🎉 Biometric Berhasil Didaftarkan!"
8. ✅ See: "🪟 Windows Hello: Active"
```

### MacBook (with Touch ID):
```
1. Buka https://osissmktest.biezz.my.id/attendance
2. Login
3. Klik "Daftar Biometric"
4. Take selfie
5. Klik "Daftar Biometric"

EXPECTED PROMPT:
┌─────────────────────────────────┐
│  "osissmktest.biezz.my.id"      │
│  wants to use Touch ID          │
│                                 │
│  [Touch ID Icon]                │
│                                 │
│  Place your finger on           │
│  Touch ID sensor                │
│                                 │
│  [Cancel]  [Use Password]       │
└─────────────────────────────────┘

6. ✋ Touch Touch ID sensor
7. ✅ Success: "🎉 Biometric Berhasil Didaftarkan!"
8. ✅ See: "🍎 Touch ID: Active"
```

### Laptop WITHOUT Biometric:
```
If no Windows Hello or Touch ID:

Expected Error:
┌─────────────────────────────────┐
│  ⚠️ Biometric Not Available     │
│                                 │
│  Fingerprint / Security Key     │
│  not available.                 │
│                                 │
│  Check device settings or use   │
│  external security key.         │
│                                 │
│  [OK]                           │
└─────────────────────────────────┘

WORKAROUND:
- Use external USB security key (YubiKey, etc)
- OR enable Windows Hello in Settings
- OR use mobile device
```

---

## 🧪 CONSOLE VERIFICATION

### Check Browser Console (F12):
```javascript
// During Registration:
[WebAuthn] 🔐 Starting registration...
[WebAuthn] 📲 Requesting credential creation...
// → Browser shows biometric prompt
[WebAuthn] ✅ Credential created!
[WebAuthn] 🎉 Registration complete!

// During Authentication:
[WebAuthn] 🔍 Starting authentication...
[WebAuthn] 📲 Requesting authentication...
// → Browser shows biometric prompt
[WebAuthn] ✅ Authentication successful!
[WebAuthn] 🎉 Authentication verified!
```

### Check Network Tab:
```
POST /api/attendance/biometric/webauthn/register-challenge
Response: 200 OK
Body: {success: true, options: {challenge, rp, user, ...}}

POST /api/attendance/biometric/webauthn/register-verify
Response: 200 OK
Body: {success: true, credentialId: "...", publicKey: "..."}

POST /api/attendance/biometric/webauthn/auth-challenge
Response: 200 OK
Body: {success: true, options: {challenge, allowCredentials, ...}}

POST /api/attendance/biometric/webauthn/auth-verify
Response: 200 OK
Body: {success: true, verified: true, credentialId: "..."}
```

---

## 🗄️ DATABASE VERIFICATION

### Check Credential Registered:
```sql
SELECT 
  user_id,
  credential_id,
  transports,
  counter,
  created_at,
  last_used_at,
  device_name,
  is_active
FROM webauthn_credentials
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC;

-- Expected:
-- 1 row with credential_id (Base64 string)
-- transports = ['internal'] (built-in biometric)
-- counter = 0 (will increment with each use)
-- is_active = true
```

### Check Authentication History:
```sql
SELECT 
  credential_id,
  counter,
  last_used_at,
  EXTRACT(EPOCH FROM (NOW() - last_used_at)) / 60 as minutes_since_last_use
FROM webauthn_credentials
WHERE user_id = 'your-user-id'
AND is_active = true;

-- Counter increments with each authentication
-- last_used_at updates on each verify
```

### Check Challenges (should be empty after use):
```sql
SELECT * FROM webauthn_challenges
WHERE user_id = 'your-user-id';

-- Expected: 0 rows (challenges deleted after verification)

-- If any expired challenges exist:
SELECT 
  type,
  expires_at,
  EXTRACT(EPOCH FROM (NOW() - expires_at)) as seconds_expired
FROM webauthn_challenges
WHERE expires_at < NOW();
```

---

## 🎯 COMPLETE USER FLOW

### First Time Setup:
```
1. User login → /attendance
2. System checks: hasSetup = false
3. Step = 'setup'
4. User takes selfie photo
5. User clicks "Daftar Biometric"
6. Toast: "✅ Biometric Ready! 📱 Fingerprint Sensor available"
7. Photo uploads → Supabase storage
8. Toast: "🔐 Setting up biometric... Please authenticate with Fingerprint Sensor"
9. Browser shows biometric prompt
10. User authenticates (fingerprint/Face ID/Windows Hello)
11. WebAuthn credential created
12. Credential verified and stored
13. Toast: "🎉 Biometric Berhasil Didaftarkan!
              ✅ Foto: Uploaded
              ✅ Fingerprint: Registered
              ✅ 📱 Fingerprint Sensor: Active
              Status: Siap untuk absensi!"
14. Step = 'ready'
15. User can now submit attendance
```

### Submit Attendance:
```
1. User at /attendance
2. hasSetup = true
3. Requirements check: ✅ WiFi, ✅ GPS, ✅ Biometric
4. User clicks "Absen Sekarang"
5. Toast: "🔐 Biometric Verification Required
           📱 Please authenticate with Fingerprint Sensor"
6. Browser shows biometric prompt
7. User authenticates
8. Toast: "✅ Biometric Verified!
           📱 Fingerprint Sensor authentication successful"
9. Photo uploads
10. AI face verification
11. Security validation
12. Attendance submitted
13. Success! ✅
```

---

## ⚠️ ERROR SCENARIOS

### Scenario 1: User Cancels Biometric
```
User clicks "Cancel" on prompt

Expected:
- Toast: "❌ Biometric Verification Failed
          Biometric authentication cancelled"
- Step returns to 'ready'
- User can try again
```

### Scenario 2: Biometric Not Available
```
Device has no biometric sensor

Expected:
- Toast: "⚠️ Fingerprint Sensor Not Available
          Check device settings"
- Registration fails gracefully
- Suggest alternative: use mobile device
```

### Scenario 3: Timeout
```
User doesn't respond to prompt (60 seconds)

Expected:
- Toast: "❌ Biometric Error
          Authentication timeout"
- Step returns to 'ready'
- User can retry
```

### Scenario 4: HTTPS Required
```
Accessing via HTTP (localhost OK, but not production)

Expected:
- Toast: "❌ Biometric Error
          Security error - please use HTTPS"
- WebAuthn only works on HTTPS
```

---

## ✅ SUCCESS CRITERIA

### Registration Success:
- [ ] Browser shows platform-specific biometric prompt
- [ ] User authenticates successfully
- [ ] Toast shows success with device type
- [ ] Database has credential entry
- [ ] credential_id stored
- [ ] counter = 0
- [ ] is_active = true

### Authentication Success:
- [ ] Browser shows biometric prompt on attendance submit
- [ ] User authenticates
- [ ] Toast: "✅ Biometric Verified!"
- [ ] Database counter incremented
- [ ] last_used_at updated
- [ ] Attendance submission continues

### Error Handling:
- [ ] Graceful failure messages
- [ ] User can retry
- [ ] No crashes or freezes
- [ ] Console shows clear error logs

---

## 📊 SUPPORTED PLATFORMS

| Platform | Biometric Type | Status | Icon |
|----------|---------------|--------|------|
| Android | Fingerprint | ✅ Supported | 📱 |
| iPhone | Face ID | ✅ Supported | 🔐 |
| iPhone | Touch ID | ✅ Supported | 🔐 |
| Windows | Hello Face | ✅ Supported | 🪟 |
| Windows | Hello Fingerprint | ✅ Supported | 🪟 |
| MacBook | Touch ID | ✅ Supported | 🍎 |
| Chrome OS | Fingerprint | ✅ Supported | 🔒 |
| Security Key | YubiKey/USB | ✅ Supported | 🔑 |
| Desktop (no biometric) | ❌ Not Available | Use mobile |  |

---

## 🔧 TROUBLESHOOTING

### Problem: Button does nothing
```
Check:
1. Database migration run? → Run WEBAUTHN_MIGRATION.sql
2. HTTPS enabled? → WebAuthn requires HTTPS
3. Browser supports WebAuthn? → Update browser
4. Console errors? → F12 → Check errors

Fix:
- Run migration
- Use HTTPS (not HTTP)
- Update to latest Chrome/Edge/Safari/Firefox
```

### Problem: "WebAuthn not supported"
```
Browser too old

Solution:
- Update to latest browser version
- Or use modern browser:
  * Chrome 67+
  * Edge 18+
  * Safari 13+
  * Firefox 60+
```

### Problem: Prompt doesn't appear
```
Biometric not configured on device

Solution:
- Android: Settings → Security → Fingerprint
- iPhone: Settings → Face ID & Passcode
- Windows: Settings → Accounts → Sign-in options → Windows Hello
- Mac: System Preferences → Touch ID
```

---

**STATUS:** ✅ READY FOR TESTING  
**NEXT:** Run migration → Test on mobile → Test biometric  
**EXPECTED:** Professional biometric prompts like international websites! 🌍🔐
