# Quick Start: Runtime Configuration

## Langsung Pakai (5 Menit)

### 1. Enable Ops + Terminal
```
Login → /admin/settings
Quick Toggles:
  → ALLOW_ADMIN_OPS: klik ENABLE
  → Set ADMIN_OPS_TOKEN: "rahasia_123"
  → ALLOW_UNSAFE_TERMINAL: klik ENABLE (opsional, hati-hati!)
```

### 2. Terminal RAW Mode
```
/admin/terminal
→ Scroll bawah → RAW MODE AKTIF
→ Input command: node -v
→ Klik Run RAW
→ Masukkan token: rahasia_123
→ ✅ Output muncul!
```

### 3. Update AI Key (Tanpa Redeploy)
```
/admin/settings
→ Form API & Environment
→ OPENAI_API_KEY: sk-proj-xyz...
→ Klik Simpan
→ Langsung aktif!
```

## Keunggulan

✅ **Tanpa Redeploy** - semua update langsung aktif  
✅ **Database Persisted** - tersimpan di `admin_settings`  
✅ **Audit Trail** - semua perubahan di-log `admin_actions`  
✅ **Secure** - secret values di-mask, token required  
✅ **Fallback** - otomatis fallback ke env vars jika DB kosong  

## Keamanan

⚠️ **ALLOW_UNSAFE_TERMINAL = BERBAHAYA**  
- Bisa jalankan `rm -rf`, `shutdown`, dll  
- HANYA untuk debugging cepat  
- Wajib pakai `ADMIN_OPS_TOKEN`  
- **Matikan setelah selesai!**  

✅ **Best Practice:**  
1. Enable unsafe hanya saat butuh  
2. Jalankan command yang diperlukan  
3. Disable unsafe langsung  
4. Cek `admin_actions` untuk audit  

## Docs Lengkap

- [RUNTIME_CONFIG_GUIDE.md](./RUNTIME_CONFIG_GUIDE.md) - panduan lengkap
- [DONE_RUNTIME_CONFIG.md](./DONE_RUNTIME_CONFIG.md) - summary implementasi
- [README_ADMIN_TOOLS.md](./README_ADMIN_TOOLS.md) - admin features overview

---

**🎉 Selamat! Sistem config runtime siap digunakan.**
