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
          signedUrl: result.url,
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
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.withCredentials = true;

      xhr.upload.onprogress = (event: ProgressEvent<EventTarget>) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status === 413) {
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
          try { parsed = JSON.parse(xhr.responseText); } catch {}
          resolve({ status: xhr.status, json: parsed });
        }
      };

      xhr.onerror = () => reject(new Error('Network error while uploading'));
      xhr.send(formData);
    } catch (e) {
      reject(e);
    }
  });
}
