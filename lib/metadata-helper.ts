import { Metadata } from 'next';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 METADATA HELPER - Centralized metadata generation for all pages
// ═══════════════════════════════════════════════════════════════════════════════

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://osissmktest.biezz.my.id';
const DEFAULT_TITLE = 'OSIS SMK Informatika 2 Fithrah Insani';
const DEFAULT_DESCRIPTION = 'Website Resmi OSIS SMK Informatika 2 Fithrah Insani - Organisasi Siswa Intra Sekolah yang aktif dalam kegiatan keislaman, kepemimpinan, dan kreativitas siswa.';
// Use logo.png as default OG image (ensure this file exists in public/images)
const DEFAULT_IMAGE = `${SITE_URL}/images/logo.png`;
const DEFAULT_LOGO = `${SITE_URL}/images/logo.png`;

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
}

/**
 * Generate complete metadata for any page
 * Handles all fallbacks and ensures proper format
 */
export function generatePageMetadata(params: MetadataParams): Metadata {
    const title = params.title || DEFAULT_TITLE;
    const description = params.description || DEFAULT_DESCRIPTION;
    const url = params.url ? `${SITE_URL}${params.url}` : SITE_URL;
    const type = params.type || 'website';
    
    // Handle image - ensure it's a valid public URL
    let image = DEFAULT_IMAGE;
    if (params.image) {
        // Check if it's a full URL
        if (params.image.startsWith('http')) {
            image = params.image;
        } else if (params.image.startsWith('/')) {
            image = `${SITE_URL}${params.image}`;
        }
    }
    
    // Ensure image ends with proper extension (not webp for better compatibility)
    // If it's a Supabase storage URL, it should work
    
    const metadata: Metadata = {
        title,
        description,
        keywords: params.keywords || ['OSIS', 'SMK Informatika 2', 'Fithrah Insani', 'Bandung', 'Sekolah Islam'],
        authors: params.author ? [{ name: params.author }] : [{ name: 'OSIS SMK Informatika 2 FI' }],
        
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
                    width: 1200,
                    height: 630,
                    alt: title,
                    type: 'image/png',
                }
            ],
            ...(type === 'article' && {
                publishedTime: params.publishedTime,
                modifiedTime: params.modifiedTime,
                authors: params.author ? [params.author] : undefined,
                section: params.section,
            }),
        },
        
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

export { SITE_URL, DEFAULT_TITLE, DEFAULT_DESCRIPTION, DEFAULT_IMAGE, DEFAULT_LOGO };
