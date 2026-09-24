import { Metadata } from 'next';
import { STATIC_METADATA } from '@/lib/metadata-helper';
import { getPublicProker } from '@/lib/publicData';
import BidangPageClient from './BidangPageClient';

export const metadata = STATIC_METADATA.bidang;

export const revalidate = 60;

export default async function BidangPage() {
    const proker = await getPublicProker();
    return <BidangPageClient initialProker={proker} />;
}
