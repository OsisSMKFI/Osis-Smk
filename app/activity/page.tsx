import { Metadata } from 'next';
import { STATIC_METADATA } from '@/lib/metadata-helper';
import ActivityPageClient from './ActivityPageClient';

export const metadata: Metadata = STATIC_METADATA.activity;

export default function ActivityPage() {
    return <ActivityPageClient />;
}
