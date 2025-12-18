import { Metadata } from 'next';
import { STATIC_METADATA } from '@/lib/metadata-helper';
import EnrollPageClient from './EnrollPageClient';

export const metadata: Metadata = STATIC_METADATA.enroll;

export default function EnrollPage() {
    return <EnrollPageClient />;
}
