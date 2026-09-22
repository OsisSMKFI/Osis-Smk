import { supabaseAdmin } from './server';

export const GALLERY_BUCKET = 'gallery';

/**
 * Upload file to Supabase Storage
 * @param file File to upload
 * @param folder Optional folder path (e.g., 'events', 'members')
 * @returns Public URL of uploaded file
 */
export async function uploadToStorage(
  file: File,
  folder: string = ''
): Promise<{ url: string; path: string } | { error: string }> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    const { data, error } = await supabaseAdmin.storage
      .from(GALLERY_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return { error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(GALLERY_BUCKET)
      .getPublicUrl(data.path);

    return {
      url: publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return { error: String(error) };
  }
}

/**
 * Delete file from Supabase Storage
 * @param path File path in storage
 * @param bucket Optional bucket name (default: gallery)
 */
export async function deleteFromStorage(path: string, bucket: string = GALLERY_BUCKET): Promise<{ error?: string }> {
  try {
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Storage delete error:', error);
      return { error: error.message };
    }

    return {};
  } catch (error) {
    console.error('Delete error:', error);
    return { error: String(error) };
  }
}

/**
 * Extract storage path from public URL
 * @param url Public URL from Supabase Storage
 * @returns Path in storage or null if not a valid storage URL
 */
export function extractStoragePath(url: string): string | null {
  try {
    // Expected format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
    const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Get public URL for a file in storage
 * @param path File path in storage
 */
export function getPublicUrl(path: string): string {
  const { data } = supabaseAdmin.storage
    .from(GALLERY_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

// =============================================================================
// STORAGE VALIDATION & PROTECTION
// =============================================================================

// Current Supabase project ID — derived from env or fallback
export const CURRENT_SUPABASE_PROJECT = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (url) {
    try { return new URL(url).hostname.split('.')[0]; } catch { /* fallback */ }
  }
  return 'mhefqwregrldvxtqqxbb';
})();
export const CURRENT_STORAGE_BASE_URL = `https://${CURRENT_SUPABASE_PROJECT}.supabase.co/storage/v1/object/public`;

// Track all known deprecated Supabase projects
export const DEPRECATED_PROJECTS = [
  'eilrnslorvfrtwjwvbaw',  // Old project - deleted
];

/**
 * Validate if a URL points to current active Supabase storage
 */
export function isValidStorageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  
  // Check if it's a Supabase URL
  if (!url.includes('supabase.co/storage/')) {
    // Local URLs are valid
    if (url.startsWith('/images/') || url.startsWith('/icons/')) {
      return true;
    }
    // External URLs (unsplash, etc.) - consider valid
    if (url.startsWith('https://')) {
      return true;
    }
    return false;
  }
  
  // Check if it uses deprecated project
  for (const deprecated of DEPRECATED_PROJECTS) {
    if (url.includes(deprecated)) {
      console.warn(`[Storage] ⚠️ URL uses deprecated project: ${deprecated}`);
      return false;
    }
  }
  
  // Check if it uses current project
  if (url.includes(CURRENT_SUPABASE_PROJECT)) {
    return true;
  }
  
  return false;
}

/**
 * Migrate a URL from old project to new project (if file exists)
 * Note: This only changes the domain, the file must exist in new storage
 */
export function migrateStorageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  for (const deprecated of DEPRECATED_PROJECTS) {
    if (url.includes(deprecated)) {
      // Try to migrate - replace old domain with new
      const migratedUrl = url.replace(deprecated, CURRENT_SUPABASE_PROJECT);
      console.log(`[Storage] 🔄 Migrating URL from ${deprecated} to ${CURRENT_SUPABASE_PROJECT}`);
      return migratedUrl;
    }
  }
  
  return url;
}

/**
 * Verify a storage URL is accessible
 */
export async function verifyStorageUrl(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, { 
      method: 'HEAD',
      signal: controller.signal 
    });
    
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Safe upload with validation - ensures file is uploaded to current project
 */
export async function safeUploadToStorage(
  file: File,
  folder: string = ''
): Promise<{ url: string; path: string; verified: boolean } | { error: string }> {
  const result = await uploadToStorage(file, folder);
  
  if ('error' in result) {
    return result;
  }
  
  // Verify the URL is using current project
  if (!isValidStorageUrl(result.url)) {
    console.error('[Storage] ❌ Upload resulted in invalid URL:', result.url);
    return { error: 'Upload resulted in invalid storage URL' };
  }
  
  // Optionally verify file is accessible
  const verified = await verifyStorageUrl(result.url);
  
  return {
    url: result.url,
    path: result.path,
    verified
  };
}

/**
 * Log storage operation for audit trail
 */
export async function logStorageOperation(
  operation: 'upload' | 'delete' | 'migrate',
  details: { path?: string; url?: string; table?: string; recordId?: number | string; success: boolean; error?: string }
): Promise<void> {
  try {
    // Log to console for now - could be extended to database logging
    const logEntry = {
      timestamp: new Date().toISOString(),
      operation,
      ...details
    };
    
    if (details.success) {
      console.log(`[Storage] ✅ ${operation}:`, logEntry);
    } else {
      console.error(`[Storage] ❌ ${operation} failed:`, logEntry);
    }
    
    // Could add database logging here:
    // await supabaseAdmin.from('storage_logs').insert(logEntry);
  } catch (e) {
    // Silent fail for logging
  }
}

