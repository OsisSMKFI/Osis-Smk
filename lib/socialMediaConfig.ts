/**
 * Social Media Configuration
 * 
 * YouTube: AUTO-SYNC via YouTube Data API v3 ✅
 * Instagram: Manual update (API requires Business Account)
 * 
 * Last Updated: December 19, 2025
 */

export const SOCIAL_MEDIA_CONFIG = {
  instagram: {
    username: '@osissmkinformatika_fi',
    url: 'https://www.instagram.com/osissmkinformatika_fi',
    followers: 541, // Auto-synced from Instagram API ✅
    targetFollowers: 1000,
    isActive: true,
    // Note: Instagram API requires Business Account + FB Page
    // Update followers secara manual di sini atau via admin panel
  },
  
  youtube: {
    channelId: 'UCjX4FhTSwd6Y7WUPZwecSeg', // Channel ID untuk API
    channelName: 'OSIS SMK Informatika Fithrah Insani',
    customUrl: '@osissmkinformatikafithrahi6947',
    url: 'https://www.youtube.com/channel/UCjX4FhTSwd6Y7WUPZwecSeg',
    subscribers: 0, // AUTO-SYNC via API - nilai ini akan di-override
    targetSubscribers: 500,
    isActive: true,
    autoSync: true, // Enable auto-sync from YouTube API
  },
  
  tiktok: {
    username: '', // Belum ada akun TikTok
    url: '',
    followers: 0,
    targetFollowers: 1000,
    isActive: false, // Tidak aktif - tidak akan ditampilkan
  },
  
  spotify: {
    username: '', // Belum ada akun Spotify
    url: '',
    followers: 0,
    targetFollowers: 500,
    isActive: false, // Tidak aktif - tidak akan ditampilkan
  },
};

/**
 * Update Instructions:
 * 
 * 1. YouTube (AUTO-SYNC ✅):
 *    - Data subscribers otomatis diambil dari YouTube API
 *    - Refresh setiap 30 menit
 *    - Tidak perlu update manual!
 * 
 * 2. Instagram (MANUAL):
 *    - Cek followers di https://www.instagram.com/osissmkinformatika_fi
 *    - Update nilai `followers` di atas
 *    - Atau gunakan admin panel untuk update
 * 
 * 3. TikTok & Spotify:
 *    - Tambahkan username dan URL saat akun sudah dibuat
 *    - Update followers/subscribers manual
 *    - Set `isActive: true` saat sudah aktif
 */
