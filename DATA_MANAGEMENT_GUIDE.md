# 🎯 DATA MANAGEMENT SYSTEM - SUPER ADMIN

## Overview

Super Admin sekarang bisa **manage SEMUA data dinamis** di website:
- ✅ **Sekbid Management** - Tambah, edit, hapus seksi bidang
- ✅ **Members Management** - Kelola anggota OSIS & Sekbid
- ✅ Ubah nama, foto, jabatan, quotes
- ✅ Atur urutan tampilan
- ✅ Aktifkan/nonaktifkan tanpa hapus data

---

## 🗄️ Database Schema

### Table: `sekbid`
```sql
- id (serial primary key)
- nama (text) - Nama sekbid
- deskripsi (text) - Deskripsi sekbid
- icon (text) - Emoji icon (🕌, ⭐, 🏆, dll)
- color (text) - Hex color (#F59E0B)
- order_index (int) - Urutan tampilan
- active (boolean) - Status aktif/nonaktif
- created_at, updated_at
```

### Table: `members`
```sql
- id (serial primary key)
- nama (text) - Nama lengkap
- jabatan (text) - Ketua OSIS, Wakil, Sekretaris, dll
- sekbid_id (int) - Foreign key ke sekbid (nullable)
- foto_url (text) - URL foto member
- instagram (text) - Username Instagram
- email (text) - Email member
- quotes (text) - Motto/quotes
- order_index (int) - Urutan tampilan
- active (boolean) - Status aktif/nonaktif
- created_at, updated_at
```

**Seed Data:**
- 6 Sekbid default (Keimanan, Budi Pekerti, Prestasi, Keterampilan, Kesehatan, Organisasi)
- 4 sample members (Ketua, Wakil, Sekretaris, Bendahara)

---

## 🔌 API Endpoints

### Sekbid APIs

#### GET `/api/admin/sekbid`
- **Params:** `?include_inactive=true` (optional)
- **Response:** Array of sekbid objects
- **Auth:** Any authenticated user

#### POST `/api/admin/sekbid`
- **Body:** `{ nama, deskripsi?, icon?, color?, order_index?, active? }`
- **Permission:** Super Admin only
- **Response:** Created sekbid object

#### GET `/api/admin/sekbid/[id]`
- **Response:** Single sekbid object
- **Auth:** Any authenticated user

#### PUT `/api/admin/sekbid/[id]`
- **Body:** Partial sekbid fields to update
- **Permission:** Super Admin only
- **Response:** Updated sekbid object

#### DELETE `/api/admin/sekbid/[id]`
- **Permission:** Super Admin only
- **Warning:** Akan cascade delete relasi members
- **Response:** `{ success: true }`

---

### Members APIs

#### GET `/api/admin/members`
- **Params:** 
  - `?sekbid_id=1` - Filter by sekbid
  - `?include_inactive=true` - Include nonaktif members
- **Response:** Array of member objects (with sekbid relation)
- **Auth:** Any authenticated user

#### POST `/api/admin/members`
- **Body:** `{ nama, jabatan, sekbid_id?, foto_url?, instagram?, email?, quotes?, order_index?, active? }`
- **Permission:** Super Admin only
- **Response:** Created member object

#### GET `/api/admin/members/[id]`
- **Response:** Single member object with sekbid
- **Auth:** Any authenticated user

#### PUT `/api/admin/members/[id]`
- **Body:** Partial member fields to update
- **Permission:** Super Admin only
- **Response:** Updated member object

#### DELETE `/api/admin/members/[id]`
- **Permission:** Super Admin only
- **Response:** `{ success: true }`

---

## 🎨 Admin UI Pages

### `/admin/data/sekbid`
**Features:**
- ✅ List all sekbid dengan card view
- ✅ Icon emoji + color preview
- ✅ Inline editing (click Edit → form → Save/Cancel)
- ✅ Create new sekbid dengan form modal
- ✅ Delete sekbid dengan konfirmasi
- ✅ Active/inactive toggle
- ✅ Order management

**UI Components:**
- Header dengan "Tambah Sekbid" button
- Cards dengan icon, nama, deskripsi, color preview
- Edit mode dengan form fields
- Delete button dengan warning

---

### `/admin/data/members`
**Features:**
- ✅ Grid view dengan member cards
- ✅ Photo preview (fallback to emoji)
- ✅ Filter by Sekbid dropdown
- ✅ Inline editing dengan full form
- ✅ Create new member
- ✅ Delete member dengan konfirmasi
- ✅ Instagram & email links
- ✅ Quotes display

**Form Fields:**
- Nama Lengkap (required)
- Jabatan (dropdown: Ketua OSIS, Wakil, Sekretaris, dll)
- Sekbid (dropdown or "Pengurus Inti")
- Foto URL
- Instagram username
- Email
- Quotes/Motto
- Order index
- Active checkbox

**UI Components:**
- Grid layout (3 columns on large screens)
- Member cards dengan photo header
- Gradient background untuk photo placeholder
- Instagram & email icons
- Edit/Delete action buttons

---

## 🔐 Permission Matrix

| Action | Super Admin | Admin | OSIS | Moderator |
|--------|------------|-------|------|-----------|
| **Sekbid**
| View | ✅ | ✅ | ✅ | ✅ |
| Create | ✅ | ❌ | ❌ | ❌ |
| Edit | ✅ | ❌ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ | ❌ |
| **Members**
| View | ✅ | ✅ | ✅ | ✅ |
| Create | ✅ | ❌ | ❌ | ❌ |
| Edit | ✅ | ❌ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ | ❌ |

**Note:** Hanya Super Admin yang bisa manage struktur organisasi

---

## 📁 Files Created

