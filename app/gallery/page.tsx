import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/metadata-helper';
import GalleryPageClient from './GalleryPageClient';

export const metadata: Metadata = generatePageMetadata({
    title: 'Galeri - OSIS SMK Informatika 2 FI',
    description: 'Dokumentasi foto dan video kegiatan OSIS SMK Informatika 2 Fithrah Insani. Lihat momen-momen berharga dari berbagai acara dan kegiatan.',
    url: '/gallery',
    type: 'website',
    image: '/images/logo.png',
});

export default function GalleryPage() {
    return <GalleryPageClient />;
}
