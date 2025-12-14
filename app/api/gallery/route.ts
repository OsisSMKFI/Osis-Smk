import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { convertToSignedUrl } from '@/lib/signedUrls';

// Supabase storage base URL - CURRENT PROJECT
const CURRENT_SUPABASE_URL = 'https://mhefqwregrldvxtqqxbb.supabase.co';
const SUPABASE_STORAGE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL 
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/gallery`
  : `${CURRENT_SUPABASE_URL}/storage/v1/object/public/gallery`;

// Old Supabase project URLs that need to be migrated
const OLD_SUPABASE_DOMAINS = [
  'eilrnslorvfrtwjwvbaw.supabase.co',
  // Add any other old domains here
];

/**
 * Replace old Supabase domain with new one
 * Files are stored on the new project now
 */
function migrateSupabaseUrl(url: string): string {
  if (!url) return url;
  
  for (const oldDomain of OLD_SUPABASE_DOMAINS) {
    if (url.includes(oldDomain)) {
      // Replace old domain with new domain
      return url.replace(oldDomain, 'mhefqwregrldvxtqqxbb.supabase.co');
    }
  }
  return url;
}

/**
 * Fix incomplete URLs that only contain filename
 * e.g., "1762905236277-c19vyw.jpg" -> full Supabase URL
 */
function fixIncompleteUrl(url: string | null | undefined, folder: string = 'general'): string | null {
  if (!url) return null;
  
  // First, migrate old domain URLs
  let fixedUrl = migrateSupabaseUrl(url);
  
  // Already a full URL (with correct domain now)
  if (fixedUrl.startsWith('http://') || fixedUrl.startsWith('https://')) {
    return fixedUrl;
  }
  
  // Already a path starting with /
  if (fixedUrl.startsWith('/')) {
    return `${SUPABASE_STORAGE_URL}${fixedUrl}`;
  }
  
  // Just a filename - construct full URL
  return `${SUPABASE_STORAGE_URL}/${folder}/${fixedUrl}`;
}

export async function GET() {
  try {
    const { data: gallery, error } = await supabaseAdmin
      .from('gallery')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching gallery:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Convert all media URLs to signed URLs
    const galleryWithSignedUrls = await Promise.all(
      (gallery || []).map(async (item: any) => {
        const updatedItem = { ...item };
        
        // Determine folder based on category or default to 'general'
        const folder = item.category || item.folder || 'general';
        
        // Fix and convert image_url if present
        if (item.image_url) {
          const fixedUrl = fixIncompleteUrl(item.image_url, folder);
          const signedUrl = await convertToSignedUrl(fixedUrl);
          if (signedUrl) {
            updatedItem.image_url = signedUrl.url;
            updatedItem.image_expires_at = signedUrl.expiresAt;
          } else if (fixedUrl) {
            // Fallback to fixed URL without signing
            updatedItem.image_url = fixedUrl;
          }
        }
        
        // Fix and convert video_url if present
        if (item.video_url) {
          const fixedUrl = fixIncompleteUrl(item.video_url, folder);
          const signedUrl = await convertToSignedUrl(fixedUrl);
          if (signedUrl) {
            updatedItem.video_url = signedUrl.url;
            updatedItem.video_expires_at = signedUrl.expiresAt;
          } else if (fixedUrl) {
            updatedItem.video_url = fixedUrl;
          }
        }
        
        // Fix and convert url field if present (generic)
        if (item.url && !item.image_url && !item.video_url) {
          const fixedUrl = fixIncompleteUrl(item.url, folder);
          const signedUrl = await convertToSignedUrl(fixedUrl);
          if (signedUrl) {
            updatedItem.url = signedUrl.url;
            updatedItem.url_expires_at = signedUrl.expiresAt;
          } else if (fixedUrl) {
            updatedItem.url = fixedUrl;
          }
        }
        
        return updatedItem;
      })
    );

    return NextResponse.json({ gallery: galleryWithSignedUrls });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
