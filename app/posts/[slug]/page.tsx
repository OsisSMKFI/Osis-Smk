import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { generatePageMetadata, SITE_URL, getSafeOGImage } from '@/lib/metadata-helper';
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

// Generate dynamic metadata with Open Graph (WhatsApp optimized)
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
      pageKey: 'posts', // Use posts page default OG
    });
  }

  // Get excerpt or generate from content
  const description = post.excerpt || 
    post.content.replace(/<[^>]*>/g, '').slice(0, 160) + '...';

  // Get WhatsApp-safe OG image
  // Priority: featured_image (if valid static URL) > posts page default
  let postImage: string | undefined;
  
  if (post.featured_image) {
    // Check if it's NOT a video
    const isVideo = /\.(mp4|webm|ogg)$/i.test(post.featured_image);
    if (!isVideo) {
      // For Supabase URLs, we still use them but they might not work perfectly on WhatsApp
      // For local/static images, they work great
      postImage = post.featured_image;
    }
  }

  return generatePageMetadata({
    title: post.title,
    description,
    url: `/posts/${post.slug}`,
    type: 'article',
    image: postImage, // Will fallback to posts page default if undefined
    pageKey: 'posts',
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
