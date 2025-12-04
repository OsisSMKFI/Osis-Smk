# Checklist Testing Lengkap - Webosis Archive

## 🎯 Overview
Dokumen ini berisi checklist lengkap untuk memastikan semua fitur berfungsi dengan baik di production.

---

## 1️⃣ Authentication & Authorization

### Login & Register
- [ ] Register akun baru → Email verification dikirim
- [ ] Klik link verification → Email verified
- [ ] Login dengan email/password → Berhasil masuk
- [ ] Forgot password → Reset link dikirim
- [ ] Reset password dengan link → Password berubah
- [ ] Login dengan password baru → Berhasil

### Role-Based Access
- [ ] User role `siswa` tidak bisa akses `/admin/*`
- [ ] User role `osis` bisa akses semua halaman admin
- [ ] User role `admin` bisa akses semua halaman admin
- [ ] User role `super_admin` bisa akses semua halaman admin + terminal
- [ ] Middleware redirect non-admin ke `/admin/login`
- [ ] Unauthorized user mendapat 401/403 dari API

### Session Management
- [ ] Session tetap aktif setelah refresh browser
- [ ] JWT refresh otomatis sebelum expire
- [ ] Role update di DB langsung terdeteksi (tidak perlu re-login)
- [ ] Logout berhasil dan redirect ke domain publik (bukan localhost)

---

## 2️⃣ Dashboard & Profile

### User Dashboard (`/dashboard`)
- [ ] Menampilkan nama user
- [ ] Menampilkan email
- [ ] Menampilkan role badge
- [ ] Menampilkan foto profil (jika ada)
- [ ] Instagram username dengan prefix `@` (jika ada)
- [ ] Kelas tampil dengan benar
- [ ] NISN tampil (tidak ada text korup)
- [ ] NIK tampil (jika ada)

### Edit Profile (`/dashboard/edit`)
- [ ] Form pre-filled dengan data user
- [ ] Update nama → Berhasil
- [ ] Update nickname → Berhasil
- [ ] Update Instagram → Berhasil (otomatis tambah @)
- [ ] Update kelas → Berhasil
- [ ] Update NISN (10 digit) → Berhasil
- [ ] Upload foto profil → Berhasil
- [ ] Cancel/reset form → Data kembali ke original

---

## 3️⃣ Admin Panel - Data Management

### Users Management (`/admin/users`)
- [ ] Tabel users tampil dengan data lengkap
- [ ] Filter by role berfungsi
- [ ] Search by name/email berfungsi
- [ ] Approve user → Status berubah approved
- [ ] Reject user → Status rejected dengan reason
- [ ] Edit role user → Role berubah di DB
- [ ] Delete user → User terhapus
- [ ] Real-time update (insert/update/delete auto refresh)

### Sekbid Management (`/admin/data/sekbid`)
- [ ] Tabel sekbid tampil
- [ ] Create sekbid baru → Berhasil
- [ ] Edit sekbid → Berhasil
- [ ] Delete sekbid → Berhasil
- [ ] Real-time sync berfungsi

### Members Management (`/admin/data/members`)
- [ ] Tabel members tampil dengan kelas
- [ ] Filter by sekbid berfungsi
- [ ] Create member baru → Berhasil
- [ ] Edit member (nama, kelas, sekbid) → Berhasil
- [ ] Delete member → Berhasil
- [ ] Instagram username dengan prefix `@`

---

## 4️⃣ Admin Panel - Content Management

### Posts (`/admin/posts`)
- [ ] List posts tampil
- [ ] Create post baru → Berhasil
- [ ] Edit post (title, content) → Berhasil
- [ ] Upload featured image → Berhasil
- [ ] Set published/draft status → Berhasil
- [ ] Delete post → Berhasil
- [ ] Preview post → Tampil dengan benar

### Events (`/admin/events`)
- [ ] List events tampil
- [ ] Create event dengan tanggal → Berhasil
- [ ] Upload event banner → Berhasil
- [ ] Edit event → Berhasil
- [ ] Delete event → Berhasil
- [ ] Event dengan tanggal lewat ditandai

### Gallery (`/admin/gallery`)
- [ ] Upload gambar → Berhasil
- [ ] Upload video → Berhasil
- [ ] Thumbnail generate otomatis
- [ ] Edit caption/description → Berhasil
- [ ] Delete media → Berhasil dari storage dan DB
- [ ] Gallery grid tampil dengan benar

### Announcements (`/admin/announcements`)
- [ ] Create pengumuman → Berhasil
- [ ] Set priority (high/medium/low) → Badge tampil benar
- [ ] Set expires_at → Auto hide setelah expire
- [ ] Edit pengumuman → Berhasil
- [ ] Delete pengumuman → Berhasil

### Polls (`/admin/polls`)
- [ ] Create poll dengan min 2 options → Berhasil
- [ ] Edit poll question/options → Berhasil
- [ ] Set expires_at → Auto close setelah expire
- [ ] Delete poll → Berhasil
- [ ] Vote on poll (user side) → Count bertambah

### Program Kerja (`/admin/proker`)
- [ ] Create proker → Berhasil
- [ ] Link proker ke sekbid → Berhasil
- [ ] Set tanggal mulai/selesai → Berhasil
- [ ] Edit proker → Berhasil
- [ ] Delete proker → Berhasil

---

## 5️⃣ Admin Panel - System

### Settings (`/admin/settings`)
- [ ] Theme template list tampil
- [ ] Apply theme → Warna berubah
- [ ] Upload background image → Preview tampil
- [ ] Set background opacity → Opacity berubah
- [ ] Toggle AI features → Status berubah
- [ ] Save settings → Berhasil tersimpan
- [ ] Reset to defaults → Berhasil

