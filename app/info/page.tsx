import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/metadata-helper';
import {
    getPublicAnnouncements,
    getPublicEvents,
    getPublicPolls,
    getPublicPosts,
} from '@/lib/publicData';
import InfoPageClient from './InfoPageClient';

export const metadata: Metadata = generatePageMetadata({
    title: 'Info & Event - OSIS SMK Informatika 2 FI',
    description: 'Informasi event, pengumuman, polling, dan berita terbaru dari OSIS SMK Informatika 2 Fithrah Insani.',
    url: '/info',
    type: 'website',
    image: '/images/logo.png',
});

export const revalidate = 60;

export default async function InfoPage() {
    const [announcements, events, polls, posts] = await Promise.all([
        getPublicAnnouncements(),
        getPublicEvents(),
        getPublicPolls(),
        getPublicPosts(6),
    ]);
    return (
        <InfoPageClient
            initialAnnouncements={announcements}
            initialEvents={events}
            initialPolls={polls}
            initialPosts={posts}
        />
    );
}
