import { Metadata } from 'next';
import { STATIC_METADATA } from '@/lib/metadata-helper';
import ClientOurSocialMedia from "./our-social-media/ClientOurSocialMedia";

export const metadata: Metadata = STATIC_METADATA.socialMedia;

export default function OurSocialMediaPage() {
  return <ClientOurSocialMedia />;
}
