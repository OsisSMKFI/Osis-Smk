import { Suspense } from 'react';
import { Metadata } from 'next';
import { STATIC_METADATA } from '@/lib/metadata-helper';
import WaitingVerificationPageClient from './WaitingVerificationPageClient';

export const metadata: Metadata = STATIC_METADATA.waitingVerification;

export default function WaitingVerificationPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-500 border-t-transparent" />
                </div>
            }
        >
            <WaitingVerificationPageClient />
        </Suspense>
    );
}
