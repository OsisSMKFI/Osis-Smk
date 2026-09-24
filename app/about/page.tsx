import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/metadata-helper';
import { getPublicPageContent } from '@/lib/publicData';
import AboutPageClient from './AboutPageClient';

export const metadata: Metadata = generatePageMetadata({
    title: 'Tentang Kami - OSIS SMK Informatika 2 FI',
    description: 'Mengenal lebih dekat OSIS SMK Informatika 2 Fithrah Insani - Visi, Misi, Filosofi, Sejarah, dan Struktur Organisasi kami.',
    url: '/about',
    type: 'website',
    image: '/images/logo.png',
});

export const revalidate = 60;

export default async function AboutPage() {
    let initialDb: Record<string, string> = {};
    try {
        initialDb = await getPublicPageContent();
    } catch {
        // soft-fail → client fallbacks
    }
    return <AboutPageClient initialDb={initialDb} />;
}
