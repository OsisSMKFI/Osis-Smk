/**
 * Direct upload to Supabase Storage using signed URL
 * Bypasses Vercel's 4.5MB request body limit
 */

export interface DirectUploadResult {
  success: boolean;
  url: string;
  publicUrl: string;
  path: string;
  error?: string;
}

export interface DirectUploadOptions {
  bucket?: string;
  folder?: string;
  onProgress?: (percent: number) => void;
}

/**
 * Upload file directly to Supabase using signed URL
 * Supports files up to 50MB (Supabase limit)
 */
export async function directUploadToSupabase(
  file: File,
  options: DirectUploadOptions = {}
): Promise<DirectUploadResult> {
  const { bucket = 'gallery', folder = '', onProgress } = options;

  try {
    // Step 1: Get signed upload URL from our API
    const signedUrlRes = await fetch('/api/upload/signed-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        fileName: file.name,
        bucket,
        folder,
        contentType: file.type,
      }),
    });

    if (!signedUrlRes.ok) {
      const errorData = await signedUrlRes.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to get upload URL: ${signedUrlRes.status}`);
    }

    const { signedUrl, path, publicUrl } = await signedUrlRes.json();

    // Step 2: Upload directly to Supabase using signed URL
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', signedUrl, true);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

      if (onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            success: true,
            url: publicUrl,
            publicUrl,
            path,
          });
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error during upload'));
      };

      xhr.send(file);
    });

  } catch (error: any) {
    return {
      success: false,
      url: '',
      publicUrl: '',
      path: '',
      error: error.message,
    };
  }
}

/**
 * Smart upload - tries direct upload first, falls back to API route for small files
 */
export async function smartUpload(
  file: File,
  options: DirectUploadOptions = {}
): Promise<DirectUploadResult> {
  const { bucket = 'gallery', folder = '', onProgress } = options;
  
  // For files > 3MB, try direct upload first (avoids Vercel 4.5MB limit)
  const DIRECT_UPLOAD_THRESHOLD = 3 * 1024 * 1024; // 3MB
  
  if (file.size > DIRECT_UPLOAD_THRESHOLD) {
    const result = await directUploadToSupabase(file, options);
    if (result.success) return result;
  }
  
  // API route fallback (works for files up to ~100MB via Supabase SDK, or Vercel Blob fallback)
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bucket', bucket);
  formData.append('folder', folder);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload', true);
    xhr.withCredentials = true;

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      try {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && response.success) {
          resolve({
            success: true,
            url: response.url || response.publicUrl,
            publicUrl: response.publicUrl || response.url,
            path: response.path,
          });
        } else {
          reject(new Error(response.error || `Upload failed: ${xhr.status}`));
        }
      } catch (e) {
        reject(new Error(`Failed to parse response: ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(formData);
  });
}
