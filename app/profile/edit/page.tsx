import { Metadata } from 'next';
import { STATIC_METADATA } from '@/lib/metadata-helper';
import ProfileEditPageClient from './ProfileEditPageClient';

export const metadata: Metadata = STATIC_METADATA.profileEdit;

export default function ProfileEditPage() {
    return <ProfileEditPageClient />;
}
