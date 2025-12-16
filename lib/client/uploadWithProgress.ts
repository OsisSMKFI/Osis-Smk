import { smartUpload, DirectUploadResult } from './directUpload';

export type UploadResult = { status: number; json: any };

/**
 * Smart upload with progress - uses direct upload for large files (>3MB)
 * to bypass Vercel's 4.5MB request body limit
 */
export async function uploadWithProgressSmart(
  file: File,
  bucket: string,
  folder: string,
  onProgress: (percent: number) => void
): Promise<UploadResult> {
  try {
    console.log('[uploadWithProgressSmart] Starting smart upload:', {
      fileName: file.name,
      fileSize: file.size,
      bucket,
      folder
    });

    const result = await smartUpload(file, {
      bucket,
      folder,
      onProgress,
    });

    if (result.success) {
      return {
        status: 200,
        json: {
          success: true,
          url: result.url,
          publicUrl: result.publicUrl,
          path: result.path,
        }
      };
    } else {
      return {
        status: 500,
        json: {
          success: false,
          error: result.error,
        }
      };
    }
  } catch (e: any) {
    console.error('[uploadWithProgressSmart] Error:', e);
    return {
      status: 500,
      json: {
        success: false,
        error: e.message || 'Upload failed',
      }
    };
  }
}

/**
 * Legacy upload function - still uses XHR for backwards compatibility
 * Note: This may fail for files > 4.5MB on Vercel
 * Consider using uploadWithProgressSmart instead
 */
export function uploadWithProgress(
  url: string,
  formData: FormData,
  onProgress: (percent: number) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    try {
      // Check if file is large, warn about potential issues
      const file = formData.get('file') as File;
      if (file && file.size > 3 * 1024 * 1024) {
        console.warn('[uploadWithProgress] File is large, consider using uploadWithProgressSmart for better reliability');
      }

      console.log('[uploadWithProgress] Starting upload to:', url);
      console.log('[uploadWithProgress] FormData entries:');
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: File(${value.name}, ${value.type}, ${value.size} bytes)`);
        } else {
          console.log(`  ${key}:`, value);
        }
      }

      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      // Include cookies for same-origin auth routes
      xhr.withCredentials = true;

      xhr.upload.onprogress = (event: ProgressEvent<EventTarget>) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          console.log('[uploadWithProgress] Response received:', {
            status: xhr.status,
            statusText: xhr.statusText,
            responseText: xhr.responseText.substring(0, 500)
          });
          
          // Handle 413 specifically
          if (xhr.status === 413) {
            console.error('[uploadWithProgress] File too large for server (413)');
            resolve({
              status: 413,
              json: {
                success: false,
                error: 'File terlalu besar. Gunakan file dengan ukuran lebih kecil atau kompres terlebih dahulu.',
              }
            });
            return;
          }
          
          let parsed: any = null;
          try { 
            parsed = JSON.parse(xhr.responseText); 
            console.log('[uploadWithProgress] Parsed response:', parsed);
          } catch (e) {
            console.error('[uploadWithProgress] Failed to parse response:', e);
          }
          resolve({ status: xhr.status, json: parsed });
        }
      };

      xhr.onerror = () => {
        console.error('[uploadWithProgress] XHR network error');
        reject(new Error('Network error while uploading'));
      };
      
      console.log('[uploadWithProgress] Sending request...');
      xhr.send(formData);
    } catch (e) {
      console.error('[uploadWithProgress] Exception:', e);
      reject(e);
    }
  });
}

