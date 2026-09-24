import { Metadata } from 'next';
import { STATIC_METADATA } from '@/lib/metadata-helper';
import { getPublicPosts } from '@/lib/publicData';
import PostsPageClient from './PostsPageClient';

export const metadata = STATIC_METADATA.posts;

export const revalidate = 60;

export default async function PostsPage() {
    const posts = await getPublicPosts(24);
    return <PostsPageClient initialPosts={posts} />;
}
