import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { generatePageMetadata } from '@/lib/metadata-helper';
import PostDetailClient from './PostDetailClient';

// Create Supabase client for server-side data fetching
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featured_image?: string;
  author_id?: string;
  category?: string;
  tags?: string[];
  status: string;
  is_featured: boolean;
  published_at: string;
  created_at: string;
  views: number;
}

// Fetch post data for metadata
async function getPost(slug: string): Promise<Post | null> {
  try {
    const { data: post, error } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error || !post) {
      return null;
    }

    return post as Post;
  } catch (error) {
    console.error('Error fetching post for metadata:', error);
    return null;
  }
}

// Generate dynamic metadata with Open Graph
// OG IMAGE PROXY: Image served from /og/post/{slug} (our domain)
// WhatsApp sees: osissmktest.biezz.my.id/og/post/xxx
// NOT: supabase.co/xxx
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  // Default metadata if post not found
  if (!post) {
    return generatePageMetadata({
      title: 'Berita Tidak Ditemukan',
      description: 'Berita yang Anda cari tidak ditemukan.',
      url: `/posts/${slug}`,
    });
  }

  // Get excerpt or generate from content
  const description = post.excerpt || 
    post.content.replace(/<[^>]*>/g, '').slice(0, 160) + '...';

  // Use OG Image Proxy - image served from our domain
  // The proxy at /og/post/{slug} fetches from Supabase and serves it
  return generatePageMetadata({
    title: post.title,
    description,
    url: `/posts/${post.slug}`,
    type: 'article',
    postSlug: post.slug, // THIS IS THE KEY - uses /og/post/{slug} proxy
    publishedTime: post.published_at || post.created_at,
    modifiedTime: post.created_at,
    section: post.category || 'Berita',
    keywords: post.tags,
    author: 'OSIS SMK Informatika Fithrah Insani',
  });
}

// Page component - Server Component wrapper
export default async function PostDetailPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params;
  
  // Pre-fetch post data for hydration (optional, for faster initial load)
  const post = await getPost(slug);

  return <PostDetailClient initialPost={post} />;
}
