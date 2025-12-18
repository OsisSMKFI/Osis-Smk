import { Metadata } from 'next';
import { STATIC_METADATA } from '@/lib/metadata-helper';
import AttendancePageClient from './AttendancePageClient';

export const metadata: Metadata = STATIC_METADATA.attendance;

export default function AttendancePage() {
    return <AttendancePageClient />;
}
