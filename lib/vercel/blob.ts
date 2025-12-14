/**
 * Vercel Blob Store Integration
 * Fast, globally distributed file storage
 * 
 * Use for:
 * - Image uploads
 * - Document storage
 * - Video/audio files
 * - Any static assets
 * 
 * @see https://vercel.com/docs/storage/vercel-blob
 */

import { put, del, list, head, copy } from '@vercel/blob';

export { put, del, list, head, copy };

// ==========================================
// Helper Types
// ==========================================

export interface UploadResult {
  url: string;
  pathname: string;
  contentType: string;
  contentDisposition: string;
}

export interface BlobFile {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
  contentType?: string;
}

// ==========================================
// Upload Functions
// ==========================================

/**
 * Upload a file to Vercel Blob Store
 */
export async function uploadFile(
  filename: string,
  data: Buffer | Blob | ArrayBuffer | string | ReadableStream,
  options?: {
    access?: 'public';
    contentType?: string;
    addRandomSuffix?: boolean;
    cacheControlMaxAge?: number;
  }
): Promise<UploadResult> {
  const { url, pathname, contentType, contentDisposition } = await put(filename, data, {
    access: options?.access || 'public',
    contentType: options?.contentType,
    addRandomSuffix: options?.addRandomSuffix ?? true,
    cacheControlMaxAge: options?.cacheControlMaxAge,
  });

  return { url, pathname, contentType, contentDisposition };
}

/**
 * Upload an image with automatic optimization
 */
export async function uploadImage(
  filename: string,
  imageData: Buffer | Blob | ArrayBuffer,
  options?: {
    folder?: string;
    contentType?: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  }
): Promise<UploadResult> {
  const folder = options?.folder || 'images';
  const pathname = `${folder}/${filename}`;
  
  return uploadFile(pathname, imageData, {
    access: 'public',
    contentType: options?.contentType || 'image/jpeg',
    addRandomSuffix: true,
  });
}

/**
 * Upload a document (PDF, DOC, etc.)
 */
export async function uploadDocument(
  filename: string,
  data: Buffer | Blob | ArrayBuffer,
  contentType?: string
): Promise<UploadResult> {
  const pathname = `documents/${filename}`;
  
  return uploadFile(pathname, data, {
    access: 'public',
    contentType: contentType || 'application/pdf',
    addRandomSuffix: true,
  });
}

/**
 * Upload a video file
 */
export async function uploadVideo(
  filename: string,
  data: Buffer | Blob | ArrayBuffer | ReadableStream,
  contentType?: string
): Promise<UploadResult> {
  const pathname = `videos/${filename}`;
  
  return uploadFile(pathname, data, {
    access: 'public',
    contentType: contentType || 'video/mp4',
    addRandomSuffix: true,
    cacheControlMaxAge: 31536000, // 1 year cache for videos
  });
}

// ==========================================
// Management Functions
// ==========================================

/**
 * Delete a file from Blob Store
 */
export async function deleteFile(url: string): Promise<void> {
  await del(url);
}

/**
 * Delete multiple files
 */
export async function deleteFiles(urls: string[]): Promise<void> {
  await Promise.all(urls.map(url => del(url)));
}

/**
 * List files in a folder
 */
export async function listFiles(options?: {
  prefix?: string;
  limit?: number;
  cursor?: string;
}): Promise<{ blobs: BlobFile[]; cursor?: string; hasMore: boolean }> {
  const result = await list({
    prefix: options?.prefix,
    limit: options?.limit || 1000,
    cursor: options?.cursor,
  });

  const blobs: BlobFile[] = result.blobs.map(blob => ({
    url: blob.url,
    pathname: blob.pathname,
    size: blob.size,
    uploadedAt: blob.uploadedAt,
  }));

  return {
    blobs,
    cursor: result.cursor,
    hasMore: result.hasMore,
  };
}

/**
 * Get file metadata
 */
export async function getFileInfo(url: string): Promise<BlobFile | null> {
  try {
    const info = await head(url);
    return {
      url: info.url,
      pathname: info.pathname,
      size: info.size,
      uploadedAt: info.uploadedAt,
      contentType: info.contentType,
    };
  } catch {
    return null;
  }
}

/**
 * Copy a file to a new location
 */
export async function copyFile(
  sourceUrl: string,
  destinationPathname: string
): Promise<UploadResult> {
  const result = await copy(sourceUrl, destinationPathname, {
    access: 'public',
  });

  return {
    url: result.url,
    pathname: result.pathname,
    contentType: result.contentType,
    contentDisposition: result.contentDisposition,
  };
}

// ==========================================
// Folder Operations
// ==========================================

/**
 * List all files in a folder
 */
export async function listFolder(folderPath: string): Promise<BlobFile[]> {
  const allBlobs: BlobFile[] = [];
  let cursor: string | undefined;
  
  do {
    const result = await listFiles({ prefix: folderPath, cursor });
    allBlobs.push(...result.blobs);
    cursor = result.cursor;
  } while (cursor);

  return allBlobs;
}

/**
 * Delete all files in a folder
 */
export async function deleteFolder(folderPath: string): Promise<number> {
  const files = await listFolder(folderPath);
  await deleteFiles(files.map(f => f.url));
  return files.length;
}

/**
 * Get total size of files in a folder
 */
export async function getFolderSize(folderPath: string): Promise<number> {
  const files = await listFolder(folderPath);
  return files.reduce((total, file) => total + file.size, 0);
}

// ==========================================
// Utility Functions
// ==========================================

/**
 * Generate a unique filename with timestamp
 */
export function generateFilename(originalName: string, prefix?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = originalName.split('.').pop() || '';
  const baseName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '-');
  
  const parts = [prefix, baseName, timestamp, random].filter(Boolean);
  return `${parts.join('-')}.${ext}`;
}

/**
 * Check if a file exists
 */
export async function fileExists(url: string): Promise<boolean> {
  const info = await getFileInfo(url);
  return info !== null;
}

/**
 * Get file extension from URL
 */
export function getFileExtension(url: string): string {
  const pathname = new URL(url).pathname;
  return pathname.split('.').pop() || '';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
