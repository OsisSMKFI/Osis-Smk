# Setup Storage Buckets - Quick Guide

## Problem
❌ Upload gagal: Bucket not found

## Solution - Method 1: SQL (Recommended)

### Steps:
1. Buka Supabase Dashboard → SQL Editor
2. Klik **New Query**
3. Copy-paste isi file `setup_storage_buckets.sql`
4. Klik **Run**
5. Should see 2 rows returned (backgrounds & gallery)

## Solution - Method 2: Storage UI (Alternative)

Jika SQL error "must be owner", pakai Storage UI:

### Steps:
1. Buka Supabase Dashboard → **Storage**
2. Klik **New Bucket**
3. Buat bucket pertama:
   - Name: `backgrounds`
   - Public: ✅ Yes
   - File size limit: `5 MB`
   - Allowed MIME types: `image/jpeg, image/png, image/webp, image/gif`
4. Klik **Create Bucket**
5. Ulangi untuk bucket kedua:
   - Name: `gallery`
   - Public: ✅ Yes
   - File size limit: `10 MB`
   - Allowed MIME types: `image/jpeg, image/png, image/webp, image/gif`

### Set Policies (in Storage UI):
1. Click bucket name (backgrounds)
2. Go to **Policies** tab
3. Click **New Policy**
4. Create 3 policies:
   - **INSERT**: Allow authenticated users
   - **SELECT**: Allow public
   - **DELETE**: Allow authenticated users
5. Repeat for `gallery` bucket

## After Setup:

### Test Upload:
1. Refresh halaman `/admin/settings`
2. Upload background image
3. Lihat indikator:
   - 📤 Mengupload gambar... (saat upload)
   - ✅ Gambar berhasil diupload! (sukses)
   - ❌ Upload gagal: ... (error)

## Features Added:
- 🎨 Upload progress indicator with animation
- ✅ Success message after upload
- 📁 Proper bucket structure
- 🔒 Secure upload (authenticated only)
- 🌐 Public read access for images
