import { Metadata } from 'next';
import { STATIC_METADATA } from '@/lib/metadata-helper';
import DashboardPageClient from './DashboardPageClient';

export const metadata: Metadata = STATIC_METADATA.dashboard;

export default function DashboardPage() {
    return <DashboardPageClient />;
}
