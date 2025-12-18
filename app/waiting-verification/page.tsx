import { Metadata } from 'next';
import { STATIC_METADATA } from '@/lib/metadata-helper';
import WaitingVerificationPageClient from './WaitingVerificationPageClient';

export const metadata: Metadata = STATIC_METADATA.waitingVerification;

export default function WaitingVerificationPage() {
    return <WaitingVerificationPageClient />;
}
