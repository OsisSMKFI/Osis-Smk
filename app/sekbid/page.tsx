import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/metadata-helper';
import SekbidPageClient from './SekbidPageClient';

export const metadata: Metadata = generatePageMetadata({
    title: 'Seksi Bidang - OSIS SMK Informatika 2 FI',
    description: 'Informasi lengkap tentang 6 Seksi Bidang OSIS SMK Informatika 2 Fithrah Insani: Keagamaan, Kaderisasi, Akademik, Olahraga, Lingkungan, dan Publikasi.',
    url: '/sekbid',
    type: 'website',
    image: '/images/logo.png',
});

export default function SekbidPage() {
    return <SekbidPageClient />;
}
