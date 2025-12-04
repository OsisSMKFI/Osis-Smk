# 🚨 QUICK FIX: RLS Error saat Upload Foto

## Error yang Muncul
```
❌ new row violates row-level security policy
```

Terjadi saat:
- Upload background image di `/admin/settings`
- Upload gambar di `/admin/content`
- Upload foto gallery di `/admin/gallery`

---

## ⚡ Solusi Cepat (5 menit)

### Step 1: Buka Supabase Dashboard
1. Login ke [Supabase Dashboard](https://app.supabase.com)
2. Pilih project webosis
3. Klik **SQL Editor** di sidebar kiri
4. Klik **New Query**

### Step 2: Jalankan SQL Fix

**Copy SEMUA isi file ini:**
- `FIX-STORAGE-RLS.sql` (untuk storage upload)
- `FINAL-FIX-ADMIN-SETTINGS.sql` (untuk admin_settings table)

**Paste di SQL Editor dan klik RUN**

### Step 3: Verify

Setelah run SQL, cek output:
- ✅ "Authenticated users can upload to gallery" policy created
- ✅ "RLS DISABLED - PERFECT!" untuk admin_settings
- ✅ "INSERT TEST PASSED" untuk admin_settings

### Step 4: Test di Website

1. Buka `/admin/settings`
2. Pilih mode "Background Image"
3. Klik "Upload Background Image"
4. Pilih file gambar
5. **Seharusnya sukses upload tanpa error!** ✅

---

## 🔍 Apa yang Diperbaiki?

### Problem 1: Storage Bucket RLS
**Before:**
- Storage bucket `gallery` tidak punya policies
- Authenticated users tidak bisa INSERT ke storage.objects
- Error: "new row violates row-level security policy"

**After:**
- Policy untuk INSERT (upload)
- Policy untuk UPDATE (edit)
- Policy untuk DELETE (hapus)
- Policy untuk SELECT (public read)

### Problem 2: Admin Settings Table RLS
**Before:**
- Table admin_settings punya RLS enabled
- Policies terlalu strict atau tidak cocok
- supabaseAdmin tetap kena block (weird Supabase behavior)

**After:**
- Table di-recreate dari scratch
- RLS DISABLED secara explicit
- All permissions granted ke semua roles
- Backup data dijalankan sebelum recreate

---

## 📁 File SQL yang Harus Dijalankan

### 1. `FIX-STORAGE-RLS.sql`
**Untuk:** Upload gambar (storage bucket)

**Isi:**
```sql
CREATE POLICY "Authenticated users can upload to gallery"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'gallery');

CREATE POLICY "Authenticated users can update gallery files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'gallery');

CREATE POLICY "Authenticated users can delete gallery files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'gallery');

CREATE POLICY "Public can read gallery files"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'gallery');
```

### 2. `FINAL-FIX-ADMIN-SETTINGS.sql`
**Untuk:** Save settings di database

**Isi:**
- Backup existing data
- Drop all policies
- Drop table
- Create fresh table with correct schema
- FORCE DISABLE RLS (multiple commands)
- Grant ALL permissions
- Restore data
- Test INSERT

---

## ✅ Testing Checklist

### Storage Upload Test
- [ ] Open `/admin/settings`
- [ ] Click "Background Image" mode
- [ ] Upload foto (JPG/PNG)
- [ ] **Expect:** Progress bar → "✅ Berhasil upload!"
- [ ] **Not:** "new row violates row-level security policy" ❌

### Settings Save Test
- [ ] Change background color
- [ ] Click "Simpan Settings"
- [ ] **Expect:** "✅ Settings tersimpan! ..."
- [ ] **Not:** "new row violates row-level security policy" ❌

### Content Upload Test
- [ ] Open `/admin/content`
- [ ] Add new content (type: image)
- [ ] Upload image
- [ ] **Expect:** Image preview + URL filled
- [ ] **Not:** RLS error ❌

---

## 🐛 Jika Masih Error

### Scenario 1: Storage masih error
```bash
# Cek bucket exists
SELECT id, name, public FROM storage.buckets WHERE id = 'gallery';

# Cek policies
SELECT policyname FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
```

**Fix:**
- Pastikan bucket `gallery` exists
- Pastikan bucket public = true
- Re-run `FIX-STORAGE-RLS.sql`

### Scenario 2: Admin settings masih error
```bash
# Cek RLS status
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'admin_settings';

# Jika rowsecurity = true, run:
ALTER TABLE admin_settings DISABLE ROW LEVEL SECURITY;
```

**Fix:**
- Re-run `FINAL-FIX-ADMIN-SETTINGS.sql`
- Verify output ada "RLS DISABLED"
- Check di Supabase Table Editor → admin_settings → Settings → RLS = OFF

### Scenario 3: Permission denied
```bash
# Grant semua permissions lagi
GRANT ALL ON admin_settings TO postgres;
GRANT ALL ON admin_settings TO authenticated;
GRANT ALL ON admin_settings TO service_role;
GRANT ALL ON TABLE admin_settings TO PUBLIC;
```

---

## 💡 Pro Tips

### Avoid RLS Issues in Future
1. **Always disable RLS** untuk admin-only tables
2. **Use supabaseAdmin** di server-side code (API routes)
3. **Test policies** sebelum production
4. **Backup data** sebelum recreate tables

### Storage Best Practices
1. Set bucket `public = true` untuk public assets
2. Create policies untuk authenticated users
3. Add file size validation (client-side)
4. Use WebP format untuk smaller size

### Database Best Practices
1. Use migration files untuk schema changes
2. Test di local Supabase dulu
3. Backup production DB sebelum major changes
4. Document all policies dan permissions

---

## 📞 Need Help?

Jika masih stuck:
1. Screenshot error message (full)
2. Screenshot SQL output
3. Screenshot Supabase Table Editor (admin_settings settings)
4. Share di group/chat untuk debugging

---

## ✅ Success Indicators

**Upload foto berhasil:**
```
✅ Berhasil upload!
✅ Image URL: https://...supabase.co/storage/v1/object/public/gallery/backgrounds/...
```

**Save settings berhasil:**
```
✅ Settings tersimpan! 3 key diupdate: GLOBAL_BG_MODE, GLOBAL_BG_IMAGE, GLOBAL_BG_IMAGE_OVERLAY_COLOR
```

**No more errors:**
```
❌ GONE: "new row violates row-level security policy"
❌ GONE: "permission denied for table admin_settings"
```

---

**Status:** Ready to fix 🔧
**Time needed:** 5-10 minutes
**Difficulty:** Easy (copy-paste SQL)
