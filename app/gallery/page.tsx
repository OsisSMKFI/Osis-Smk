import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/metadata-helper';
import { getPublicGallery, getPublicEvents, getPublicSekbid } from '@/lib/publicData';
import GalleryPageClient from './GalleryPageClient';

export const metadata: Metadata = generatePageMetadata({
    title: 'Galeri - OSIS SMK Informatika 2 FI',
    description: 'Dokumentasi foto dan video kegiatan OSIS SMK Informatika 2 Fithrah Insani. Lihat momen-momen berharga dari berbagai acara dan kegiatan.',
    url: '/gallery',
    type: 'website',
    image: '/images/logo.png',
});

export const revalidate = 60;

export default async function GalleryPage() {
    const [gallery, events, sekbids] = await Promise.all([
        getPublicGallery(),
        getPublicEvents(),
        getPublicSekbid(),
    ]);
    return (
        <GalleryPageClient
            initialGallery={gallery}
            initialEvents={events.map((e) => ({ id: e.id, title: e.title, event_date: e.event_date }))}
            initialSekbids={sekbids.map((s) => ({ id: s.id, name: s.name }))}
        />
    );
}
