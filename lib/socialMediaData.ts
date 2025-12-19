// Sample data for social media content previews
// Update these with real data from your actual social media accounts

export interface InstagramPost {
  id: string;
  imageUrl: string;
  caption: string;
  likes: number;
  comments: number;
  date: string;
  isPinned?: boolean;
  url?: string;
}

export interface YouTubeVideo {
  id: string;
  thumbnail: string;
  title: string;
  views: number;
  duration: string;
  uploadDate: string;
  isPinned?: boolean;
  url?: string;
  likes?: number;
  comments?: number;
  description?: string;
}

export interface SpotifyContent {
  id: string;
  title: string;
  type: 'podcast' | 'playlist';
  coverUrl: string;
  description: string;
  episodesOrTracks: number;
  totalDuration?: string;
  isPinned?: boolean;
  url?: string;
}

export interface TikTokVideo {
  id: string;
  thumbnail: string;
  title: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  isPinned?: boolean;
  url?: string;
}

// Instagram Posts - Kosong sampai ada data asli
// TODO: Tambahkan data asli dari Instagram saat tersedia
export const instagramPosts: InstagramPost[] = [];

// YouTube Videos - Kosong, data diambil dari YouTube API (auto-sync)
// Video asli akan ditampilkan dari API, bukan dari sini
export const youtubeVideos: YouTubeVideo[] = [];

// Spotify Content - Kosong, belum ada akun Spotify
export const spotifyContent: SpotifyContent[] = [];

// TikTok Videos - Kosong, belum ada akun TikTok
export const tiktokVideos: TikTokVideo[] = [];
