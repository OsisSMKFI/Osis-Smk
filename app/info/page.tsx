import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/metadata-helper';
import InfoPageClient from './InfoPageClient';

export const metadata: Metadata = generatePageMetadata({
    title: 'Info & Event - OSIS SMK Informatika 2 FI',
    description: 'Informasi event, pengumuman, polling, dan berita terbaru dari OSIS SMK Informatika 2 Fithrah Insani.',
    url: '/info',
    type: 'website',
    image: '/images/logo.png',
});

export default function InfoPage() {
    return <InfoPageClient />;
}
