import { Metadata } from 'next';
import { STATIC_METADATA } from '@/lib/metadata-helper';
import PostsPageClient from './PostsPageClient';

export const metadata: Metadata = STATIC_METADATA.posts;

export default function PostsPage() {
    return <PostsPageClient />;
}
