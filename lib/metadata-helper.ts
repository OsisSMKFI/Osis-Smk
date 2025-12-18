import { Metadata } from 'next';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 METADATA HELPER v3.0 - WhatsApp Optimized
// ═══════════════════════════════════════════════════════════════════════════════
// 
// WHATSAPP REQUIREMENTS:
// ✅ og:image:width & og:image:height (WAJIB)
// ✅ twitter:card = summary_large_image (FALLBACK)
// ✅ Static images (no query params)
// ✅ HTTPS, 200 OK, no redirect
// ✅ JPEG/PNG, < 300KB, 1200x630
// ✅ Local images (not Supabase for reliability)
// ═══════════════════════════════════════════════════════════════════════════════

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://osissmktest.biezz.my.id';
export const DEFAULT_TITLE = 'OSIS SMK Informatika 2 Fithrah Insani';
export const DEFAULT_DESCRIPTION = 'Website Resmi OSIS SMK Informatika 2 Fithrah Insani - Organisasi Siswa Intra Sekolah yang aktif dalam kegiatan keislaman, kepemimpinan, dan kreativitas siswa.';
// Default OG image - must be local, static, < 300KB
const DEFAULT_OG_IMAGE = `${SITE_URL}/og/default.jpg`;
export const FALLBACK_OG_IMAGE = `${SITE_URL}/images/logo.png`;

/**
 * Static OG images for sekbid (pre-generated for WhatsApp compatibility)
 * These should be in /public/og/ folder
 */
export const SEKBID_OG_IMAGES: Record<number, string> = {
    1: `${SITE_URL}/og/sekbid-1.jpg`,
    2: `${SITE_URL}/og/sekbid-2.jpg`,
    3: `${SITE_URL}/og/sekbid-3.jpg`,
    4: `${SITE_URL}/og/sekbid-4.jpg`,
    5: `${SITE_URL}/og/sekbid-5.jpg`,
    6: `${SITE_URL}/og/sekbid-6.jpg`,
};

/**
 * Static OG images for pages
 */
export const PAGE_OG_IMAGES: Record<string, string> = {
    home: `${SITE_URL}/og/home.jpg`,
    about: `${SITE_URL}/og/about.jpg`,
    people: `${SITE_URL}/og/people.jpg`,
    posts: `${SITE_URL}/og/posts.jpg`,
    gallery: `${SITE_URL}/og/gallery.jpg`,
    sekbid: `${SITE_URL}/og/sekbid.jpg`,
    info: `${SITE_URL}/og/info.jpg`,
    bidang: `${SITE_URL}/og/bidang.jpg`,
};

/**
 * Get safe OG image URL
 * Priority: static local > dynamic API > fallback
 */
export function getSafeOGImage(options: {
    staticImage?: string;
    contentImage?: string;
    pageKey?: string;
    sekbidId?: number;
}): string {
    // 1. Use explicit static image if provided
    if (options.staticImage) {
        // Ensure it's absolute URL
        if (options.staticImage.startsWith('http')) {
            return options.staticImage;
        }
        return `${SITE_URL}${options.staticImage.startsWith('/') ? '' : '/'}${options.staticImage}`;
    }
    
    // 2. Use sekbid-specific image
    if (options.sekbidId && SEKBID_OG_IMAGES[options.sekbidId]) {
        return SEKBID_OG_IMAGES[options.sekbidId];
    }
    
    // 3. Use page-specific image
    if (options.pageKey && PAGE_OG_IMAGES[options.pageKey]) {
        return PAGE_OG_IMAGES[options.pageKey];
    }
    
    // 4. Use content image if it's a safe local path
    if (options.contentImage) {
        // Avoid Supabase/external URLs for WhatsApp (unreliable)
        // Only use if it's a local path
        if (options.contentImage.startsWith('/') && !options.contentImage.includes('?')) {
            return `${SITE_URL}${options.contentImage}`;
        }
        // If it's a full URL and looks local, use it
        if (options.contentImage.startsWith(SITE_URL) && !options.contentImage.includes('?')) {
            return options.contentImage;
        }
    }
    
    // 5. Fallback
    return FALLBACK_OG_IMAGE;
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
    ogType?: 'default' | 'post' | 'sekbid' | 'event' | 'member' | 'gallery';
    category?: string;
    pageKey?: string; // For static page OG images
    sekbidId?: number; // For sekbid-specific OG images
}

