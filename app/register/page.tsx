import { Metadata } from 'next';
import { STATIC_METADATA } from '@/lib/metadata-helper';
import RegisterPageClient from './RegisterPageClient';

export const metadata: Metadata = STATIC_METADATA.register;

export default function RegisterPage() {
    return <RegisterPageClient />;
}