### Terminal (`/admin/terminal`)
- [ ] Hanya super_admin bisa akses
- [ ] Whitelist commands tampil
- [ ] Run allowed command → Output tampil
- [ ] Run disallowed command → Blocked
- [ ] Command history tersimpan

---

## 6️⃣ Comments System

### Display
- [ ] Comment tampil di post/event
- [ ] Author name tampil
- [ ] Nickname (`@username`) tampil di bawah name
- [ ] Role badge tampil (admin/osis/siswa)
- [ ] Instagram badge tampil (jika ada)
- [ ] Kelas badge tampil (jika ada)
- [ ] Foto profil author tampil

### Actions
- [ ] Post comment baru → Berhasil
- [ ] Edit own comment → Berhasil
- [ ] Delete own comment → Berhasil
- [ ] Admin delete any comment → Berhasil
- [ ] Reply to comment → Threaded display
- [ ] Real-time comment update → Auto refresh

---

## 7️⃣ File Upload & Storage

### Image Upload
- [ ] Upload di profile → Berhasil
- [ ] Upload di posts → Berhasil
- [ ] Upload di events → Berhasil
- [ ] Upload di gallery → Berhasil
- [ ] Upload background → Berhasil
- [ ] Resize/compress otomatis → File size berkurang
- [ ] URL public accessible

### Video Upload
- [ ] Upload di gallery → Berhasil
- [ ] Thumbnail auto-generate → Berhasil
- [ ] Video playable → Berhasil
- [ ] Large file (>50MB) → Progress bar tampil

### Storage Security
- [ ] Public files accessible tanpa auth
- [ ] Private files require auth
- [ ] RLS policies enforce access control
- [ ] Delete cascade (file + DB entry)

---

## 8️⃣ Real-time Features

### Supabase Realtime
- [ ] New user register → Admin panel auto update
- [ ] Role change → User session auto update
- [ ] New post → Feed auto update
- [ ] New comment → Comment list auto update
- [ ] Delete item → List auto update
- [ ] Multiple tabs sync → Consistent state

---

## 9️⃣ Performance & SEO

### Page Load
- [ ] Homepage load < 3s
- [ ] Admin panel load < 2s
- [ ] Dashboard load < 2s
- [ ] Image lazy loading berfungsi
- [ ] Code splitting berfungsi (Next.js)

### SEO
- [ ] Meta tags tampil di semua page
- [ ] OG image untuk sharing
- [ ] Sitemap.xml accessible
- [ ] Robots.txt configured

---

## 🔟 Security

### Input Validation
- [ ] XSS prevention → HTML escaped
- [ ] SQL injection prevention → Parameterized queries
- [ ] CSRF protection → Token validation
- [ ] File upload validation → Type/size checked

### Authentication
- [ ] Password min 8 char enforced
- [ ] Password hashed (bcrypt)
- [ ] JWT signed dan encrypted
- [ ] Session timeout berfungsi

### Authorization
- [ ] Middleware check di setiap admin route
- [ ] API RBAC check di setiap endpoint
- [ ] RLS policies di Supabase
- [ ] Service role key hanya di server

---

## 1️⃣1️⃣ Error Handling

### User Feedback
- [ ] Success message tampil (toast/alert)
- [ ] Error message tampil dengan jelas
- [ ] Loading state tampil (spinner/skeleton)
- [ ] Form validation error tampil per field

### Logging
- [ ] Error logs saved to `error_logs` table
- [ ] Console.log di development
- [ ] Vercel logs di production
- [ ] Supabase logs accessible

---

## 1️⃣2️⃣ Mobile Responsiveness

### Layout
- [ ] Mobile menu berfungsi
- [ ] Responsive grid (posts/gallery)
- [ ] Form usable di mobile
- [ ] Table scrollable horizontal

### Touch Gestures
- [ ] Swipe navigation (jika ada)
- [ ] Tap to enlarge image
- [ ] Pull to refresh (jika ada)

---

## 1️⃣3️⃣ Browser Compatibility

### Desktop
- [ ] Chrome (latest) ✅
- [ ] Firefox (latest) ✅
- [ ] Safari (latest) ✅
- [ ] Edge (latest) ✅

### Mobile
- [ ] Chrome Mobile ✅
- [ ] Safari iOS ✅
- [ ] Samsung Internet ✅

---

## 🚀 Production Deployment

### Vercel
- [ ] Environment variables set
- [ ] `NEXTAUTH_URL` = production domain
- [ ] `AUTH_TRUST_HOST=true`
- [ ] Build successful
- [ ] No build warnings
- [ ] Functions deploy successful

### Domain & SSL
- [ ] Custom domain configured
- [ ] DNS propagated
- [ ] SSL certificate active (HTTPS)
- [ ] Redirect HTTP → HTTPS

### Post-Deploy
- [ ] Test semua checklist di atas di production
- [ ] Monitor Vercel logs untuk error
- [ ] Check Supabase usage/quota
- [ ] Backup database

---

## 📝 Notes

### Known Issues
- [ ] NISN data korup → Run `cleanup_nisn_data.sql`
- [ ] Logout redirect localhost → Update `NEXTAUTH_URL` di Vercel

### Future Enhancements
- [ ] Push notifications
- [ ] Email notifications
- [ ] Advanced search
- [ ] Export data to Excel
- [ ] Activity logs

---

**Status**: ✅ Ready for Production Testing
**Last Updated**: 27 November 2025
**Next Review**: Setelah user testing phase 1
