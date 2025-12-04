# 🚀 Quick Start - API Auto-Sync

## ⚡ TL;DR - Super Cepat!

Untuk enable auto-sync dari Instagram & YouTube:

### 1. Copy .env.example ke .env.local

```bash
cp .env.example .env.local
```

### 2. Isi API Keys

Edit `.env.local`:

```env
# Instagram (https://developers.facebook.com/apps/)
NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN=your_token_here
NEXT_PUBLIC_INSTAGRAM_USER_ID=your_user_id_here

# YouTube (https://console.cloud.google.com/)
NEXT_PUBLIC_YOUTUBE_API_KEY=your_api_key_here
NEXT_PUBLIC_YOUTUBE_CHANNEL_ID=your_channel_id_here

# Spotify (https://developer.spotify.com/dashboard/)
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_client_id_here
NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

### 3. Restart Server

```bash
npm run dev
```

### 4. Done! ✅

Website sekarang auto-fetch data dari API setiap 30 menit!

---

## 📚 Full Documentation

Untuk detailed setup guide, baca: **`SETUP_API_KEYS.md`**

---

## 🎯 Benefits

✅ **Auto-Sync** - Data otomatis update dari akun real
✅ **Real-Time** - Always show latest posts/videos
✅ **No Manual Work** - Tidak perlu update code tiap ada post baru
✅ **Fallback Safe** - Jika API down, pakai data fallback
✅ **Performance** - Data di-cache untuk fast loading

---

## 🔧 Configuration

### Refresh Interval

Default: 30 menit. Untuk ubah:

```env
# Refresh every 15 minutes
NEXT_PUBLIC_REFRESH_INTERVAL=15

# Refresh every 1 hour
NEXT_PUBLIC_REFRESH_INTERVAL=60
```

### Disable API (Use Static Data)

Kosongkan atau hapus env variables:

```env
# Leave blank = use fallback data
NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN=
NEXT_PUBLIC_YOUTUBE_API_KEY=
```

---

## 🧪 Testing

### Check if API Working:

1. Open browser console (F12)
2. Refresh page
3. Look for logs:
   - ✅ "Instagram posts fetched: 12"
   - ✅ "YouTube videos fetched: 8"
   - ❌ "Instagram API credentials not configured" = API not setup yet

### Verify Data Source:

- **From API**: Post captions/titles akan sesuai real akun
- **From Fallback**: Akan tampil dummy data dari `lib/socialMediaData.ts`

---

## 💡 Tips

### Instagram Access Token Expires Every 60 Days

Buat reminder untuk refresh token! Atau pakai automation:

```bash
# Buat cron job untuk auto-refresh token
# Follow: SETUP_API_KEYS.md > Instagram > Long-Lived Token
```

### YouTube API Quota

- Free: 10,000 units/day
- Website usage: ~20-50 units/day
- Lebih dari cukup! No worries 👍

### Spotify adalah Optional

Jika tidak pakai Spotify, biarkan kosong. Website akan pakai fallback data untuk Spotify section.

---

## 📊 What Gets Auto-Synced?

| Platform | Auto-Sync | Fallback |
|----------|-----------|----------|
| Instagram Posts | ✅ Yes | ✅ Yes |
| YouTube Videos | ✅ Yes | ✅ Yes |
| Spotify Podcast/Playlist | ⚠️ Manual IDs needed | ✅ Yes |
| TikTok Videos | ❌ Complex API | ✅ Yes |
| Stats & Analytics | 🔜 Coming Soon | ✅ Yes |

---

## 🎉 All Set!

Website sekarang bisa auto-sync dengan social media accounts!

**Next:** Deploy ke production dengan environment variables di hosting platform (Vercel, Netlify, etc.)
