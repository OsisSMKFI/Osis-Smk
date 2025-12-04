# 🚀 QUICK START - Activity Tracking System

## For Users (Siswa & Guru)

### 1. Lihat Aktivitas Anda

1. **Login** ke website OSIS
2. **Dashboard** → Klik kartu **"Aktivitas"**
3. **Lihat timeline** aktivitas Anda

### 2. Apa yang Bisa Dilihat?

📊 **Statistik Aktivitas:**
- Total semua aktivitas
- Jumlah absensi (masuk + pulang)
- Interaksi post (like, comment, share)
- Pesan AI chat

📅 **Timeline Aktivitas:**
- **Hari Ini** - Aktivitas hari ini
- **Kemarin** - Aktivitas kemarin
- **Tanggal Lengkap** - Aktivitas sebelumnya

### 3. Filter Aktivitas

Klik tombol **"Filter"** untuk filter by:
- ✅ Semua Aktivitas
- 🔐 Login/Logout
- ✅ Absensi
- 📝 Post & Interaksi
- 🗳️ Polling
- 🤖 AI Chat
- 👤 Profil & Keamanan
- 📅 Event
- 🖼️ Galeri

### 4. Detail Aktivitas

Setiap aktivitas menampilkan:
- 🎯 **Icon & Tipe** (Login, Absen, Like, dll)
- 📝 **Deskripsi** aktivitas
- ⏰ **Waktu** (baru saja, 5 menit lalu, jam lalu)
- 🌐 **IP Address** (untuk keamanan)
- 📍 **Lokasi** (jika ada)

### 5. Muat Lebih Banyak

Scroll ke bawah → Klik **"Muat Lebih Banyak"** untuk lihat aktivitas lama.

---

## For Admin

### 1. Setup Database (First Time Only)

**Run di Supabase SQL Editor:**

```sql
-- Copy semua isi file create_activity_logs_table.sql
-- Paste & Execute di Supabase SQL Editor
```

✅ **Verifikasi:**
```sql
SELECT COUNT(*) FROM activity_logs;
-- Should work without error
```

### 2. View User Activities (Coming Soon)

**Route:** `/admin/users/[userId]/activity`

Features:
- View complete user timeline
- Filter by date range, type, status
- Export to CSV
- Flag suspicious activities

### 3. Monitor System

**Check activity stats:**
```sql
-- Total activities
SELECT COUNT(*) FROM activity_logs;

-- Activities by type
SELECT activity_type, COUNT(*) as count 
FROM activity_logs 
GROUP BY activity_type 
ORDER BY count DESC;

-- Recent activities
SELECT * FROM activity_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- User with most activities
SELECT user_email, COUNT(*) as count 
FROM activity_logs 
GROUP BY user_email 
ORDER BY count DESC 
LIMIT 10;
```

### 4. Security Checks

**Check for suspicious patterns:**
```sql
-- Multiple devices per user
SELECT user_id, user_email, 
       COUNT(DISTINCT device_info->>'device_type') as device_count
FROM activity_logs
GROUP BY user_id, user_email
HAVING COUNT(DISTINCT device_info->>'device_type') > 2;

-- Logins from different IPs
SELECT user_id, user_email,
       COUNT(DISTINCT ip_address) as ip_count
FROM activity_logs
WHERE activity_type = 'login'
AND created_at > NOW() - INTERVAL '7 days'
GROUP BY user_id, user_email
HAVING COUNT(DISTINCT ip_address) > 3;

-- Failed activities
SELECT * FROM activity_logs
WHERE status IN ('failure', 'error')
ORDER BY created_at DESC
LIMIT 20;
```

---

## Automatic Activity Logging

### Already Implemented ✅

**1. Login**
- Automatically logged when user logs in
- Metadata: role, approved, email_verified

**2. Attendance Check-in**
- Logged when user checks in
- Metadata: location, WiFi SSID, accuracy
- Related to: attendance table

**3. Attendance Check-out**
- Logged when user checks out
- Metadata: location, WiFi SSID
- Related to: attendance table

### Coming Soon ⏸️

**4. Post Interactions**
- Like, Unlike, Comment, Share
- When post feature is built

**5. Poll Voting**
- Vote, Create poll
- When poll feature is built

**6. AI Chat**
- Messages, Session start/end
- When AI chat feature is built

---

## Troubleshooting

### "No activities showing"

**Check:**
1. Database migration ran? → Run `create_activity_logs_table.sql`
2. User logged in? → Check session
3. Activities exist? → Login/logout to create one

**Query:**
```sql
SELECT * FROM activity_logs WHERE user_id = 'YOUR_USER_ID';
```

### "Permission denied"

**Check:**
1. RLS enabled? → Should be enabled by migration
2. User viewing own activities? → Yes
3. Or user is admin? → Check role

**Fix:**
```sql
-- Re-run RLS policies from create_activity_logs_table.sql
```

### "Slow loading"

**Check:**
1. Too many activities? → Use filters
2. Indexes missing? → Re-run migration
3. Date range too wide? → Filter by recent dates

**Optimize:**
- Use pagination (default: 50 per page)
- Filter by type or date
- Archive old activities (>1 year)

---

## Testing

### Test Case 1: Login Activity

1. Logout dari website
2. Login kembali
3. Pergi ke `/activity`
4. **Expected:** Muncul aktivitas "Login" baru di "Hari Ini"

### Test Case 2: Attendance Activity

1. Pergi ke `/attendance`
2. Lakukan absen masuk
3. Kembali ke `/activity`
4. **Expected:** Muncul aktivitas "Absen Masuk"

### Test Case 3: Filters

1. Pergi ke `/activity`
2. Klik "Filter"
3. Pilih "Absensi"
4. **Expected:** Hanya tampil aktivitas absensi

### Test Case 4: Pagination

1. Pergi ke `/activity`
2. Scroll ke bawah
3. Klik "Muat Lebih Banyak"
4. **Expected:** Load 50 aktivitas berikutnya

---

## Need Help?

1. **Check documentation:** `ACTIVITY_TRACKING_SYSTEM.md`
2. **Check database:** Run SQL queries above
3. **Check server logs:** Look for "[Activity" messages
4. **Check RLS policies:** In Supabase dashboard

---

**END - QUICK START GUIDE**