/**
 * Generate complete metadata for any page
 * WHATSAPP OPTIMIZED:
 * - Static images (no query params)
 * - Includes og:image:width & og:image:height
 * - Includes full Twitter Card as fallback
 * - JPEG preferred over PNG
 */
export function generatePageMetadata(params: MetadataParams): Metadata {
    const title = params.title || DEFAULT_TITLE;
    const description = params.description || DEFAULT_DESCRIPTION;
    const url = params.url ? `${SITE_URL}${params.url}` : SITE_URL;
    const type = params.type || 'website';
    
    // Get WhatsApp-safe OG image
    const image = getSafeOGImage({
        staticImage: params.image || undefined,
        pageKey: params.pageKey,
        sekbidId: params.sekbidId,
    });
    
    const metadata: Metadata = {
        title,
        description,
        keywords: params.keywords || ['OSIS', 'SMK Informatika 2', 'Fithrah Insani', 'Bandung', 'Sekolah Islam'],
        authors: params.author ? [{ name: params.author }] : [{ name: 'OSIS SMK Informatika 2 FI' }],
        
        // ═══════════════════════════════════════════════════════════════
        // OPEN GRAPH - WhatsApp reads this
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
                    type: 'image/jpeg', // JPEG lebih aman untuk WA
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
        // TWITTER CARD - WhatsApp fallback ke ini kalau OG gagal
        // ═══════════════════════════════════════════════════════════════
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [image], // Sama dengan OG image
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
 * Uses pageKey to map to static OG images in /public/og/
 */
export const STATIC_METADATA = {
    home: generatePageMetadata({
        title: 'OSIS SMK Informatika 2 Fithrah Insani',
        description: 'Website Resmi OSIS SMK Informatika 2 Fithrah Insani - Pusat informasi kegiatan, berita, dan program kerja OSIS.',
        url: '/',
        type: 'website',
        pageKey: 'home',
    }),
    
    about: generatePageMetadata({
        title: 'Tentang Kami - OSIS SMK Informatika 2 FI',
        description: 'Mengenal lebih dekat OSIS SMK Informatika 2 Fithrah Insani - Visi, Misi, Filosofi, dan Struktur Organisasi.',
        url: '/about',
        type: 'website',
        pageKey: 'about',
    }),
    
    people: generatePageMetadata({
        title: 'Anggota OSIS - SMK Informatika 2 FI',
        description: 'Daftar lengkap pengurus dan anggota OSIS SMK Informatika 2 Fithrah Insani periode aktif.',
        url: '/people',
        type: 'website',
        pageKey: 'people',
    }),
    
    posts: generatePageMetadata({
        title: 'Berita & Artikel - OSIS SMK Informatika 2 FI',
        description: 'Berita terbaru, artikel, dan informasi kegiatan dari OSIS SMK Informatika 2 Fithrah Insani.',
        url: '/posts',
        type: 'website',
        pageKey: 'posts',
    }),
    
    gallery: generatePageMetadata({
        title: 'Galeri - OSIS SMK Informatika 2 FI',
        description: 'Dokumentasi foto dan video kegiatan OSIS SMK Informatika 2 Fithrah Insani.',
        url: '/gallery',
        type: 'website',
        pageKey: 'gallery',
    }),
    
    sekbid: generatePageMetadata({
        title: 'Seksi Bidang - OSIS SMK Informatika 2 FI',
        description: 'Informasi lengkap tentang seksi bidang OSIS SMK Informatika 2 Fithrah Insani beserta program kerjanya.',
        url: '/sekbid',
        type: 'website',
        pageKey: 'sekbid',
    }),
    
    info: generatePageMetadata({
        title: 'Info & Event - OSIS SMK Informatika 2 FI',
        description: 'Informasi event, kegiatan, dan pengumuman dari OSIS SMK Informatika 2 Fithrah Insani.',
        url: '/info',
        type: 'website',
        pageKey: 'info',
    }),
    
    bidang: generatePageMetadata({
        title: 'Program Kerja - OSIS SMK Informatika 2 FI',
        description: 'Daftar program kerja OSIS SMK Informatika 2 Fithrah Insani.',
        url: '/bidang',
        type: 'website',
        pageKey: 'bidang',
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
export const DEFAULT_LOGO = `${SITE_URL}/images/logo.png`;
