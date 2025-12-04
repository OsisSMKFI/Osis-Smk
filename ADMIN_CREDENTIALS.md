# 🔐 DEFAULT ADMIN ACCOUNTS

## Setup Instructions

1. **Run SQL Migration di Supabase SQL Editor:**
   ```bash
   # Copy & paste isi file ini ke Supabase SQL Editor
   supabase-super-admin-seed.sql
   ```

2. **Verify Accounts:**
   - Query akan otomatis menampilkan list users yang tercipta
   - Check di Supabase Dashboard → Table Editor → users

3. **Login & Test:**
   - Go to `http://localhost:3000/admin/login`
   - Gunakan credentials di bawah

---

## 🎯 Test Accounts

### 1️⃣ SUPER ADMIN (Full Access)
```
Email:    admin@osis.sch.id
Password: SuperAdmin123!
Role:     super_admin
```

**Permissions:**
- ✅ Content Management (edit all website text/images)
- ✅ Posts CRUD (create, edit, delete)
- ✅ Data Management (Sekbid, Members)
- ✅ User Management (approve, edit, delete users)
- ✅ Events Management
- ✅ Gallery Management
- ✅ All Settings

---

### 2️⃣ ADMIN (Management Access)
```
Email:    admin2@osis.sch.id
Password: Admin123!
Role:     admin
```

**Permissions:**
- ✅ Content Management
- ✅ Posts CRUD (create, edit, delete)
- ⚠️ Data Management (view only)
- ✅ User Management (limited)
- ✅ Events Management
- ✅ Gallery Management

---

### 3️⃣ OSIS (Content Creator)
```
Email:    osis@osis.sch.id
Password: Osis123!
Role:     osis
```

**Permissions:**
- ❌ Content Management (no access)
- ✅ Posts Management (create, edit only - cannot delete)
- ❌ Data Management (no access)
- ❌ User Management (no access)
- ⚠️ Events (view only)
- ⚠️ Gallery (view only)

---

### 4️⃣ MODERATOR (Content Moderator)
```
Email:    moderator@osis.sch.id
Password: Moderator123!
Role:     moderator
```

**Permissions:**
- ❌ Content Management (no access)
- ✅ Posts Management (create, edit, moderate)
- ❌ Data Management (no access)
- ⚠️ User Management (view only)
- ✅ Events Management
- ⚠️ Gallery (view only)

---

## 🧪 Testing Workflow

### Test Super Admin Features:
1. **Login** dengan `admin@osis.sch.id`
2. **Content Management:**
   - Go to `/admin/content`
   - Edit homepage title, about text, etc.
   - Save & check changes on public pages
3. **Data Management:**
   - Go to `/admin/data/sekbid`
   - Add new Sekbid (test create)
   - Edit existing Sekbid (test update)
   - Try to delete (test delete with warning)
4. **Members Management:**
   - Go to `/admin/data/members`
   - Add new member
   - Assign to sekbid
   - Upload photo URL
   - Test filter by sekbid
5. **Posts Management:**
   - Go to `/admin/posts/new`
   - Create post with TipTap editor
   - Add featured image
   - Test Draft vs Publish
   - Edit post (test inline editing)
   - Delete post (test admin-only delete)

### Test Role Restrictions:
1. **Login** dengan `osis@osis.sch.id`
2. Try to access `/admin/content` → Should redirect or show "Forbidden"
3. Try to access `/admin/data/sekbid` → Should redirect
4. Go to `/admin/posts` → Should work
5. Create post → Should work
6. Try to delete post → Button should be hidden or disabled

### Test OSIS Workflow:
1. **Login** dengan `osis@osis.sch.id`
2. Go to `/admin/posts/new`
3. Create berita tentang kegiatan OSIS
4. Use TipTap editor untuk format text
5. Add images, links, lists
6. Save as Draft
7. Edit draft
8. Publish
9. Check sidebar menu → "Data Management" should NOT appear

---

## 🔄 Password Change (After First Login)

Untuk production, ganti password default:

1. Go to `/admin/settings` (or profile page)
2. Change password form
3. Update password
4. Re-login dengan password baru

**Atau via Supabase:**
```sql
-- Generate new hash via script:
-- node scripts/generate-admin-hashes.js

-- Update password
UPDATE public.users 
SET password = 'NEW_BCRYPT_HASH_HERE'
WHERE email = 'admin@osis.sch.id';
```

---

## 🗑️ Delete Test Accounts (Optional)

Jika ingin hapus test accounts:

```sql
DELETE FROM public.users 
WHERE email IN (
  'admin2@osis.sch.id',
  'osis@osis.sch.id',
  'moderator@osis.sch.id'
);

-- Keep only Super Admin
-- admin@osis.sch.id will remain
```

---

## ⚠️ Security Notes

1. **Change Default Passwords Immediately** di production
2. **Delete** atau **disable** unused test accounts
3. **Gunakan email yang real** untuk Super Admin di production
4. **Enable 2FA** jika implement (future feature)
5. **Audit logs** untuk track admin actions (future feature)

---

## 📊 Permission Matrix

| Feature | Super Admin | Admin | OSIS | Moderator |
|---------|------------|-------|------|-----------|
| **Content CMS** | ✅ Full | ✅ Full | ❌ None | ❌ None |
| **Posts Create** | ✅ | ✅ | ✅ | ✅ |
| **Posts Edit** | ✅ | ✅ | ✅ | ✅ |
| **Posts Delete** | ✅ | ✅ | ❌ | ✅ |
| **Data Sekbid** | ✅ Full | ❌ View | ❌ None | ❌ None |
| **Data Members** | ✅ Full | ❌ View | ❌ None | ❌ None |
| **User Mgmt** | ✅ Full | ⚠️ Limited | ❌ None | ❌ View |
| **Events** | ✅ Full | ✅ Full | ❌ View | ✅ Full |
| **Gallery** | ✅ Full | ✅ Full | ❌ View | ❌ View |
| **Settings** | ✅ Full | ⚠️ Limited | ❌ None | ❌ None |

---

## 🎉 Quick Start

```bash
# 1. Pastikan Supabase setup sudah done
# 2. Run SQL migrations (semua .sql files)
# 3. Run dev server
npm run dev

# 4. Login as Super Admin
# URL: http://localhost:3000/admin/login
# Email: admin@osis.sch.id
# Password: SuperAdmin123!

# 5. Test all features!
```

---

**✅ Sekarang kamu punya Super Admin account yang langsung bisa dipake!**
