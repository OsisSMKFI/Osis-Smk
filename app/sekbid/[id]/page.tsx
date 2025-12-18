import { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase/server';
import { generatePageMetadata, SITE_URL } from '@/lib/metadata-helper';
import SekbidDetailClient from './SekbidDetailClient';

// Sekbid names
const SEKBID_NAMES: Record<number, string> = {
    1: 'Sekbid 1 - Keagamaan',
    2: 'Sekbid 2 - Kaderisasi',
    3: 'Sekbid 3 - Akademik',
    4: 'Sekbid 4 - Olahraga & Kewirausahaan',
    5: 'Sekbid 5 - Kesehatan & Lingkungan',
    6: 'Sekbid 6 - Publikasi & Dokumentasi',
};

const SEKBID_DESCRIPTIONS: Record<number, string> = {
    1: 'Menangani kegiatan keagamaan dan spiritual siswa termasuk kajian, tilawah, dan peringatan hari besar Islam.',
    2: 'Membentuk karakter kepemimpinan dan kaderisasi anggota OSIS yang berkualitas.',
    3: 'Mendukung kegiatan akademik dan pengembangan ilmu pengetahuan siswa.',
    4: 'Menyelenggarakan kegiatan olahraga dan mengembangkan jiwa kewirausahaan.',
    5: 'Menjaga kesehatan dan kelestarian lingkungan sekolah.',
    6: 'Mengelola publikasi, dokumentasi, dan teknologi informasi OSIS.',
};

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const resolvedParams = await params;
    const sekbidId = parseInt(resolvedParams.id);
    
    // Try to get sekbid from database
    let sekbidName = SEKBID_NAMES[sekbidId] || `Sekbid ${sekbidId}`;
    let sekbidDescription = SEKBID_DESCRIPTIONS[sekbidId] || 'Seksi Bidang OSIS SMK Informatika 2 Fithrah Insani';
    
    try {
        const { data } = await supabaseAdmin
            .from('sekbid')
            .select('id, name, description')
            .eq('id', sekbidId)
            .single();
        
        if (data) {
            sekbidName = data.name || sekbidName;
            sekbidDescription = data.description || sekbidDescription;
        }
    } catch (err) {
        // Use defaults
    }
    
    return generatePageMetadata({
        title: `${sekbidName} - OSIS SMK Informatika 2 FI`,
        description: sekbidDescription,
        url: `/sekbid/${sekbidId}`,
        type: 'article',
        image: '/images/logo.png',
    });
}

export default async function SekbidDetailPage({ params }: PageProps) {
    const resolvedParams = await params;
    return <SekbidDetailClient sekbidId={parseInt(resolvedParams.id)} />;
}
