import { Metadata } from 'next';
import { STATIC_METADATA } from '@/lib/metadata-helper';
import BidangPageClient from './BidangPageClient';

export const metadata: Metadata = STATIC_METADATA.bidang;

export default function BidangPage() {
    return <BidangPageClient />;
}
