import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/metadata-helper';
import { getPublicGallery, getPublicGalleryItem, getPublicEvents, getPublicSekbid } from '@/lib/publicData';
import GalleryPageClient from './GalleryPageClient';

const DEFAULT_GALLERY_METADATA = (): Metadata =>
    generatePageMetadata({
        title: 'Galeri - OSIS SMK Informatika 2 FI',
        description: 'Dokumentasi foto dan video kegiatan OSIS SMK Informatika 2 Fithrah Insani. Lihat momen-momen berharga dari berbagai acara dan kegiatan.',
        url: '/gallery',
        type: 'website',
        image: '/og/default',
    });

export async function generateMetadata({
    searchParams,
}: {
    searchParams: Promise<{ item?: string }>;
}): Promise<Metadata> {
    const { item } = await searchParams;

    if (item) {
        try {
            const g = await getPublicGalleryItem(item);
            if (g) {
                const isVideo = /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(
                    g.image_url || g.video_url || ''
                );
                const description = g.description
                    ? String(g.description).slice(0, 300)
                    : isVideo
                        ? `Video "${g.title}" — Galeri OSIS SMK Fithrah Insani.`
                        : `Foto "${g.title}" — Galeri OSIS SMK Fithrah Insani.`;

                return generatePageMetadata({
                    title: `${g.title} - Galeri OSIS SMK Fithrah Insani`,
                    description,
                    url: `/gallery?item=${encodeURIComponent(item)}`,
                    type: 'website',
                    galleryId: item,
                });
            }
        } catch {
            // fall through to default metadata
        }
    }

    return DEFAULT_GALLERY_METADATA();
}

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
