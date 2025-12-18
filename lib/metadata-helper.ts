import { Metadata } from 'next';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 METADATA HELPER v4.0 - OG Image Proxy (Industry Standard)
// ═══════════════════════════════════════════════════════════════════════════════
// 
// SOLUSI YOUTUBE/NEWS SITE BESAR:
// ✅ OG Image selalu dari DOMAIN SENDIRI (bukan Supabase langsung)
// ✅ Image di-proxy melalui /og/post/{slug} atau /og/sekbid/{id}
// ✅ WhatsApp HANYA percaya domain OG image = domain website
// ✅ Supabase image tetap dipakai, tapi di-serve ulang via proxy
// 
// ARSITEKTUR:
// Supabase Image → Server Proxy (/og/...) → WhatsApp/FB/Telegram
// 
// WHY THIS WORKS:
// - Image URL = domain website (trusted)
// - No redirect, no token, no auth
// - Static URL (no query params)
// - Pure HTTP image response
// ═══════════════════════════════════════════════════════════════════════════════

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://osissmktest.biezz.my.id';
export const DEFAULT_TITLE = 'OSIS SMK Informatika 2 Fithrah Insani';
export const DEFAULT_DESCRIPTION = 'Website Resmi OSIS SMK Informatika 2 Fithrah Insani - Organisasi Siswa Intra Sekolah yang aktif dalam kegiatan keislaman, kepemimpinan, dan kreativitas siswa.';