### Database
1. **`supabase-data-management.sql`** (80 lines)
   - Table definitions
   - RLS policies
   - Seed data
   - Triggers for updated_at

### APIs
2. **`app/api/admin/sekbid/route.ts`** (80 lines)
   - GET list sekbid
   - POST create sekbid
   
3. **`app/api/admin/sekbid/[id]/route.ts`** (110 lines)
   - GET single sekbid
   - PUT update sekbid
   - DELETE sekbid

4. **`app/api/admin/members/route.ts`** (90 lines)
   - GET list members (dengan filter)
   - POST create member

5. **`app/api/admin/members/[id]/route.ts`** (120 lines)
   - GET single member
   - PUT update member
   - DELETE member

### UI Pages
6. **`app/admin/data/sekbid/page.tsx`** (420 lines)
   - Sekbid management UI
   - Create/Edit/Delete forms
   - Card view dengan icons
   
7. **`app/admin/data/members/page.tsx`** (540 lines)
   - Members management UI
   - Grid layout dengan photos
   - Filter by sekbid
   - Full CRUD forms

### Components
8. **`components/admin/AdminSidebar.tsx`** (MODIFIED)
   - Added "Data Management" section
   - New menu items: Sekbid, Members
   - Icons: FaDatabase, FaSitemap, FaUserFriends

---

## 🚀 Usage Guide

### Setup Database
```bash
# Run SQL migration in Supabase SQL Editor
supabase-data-management.sql
```

### Access UI
1. Login sebagai Super Admin
2. Sidebar → **Data Management** section
3. Click **Sekbid** untuk manage seksi bidang
4. Click **Members** untuk manage anggota

### Create Sekbid
1. Go to `/admin/data/sekbid`
2. Click "Tambah Sekbid"
3. Fill form:
   - Nama Sekbid (required)
   - Icon emoji (🕌, ⭐, etc.)
   - Warna hex (#F59E0B)
   - Deskripsi
   - Urutan
4. Click "Simpan"

### Add Member
1. Go to `/admin/data/members`
2. Click "Tambah Member"
3. Fill form:
   - Nama Lengkap (required)
   - Jabatan (dropdown)
   - Sekbid (dropdown or Pengurus Inti)
   - Foto URL
   - Instagram, Email
   - Quotes
   - Urutan
4. Click "Simpan"

### Edit/Delete
- Click **Edit** button → Form muncul → Edit → Save
- Click **Hapus** → Konfirmasi → Deleted

---

## ✨ Key Features

1. **Dynamic Structure**
   - Tambah/hapus sekbid kapan saja
   - Struktur organisasi fleksibel
   - Tidak hardcoded

2. **Full CRUD**
   - Create, Read, Update, Delete
   - Inline editing
   - Instant updates

3. **Soft Delete**
   - Active/inactive toggle
   - Data tidak hilang permanent
   - Bisa reaktivasi

4. **Order Management**
   - Atur urutan tampilan
   - Number input untuk order_index
   - Flexibility tinggi

5. **Rich Data**
   - Photo URLs
   - Social media links
   - Quotes/Motto
   - Color customization
   - Icon emojis

6. **Responsive UI**
   - Grid layout
   - Card design
   - Mobile friendly
   - Beautiful forms

7. **Super Admin Only**
   - Permission guard di API
   - Forbidden 403 untuk non-super-admin
   - Secure & safe

---

## 🎯 Next Steps

### Integrate dengan Frontend Public Pages
- [ ] `/people` page - Ambil data dari `members` table
- [ ] `/sekbid` page - Ambil data dari `sekbid` table
- [ ] Replace hardcoded data dengan dynamic fetch

### Media Upload
- [ ] Implement Supabase Storage
- [ ] Upload foto member langsung
- [ ] Auto-generate URL

### Advanced Features
- [ ] Drag & drop untuk reorder
- [ ] Bulk import/export CSV
- [ ] Photo crop/resize
- [ ] Member statistics

---

## 🐛 Error Handling

All APIs include try-catch with:
- ✅ Console error logging
- ✅ User-friendly error messages
- ✅ HTTP status codes (401, 403, 404, 500)
- ✅ Validation checks

---

## 🎨 UI Screenshots

### Sekbid Page
```
┌─────────────────────────────────────────┐
│  Manage Sekbid      [+ Tambah Sekbid]  │
├─────────────────────────────────────────┤
│  🕌  Sekbid Keimanan                    │
│      Membina keimanan siswa             │
│      Urutan: 1  Color: #10B981          │
│      [Edit] [Hapus]                     │
├─────────────────────────────────────────┤
│  ⭐  Sekbid Budi Pekerti                │
│      ...                                │
└─────────────────────────────────────────┘
```

### Members Page
```
┌───────────┬───────────┬───────────┐
│ [Photo]   │ [Photo]   │ [Photo]   │
│ Ahmad     │ Siti      │ Budi      │
│ Ketua     │ Wakil     │ Sekretaris│
│ @ahmad    │ @siti     │ @budi     │
│ "Quote"   │ "Quote"   │ "Quote"   │
│ [Edit][X] │ [Edit][X] │ [Edit][X] │
└───────────┴───────────┴───────────┘
```

---

## ✅ Checklist

- [x] Database schema created
- [x] RLS policies configured
- [x] Seed data inserted
- [x] Sekbid CRUD APIs
- [x] Members CRUD APIs
- [x] Permission checks (super_admin only)
- [x] Sekbid management UI
- [x] Members management UI
- [x] Sidebar menu integration
- [x] Error handling
- [x] TypeScript typing
- [x] Responsive design
- [x] Dark mode support

---

**🎉 SEKARANG SUPER ADMIN BISA KONTROL SEMUA DATA STRUKTUR OSIS!**
