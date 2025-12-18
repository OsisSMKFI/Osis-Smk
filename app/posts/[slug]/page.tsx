import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
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
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  // Default metadata if post not found
  if (!post) {
    return {
      title: 'Berita Tidak Ditemukan | OSIS SMK Informatika',
      description: 'Berita yang Anda cari tidak ditemukan.',
    };
  }

  // Get excerpt or generate from content
  const description = post.excerpt || 
    post.content.replace(/<[^>]*>/g, '').slice(0, 160) + '...';

  // Get featured image or use default
  const ogImage = post.featured_image || '/images/logo.png';
  
  // Check if it's a video
  const isVideo = /\.(mp4|webm|ogg)$/i.test(post.featured_image || '');
  
  // For videos, we might want to use a poster/thumbnail if available
  // Otherwise use a default image
  const imageUrl = isVideo 
    ? '/images/logo.png' // Use default for videos
    : ogImage;

  // Build the full URL
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://osissmktest.biezz.my.id';
  const fullImageUrl = imageUrl.startsWith('http') 
    ? imageUrl 
    : `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;

  return {
    title: `${post.title} | OSIS SMK Informatika`,
    description: description,
    keywords: post.tags?.join(', ') || 'OSIS, SMK Informatika, Berita',
    authors: [{ name: 'OSIS SMK Informatika Fithrah Insani' }],
    
    openGraph: {
      title: post.title,
      description: description,
      url: `${baseUrl}/posts/${post.slug}`,
      siteName: 'OSIS SMK Informatika Fithrah Insani',
      images: [
        {
          url: fullImageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      locale: 'id_ID',
      type: 'article',
      publishedTime: post.published_at || post.created_at,
      modifiedTime: post.created_at,
      section: post.category || 'Berita',
      tags: post.tags || [],
    },
    
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: description,
      images: [fullImageUrl],
    },
    
    robots: {
      index: true,
      follow: true,
    },
    
    alternates: {
      canonical: `${baseUrl}/posts/${post.slug}`,
    },
  };
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
