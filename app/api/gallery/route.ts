import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { toPublicStorageUrl } from '@/lib/signedUrls';
import { CURRENT_SUPABASE_PROJECT, DEPRECATED_PROJECTS } from '@/lib/supabase/storage';

// Supabase storage base URL - CURRENT PROJECT
const CURRENT_SUPABASE_URL = `https://${CURRENT_SUPABASE_PROJECT}.supabase.co`;
const SUPABASE_STORAGE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL 
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/gallery`
  : `${CURRENT_SUPABASE_URL}/storage/v1/object/public/gallery`;

// Old Supabase project URLs that need to be filtered out
// Using centralized list from storage.ts
const OLD_SUPABASE_DOMAINS = DEPRECATED_PROJECTS.map(p => `${p}.supabase.co`);

/**
 * Check if URL uses deprecated domain - return null if so
 * Files from old projects are gone and should not be displayed
 */
function filterDeprecatedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  for (const oldDomain of OLD_SUPABASE_DOMAINS) {
    if (url.includes(oldDomain)) {
      console.warn(`[Gallery API] Filtering deprecated URL from: ${oldDomain}`);
      return null;  // Return null instead of trying to migrate
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
  
  // First, filter out deprecated domains
  let fixedUrl = filterDeprecatedUrl(url);
  if (!fixedUrl) return null;
  
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
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching gallery:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Public URLs only (no per-item signed URL round trips)
    const galleryWithUrls = (gallery || []).map((item: any) => {
      const updatedItem = { ...item };
      const folder = item.category || item.folder || 'general';

      if (item.image_url) {
        updatedItem.image_url = toPublicStorageUrl(fixIncompleteUrl(item.image_url, folder)) || fixIncompleteUrl(item.image_url, folder);
      }
      if (item.video_url) {
        updatedItem.video_url = toPublicStorageUrl(fixIncompleteUrl(item.video_url, folder)) || fixIncompleteUrl(item.video_url, folder);
      }
      if (item.url && !item.image_url && !item.video_url) {
        updatedItem.url = toPublicStorageUrl(fixIncompleteUrl(item.url, folder)) || fixIncompleteUrl(item.url, folder);
      }
      return updatedItem;
    });

    const res = NextResponse.json({ gallery: galleryWithUrls });
    res.headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
    return res;
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
