import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/metadata-helper';
import { getPublicSekbid, getPublicProker } from '@/lib/publicData';
import SekbidPageClient from './SekbidPageClient';

export const metadata: Metadata = generatePageMetadata({
    title: 'Seksi Bidang - OSIS SMK Informatika 2 FI',
    description: 'Informasi lengkap tentang 6 Seksi Bidang OSIS SMK Informatika 2 Fithrah Insani: Keagamaan, Kaderisasi, Akademik, Olahraga, Lingkungan, dan Publikasi.',
    url: '/sekbid',
    type: 'website',
    image: '/images/logo.png',
});

export const revalidate = 60;

export default async function SekbidPage() {
    const [sekbid, programs] = await Promise.all([getPublicSekbid(), getPublicProker()]);
    const counts: Record<number, number> = {};
    for (const p of programs) {
        if (p.sekbid_id) counts[p.sekbid_id] = (counts[p.sekbid_id] || 0) + 1;
    }
    return <SekbidPageClient initialSekbid={sekbid} initialProkerCounts={counts} />;
}
