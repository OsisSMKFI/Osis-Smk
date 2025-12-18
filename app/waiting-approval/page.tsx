import { Metadata } from 'next';
import { STATIC_METADATA } from '@/lib/metadata-helper';
import WaitingApprovalPageClient from './WaitingApprovalPageClient';

export const metadata: Metadata = STATIC_METADATA.waitingApproval;

export default function WaitingApprovalPage() {
    return <WaitingApprovalPageClient />;
}
