# ✅ Profile Update & Photo Upload - FIXED

## 🎯 Problem Solved
User tidak bisa memperbarui foto profil dan data lainnya karena:
- 500 Internal Server Error pada `/api/admin/users/:id`
- Permission issues untuk update profil sendiri
- Foto upload gagal tersimpan

## 🔧 Solution Implemented

### 1. Created Dedicated `/api/profile` Endpoint
**File:** `app/api/profile/route.ts`

```typescript
GET  /api/profile     - Load current user's profile
PUT  /api/profile     - Update current user's profile
```

**Features:**
- ✅ No admin permissions required (uses session user ID)
- ✅ Supports all profile fields: name, username, nisn, unit, kelas, photo, password
- ✅ Automatic password hashing with bcrypt
- ✅ Returns standardized response format
- ✅ Proper error handling and logging

**Supported Updates:**
```javascript
{
  name: string,
  username: string (nickname),
  nisn: string,
  unit: string (unit_sekolah),
  kelas: string,
  profile_image: string (URL from upload),
  password: string (plain text, auto-hashed)
}
```

### 2. Updated Admin Profile Page
**File:** `app/admin/profile/page.tsx`

**Changes:**
- ✅ Load profile: `GET /api/profile` (was `/api/admin/users/:id`)
- ✅ Update profile: `PUT /api/profile` with all fields
- ✅ Change password: `PUT /api/profile` with password field
- ✅ Photo upload flow intact (ImageCropperModal → `/api/upload` → save URL)

**Before:**
```typescript
fetch(`/api/admin/users/${session?.user?.id}`) // ❌ 500 error
```

**After:**
```typescript
fetch('/api/profile') // ✅ Works for own profile
```

### 3. Updated Dashboard Page
**File:** `app/dashboard/page.tsx`

**Smart Endpoint Selection:**
```typescript
const endpoint = targetUserId && targetUserId !== session?.user?.id 
  ? `/api/admin/users/${idToLoad}`  // Admin viewing another user
  : '/api/profile';                  // User viewing own profile
```

**Benefits:**
- ✅ Own profile: Use `/api/profile` (no permission issues)
- ✅ View other user (admin): Use `/api/admin/users/:id` (requires permissions)
- ✅ No 500 errors for regular users

---

## 📊 Complete Profile Update Flow

### Photo Upload Process:
1. User selects image → `handlePhotoSelect`
2. Image cropped in modal → `handleCropComplete`
3. Upload to `/api/upload` with `folder=profile-photos`
4. Receive `publicUrl` from Supabase Storage
5. Save to profile: `PUT /api/profile` with `profile_image: publicUrl`
6. Update `photo_url` in database
7. Refresh session with new image

### Profile Data Update:
1. User edits name, username, nisn, unit, kelas
2. Click "Simpan Perubahan"
3. `PUT /api/profile` with updated fields
4. Database updates via `supabaseAdmin`
5. Session refreshed with new data
6. Success toast shown

### Password Change:
1. User enters new password (min 8 chars)
2. Confirm password matches
3. `PUT /api/profile` with `password` field
4. Backend hashes with bcrypt (10 rounds)
5. Update `password_hash` in database
6. Success notification

---

## 🛡️ Security & Permissions

### `/api/profile` (NEW)
- ✅ **Authentication:** Required (session must exist)
- ✅ **Authorization:** User can only edit their own profile
- ✅ **No admin check:** Any authenticated user allowed
- ✅ **Fields allowed:** name, username, nisn, unit, kelas, photo_url, password_hash
- ✅ **Automatic:** Uses `session.user.id` (can't edit others)

### `/api/admin/users/:id` (EXISTING)
- ✅ **Authentication:** Required
- ✅ **Authorization:** 
  - Own profile: No permission check (isOwnProfile = true)
  - Other users: Requires `users:read` or `users:edit`
- ✅ **Admin-only fields:** role, is_active (approval)
- ✅ **Use case:** Admin managing other users

### Separation of Concerns:
```
/api/profile         → Self-service profile management
/api/admin/users/:id → Admin user management
```

---

## 🧪 Testing Checklist

### ✅ Photo Upload
- [x] Select image from file picker
- [x] Crop image in modal
- [x] Upload to Supabase Storage
- [x] Save URL to profile
- [x] Photo displays in profile page
- [x] Photo displays in dashboard
- [x] Photo displays in admin users list

### ✅ Profile Update
- [x] Edit name → Save → Success
- [x] Edit username → Save → Success
- [x] Edit NISN → Save → Success
- [x] Edit unit sekolah → Save → Success
- [x] Edit kelas → Save → Success
- [x] Update multiple fields at once → Success
- [x] Session updates with new data

### ✅ Password Change
- [x] Enter new password (8+ chars)
- [x] Confirm password match validation
- [x] Password saved and hashed
- [x] Can login with new password
- [x] Old password no longer works

### ✅ Error Handling
- [x] No 500 errors on profile load
- [x] No 500 errors on profile update
- [x] No 500 errors on photo upload
- [x] Proper error messages shown
- [x] Loading states during operations

---

## 🔄 API Response Format

### Success Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "username": "nickname",
    "nisn": "1234567890",
    "unit": "SMK Fithrah Insani",
    "kelas": "XII RPL",
    "role": "siswa",
    "is_active": true,
    "profile_image": "https://...",
    "created_at": "2024-01-01T00:00:00Z",
    "email_verified": true
  }
}
```

### Error Response:
```json
{
  "error": "Error message",
  "details": "Stack trace or additional info"
}
```

---

## 📝 Database Schema

### Users Table Fields Updated:
```sql
-- Profile fields
name              TEXT
nickname          TEXT    -- username in API
nisn              TEXT
unit_sekolah      TEXT    -- unit in API
kelas             TEXT
photo_url         TEXT    -- profile_image in API
password_hash     TEXT    -- hashed, never returned

-- Metadata (read-only via API)
role              TEXT
approved          BOOLEAN -- is_active in API
email_verified    BOOLEAN
created_at        TIMESTAMP
```

---

## 🚀 Deployment Status

- ✅ `/api/profile` endpoint created
- ✅ Admin profile page updated
- ✅ Dashboard page updated
- ✅ Build passes successfully
- ✅ Committed and pushed (96a0308)
- ✅ Ready for production

---

## 📖 Usage Guide

### For Users:
1. Go to **Profile** page (`/admin/profile`)
2. Click camera icon to upload new photo
3. Crop and save photo
4. Edit other fields (name, username, etc.)
5. Click "Simpan Perubahan"
6. Success notification appears

### For Admins:
- Can still manage users via `/admin/users`
- Can edit any user's role, approval status, etc.
- "View Dashboard" button opens user's dashboard
- Admin edits use `/api/admin/users/:id`
- Own profile edits use `/api/profile`

---

## ✅ Status: COMPLETE

**Profile updates sekarang berfungsi sempurna!**

All operations work:
- ✅ Photo upload & crop
- ✅ Profile data update
- ✅ Password change
- ✅ No more 500 errors
- ✅ Session auto-updates

**Endpoint baru:** `GET/PUT /api/profile` untuk self-service profile management.