// ═══════════════════════════════════════════════════════════════════════════════
// OG IMAGE PROXY URLs (served from our domain)
// ═══════════════════════════════════════════════════════════════════════════════
// Cache buster version - increment this to force WhatsApp to re-fetch
// IMPORTANT: After fixing NEXT_PUBLIC_SITE_URL on Vercel, increment this!
// v5: Added Sharp compression to reduce image size for WhatsApp (<300KB)
// v6: Fixed logo path to logo-2.png
// v7: Changed fit:cover to fit:contain to prevent cropping on all platforms
const OG_VERSION = 7;

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og/default?v=${OG_VERSION}`;
export const FALLBACK_OG_IMAGE = `${SITE_URL}/og/default?v=${OG_VERSION}`;

/**
 * Get proxied OG image URL for a post
 * Image is served from our domain, proxying the Supabase image
 * Includes version param to bust WhatsApp cache
 */
export function getPostOGImage(slug: string): string {
    return `${SITE_URL}/og/post/${slug}?v=${OG_VERSION}`;
}

/**
 * Get proxied OG image URL for a sekbid
 * Image is served from our domain, proxying the Supabase image
 * Includes version param to bust WhatsApp cache
 */
export function getSekbidOGImage(id: number): string {
    return `${SITE_URL}/og/sekbid/${id}?v=${OG_VERSION}`;
}

/**
 * Get safe OG image URL
 * Uses proxy URLs for dynamic content, default for static pages
 */
export function getSafeOGImage(options: {
    postSlug?: string;
    sekbidId?: number;
    staticImage?: string;
}): string {
    // 1. Post-specific (proxied)
    if (options.postSlug) {
        return getPostOGImage(options.postSlug);
    }
    
    // 2. Sekbid-specific (proxied)
    if (options.sekbidId) {
        return getSekbidOGImage(options.sekbidId);
    }
    
    // 3. Static local image
    if (options.staticImage) {
        if (options.staticImage.startsWith('http')) {
            return options.staticImage;
        }
        return `${SITE_URL}${options.staticImage.startsWith('/') ? '' : '/'}${options.staticImage}`;
    }
    
    // 4. Default (proxied)
    return DEFAULT_OG_IMAGE;
}

interface MetadataParams {
    title?: string;
    description?: string;
    image?: string | null;
    url?: string;
    type?: 'website' | 'article' | 'profile';
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    keywords?: string[];
    // NEW: For OG Image Proxy
    postSlug?: string;   // For post-specific OG image proxy
    sekbidId?: number;   // For sekbid-specific OG image proxy
}

/**
 * Generate complete metadata for any page
 * 
 * OG IMAGE PROXY STRATEGY:
 * - Posts: /og/post/{slug} (proxies Supabase image)
 * - Sekbid: /og/sekbid/{id} (proxies Supabase image)
 * - Static pages: /og/default (serves logo)
 * 
 * WhatsApp sees: osissmktest.biezz.my.id/og/...
 * WhatsApp doesn't see: supabase.co/...
 */
export function generatePageMetadata(params: MetadataParams): Metadata {
    const title = params.title || DEFAULT_TITLE;
    const description = params.description || DEFAULT_DESCRIPTION;
    const url = params.url ? `${SITE_URL}${params.url}` : SITE_URL;
    const type = params.type || 'website';
    
    // Get OG image via proxy (our domain, not Supabase)
    const image = getSafeOGImage({
        postSlug: params.postSlug,
        sekbidId: params.sekbidId,
        staticImage: params.image || undefined,
    });
    
    const metadata: Metadata = {
        title,
        description,
        keywords: params.keywords || ['OSIS', 'SMK Informatika 2', 'Fithrah Insani', 'Bandung', 'Sekolah Islam'],
        authors: params.author ? [{ name: params.author }] : [{ name: 'OSIS SMK Informatika 2 FI' }],
        
        // ═══════════════════════════════════════════════════════════════
        // OPEN GRAPH - WhatsApp reads this
        // Image is from OUR DOMAIN (proxied)
        // ═══════════════════════════════════════════════════════════════
        openGraph: {
            title,
            description,
            url,
            siteName: DEFAULT_TITLE,
            type: type as any,
            locale: 'id_ID',
            images: [
                {
                    url: image,
                    width: 1200,  // WAJIB untuk WhatsApp
                    height: 630,  // WAJIB untuk WhatsApp
                    alt: title,
                    type: 'image/jpeg',
                }
            ],
            ...(type === 'article' && {
                publishedTime: params.publishedTime,
                modifiedTime: params.modifiedTime,
                authors: params.author ? [params.author] : undefined,
                section: params.section,
            }),
        },
        
        // ═══════════════════════════════════════════════════════════════
        // TWITTER CARD - Fallback for WhatsApp
        // ═══════════════════════════════════════════════════════════════
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [image],
            creator: '@osissmkinformatika2fi',
        },
        
        alternates: {
            canonical: url,
        },
        
        robots: {
            index: true,
            follow: true,
        },
    };
    
    return metadata;
}

/**
 * Generate metadata for static pages
 * All static pages use /og/default (logo) for thumbnail
 */
export const STATIC_METADATA = {
    home: generatePageMetadata({
        title: 'OSIS SMK Informatika 2 Fithrah Insani',
        description: 'Website Resmi OSIS SMK Informatika 2 Fithrah Insani - Pusat informasi kegiatan, berita, dan program kerja OSIS.',
        url: '/',
        type: 'website',
    }),
    
    about: generatePageMetadata({
        title: 'Tentang Kami - OSIS SMK Informatika 2 FI',
        description: 'Mengenal lebih dekat OSIS SMK Informatika 2 Fithrah Insani - Visi, Misi, Filosofi, dan Struktur Organisasi.',
        url: '/about',
        type: 'website',
    }),
    
    people: generatePageMetadata({
        title: 'Anggota OSIS - SMK Informatika 2 FI',
        description: 'Daftar lengkap pengurus dan anggota OSIS SMK Informatika 2 Fithrah Insani periode aktif.',
        url: '/people',
        type: 'website',
    }),
    
    posts: generatePageMetadata({
        title: 'Berita & Artikel - OSIS SMK Informatika 2 FI',
        description: 'Berita terbaru, artikel, dan informasi kegiatan dari OSIS SMK Informatika 2 Fithrah Insani.',
        url: '/posts',
        type: 'website',
    }),
    
    gallery: generatePageMetadata({
        title: 'Galeri - OSIS SMK Informatika 2 FI',
        description: 'Dokumentasi foto dan video kegiatan OSIS SMK Informatika 2 Fithrah Insani.',
        url: '/gallery',
        type: 'website',
    }),
    
    sekbid: generatePageMetadata({
        title: 'Seksi Bidang - OSIS SMK Informatika 2 FI',
        description: 'Informasi lengkap tentang seksi bidang OSIS SMK Informatika 2 Fithrah Insani beserta program kerjanya.',
        url: '/sekbid',
        type: 'website',
    }),
    
    info: generatePageMetadata({
        title: 'Info & Event - OSIS SMK Informatika 2 FI',
        description: 'Informasi event, kegiatan, dan pengumuman dari OSIS SMK Informatika 2 Fithrah Insani.',
        url: '/info',
        type: 'website',
    }),
    
    bidang: generatePageMetadata({
        title: 'Program Kerja - OSIS SMK Informatika 2 FI',
        description: 'Daftar program kerja OSIS SMK Informatika 2 Fithrah Insani.',
        url: '/bidang',
        type: 'website',
    }),
    
    activity: generatePageMetadata({
        title: 'Aktivitas - OSIS SMK Informatika 2 FI',
        description: 'Log aktivitas dan kegiatan terbaru OSIS SMK Informatika 2 Fithrah Insani.',
        url: '/activity',
        type: 'website',
    }),
    
    socialMedia: generatePageMetadata({
        title: 'Media Sosial - OSIS SMK Informatika 2 FI',
        description: 'Ikuti kami di berbagai platform media sosial untuk update terbaru.',
        url: '/our-social-media',
        type: 'website',
    }),
    
    register: generatePageMetadata({
        title: 'Pendaftaran - OSIS SMK Informatika 2 FI',
        description: 'Daftar sebagai anggota OSIS SMK Informatika 2 Fithrah Insani.',
        url: '/register',
        type: 'website',
    }),
    
    enroll: generatePageMetadata({
        title: 'Enrollment - OSIS SMK Informatika 2 FI',
        description: 'Halaman enrollment untuk anggota OSIS SMK Informatika 2 Fithrah Insani.',
        url: '/enroll',
        type: 'website',
    }),
    
    dashboard: generatePageMetadata({
        title: 'Dashboard - OSIS SMK Informatika 2 FI',
        description: 'Dashboard anggota OSIS SMK Informatika 2 Fithrah Insani.',
        url: '/dashboard',
        type: 'website',
    }),
    
    attendance: generatePageMetadata({
        title: 'Absensi - OSIS SMK Informatika 2 FI',
        description: 'Sistem absensi OSIS SMK Informatika 2 Fithrah Insani.',
        url: '/attendance',
        type: 'website',
    }),
    
    profileEdit: generatePageMetadata({
        title: 'Edit Profil - OSIS SMK Informatika 2 FI',
        description: 'Edit profil anggota OSIS SMK Informatika 2 Fithrah Insani.',
        url: '/profile/edit',
        type: 'website',
    }),
    
    waitingApproval: generatePageMetadata({
        title: 'Menunggu Persetujuan - OSIS SMK Informatika 2 FI',
        description: 'Pendaftaran Anda sedang menunggu persetujuan admin.',
        url: '/waiting-approval',
        type: 'website',
    }),
    
    waitingVerification: generatePageMetadata({
        title: 'Verifikasi Email - OSIS SMK Informatika 2 FI',
        description: 'Silakan verifikasi email Anda untuk melanjutkan.',
        url: '/waiting-verification',
        type: 'website',
    }),
    
    notFound: generatePageMetadata({
        title: 'Halaman Tidak Ditemukan - OSIS SMK Informatika 2 FI',
        description: 'Halaman yang Anda cari tidak ditemukan.',
        url: '/404',
        type: 'website',
    }),
};

// Backwards compatibility aliases
export const DEFAULT_IMAGE = FALLBACK_OG_IMAGE;
export const DEFAULT_LOGO = `${SITE_URL}/images/logo-2.png`;
