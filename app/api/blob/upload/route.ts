// app/api/blob/upload/route.ts
/**
 * Unified File Upload API - Vercel Blob Primary
 * 
 * Features:
 * - Auto-organized folder structure by type and date
 * - Automatic file categorization
 * - Optimized for Vercel Edge network
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadFile, generateFilename } from '@/lib/vercel/blob';

export const runtime = 'nodejs';

// File type categories for auto-organization
const FILE_CATEGORIES = {
  // Images
  'image/jpeg': 'images',
  'image/jpg': 'images',
  'image/png': 'images',
  'image/webp': 'images',
  'image/gif': 'images',
  'image/svg+xml': 'images',
  'image/bmp': 'images',
  
  // Videos
  'video/mp4': 'videos',
  'video/webm': 'videos',
  'video/ogg': 'videos',
  'video/quicktime': 'videos',
  'video/x-msvideo': 'videos',
  'video/x-matroska': 'videos',
  
  // Documents
  'application/pdf': 'documents',
  'application/msword': 'documents',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'documents',
  'application/vnd.ms-excel': 'documents',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'documents',
  
  // Audio
  'audio/mpeg': 'audio',
  'audio/wav': 'audio',
  'audio/ogg': 'audio',
  'audio/webm': 'audio',
} as const;

// Sub-categories for more specific organization
const FOLDER_PURPOSES = {
  'gallery': 'gallery',
  'profile': 'users/profiles',
  'avatar': 'users/avatars',
  'attendance': 'attendance/selfies',
  'enrollment': 'enrollment/photos',
  'events': 'events/media',
  'posts': 'content/posts',
  'announcements': 'content/announcements',
  'backgrounds': 'system/backgrounds',
  'logos': 'system/logos',
  'documents': 'documents',
  'general': 'uploads',
} as const;

/**
 * Get organized folder path based on file type and purpose
 */
function getOrganizedPath(
  mimeType: string,
  purpose: string = 'general',
  userId?: string
): string {
  // Get base category from mime type
  const category = FILE_CATEGORIES[mimeType as keyof typeof FILE_CATEGORIES] || 'misc';
  
  // Get purpose folder
  const purposeFolder = FOLDER_PURPOSES[purpose as keyof typeof FOLDER_PURPOSES] || 'uploads';
  
  // Add date-based organization (YYYY/MM)
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const dateFolder = `${year}/${month}`;
  
  // Build path: category/purpose/date/[userId]/
  const parts = [category, purposeFolder, dateFolder];
  
  // Add user-specific folder for personal uploads
  if (userId && ['profile', 'avatar', 'attendance', 'enrollment'].includes(purpose)) {
    parts.push(userId.substring(0, 8)); // Use first 8 chars of userId
  }
  
  return parts.join('/');
}

export async function POST(request: NextRequest) {
  try {
    // Check for BLOB token
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('[Blob Upload] Missing BLOB_READ_WRITE_TOKEN');
      return NextResponse.json({
        error: 'Storage not configured. Please add BLOB_READ_WRITE_TOKEN to environment.',
        code: 'BLOB_NOT_CONFIGURED'
      }, { status: 500 });
    }

    // Auth check
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any)?.id;

    // Parse form data
    let formData;
    try {
      formData = await request.formData();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
    }

    const file = formData.get('file') as File;
    const purpose = (formData.get('purpose') as string) || (formData.get('bucket') as string) || 'general';
    const customFolder = formData.get('folder') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = Object.keys(FILE_CATEGORIES);
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json({
        error: `Unsupported file type: ${file.type}`,
        allowedTypes: [...new Set(Object.values(FILE_CATEGORIES))]
      }, { status: 400 });
    }

    // Size limits
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
    const MAX_DOC_SIZE = 25 * 1024 * 1024; // 25MB

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    const maxSize = isVideo ? MAX_VIDEO_SIZE : isImage ? MAX_IMAGE_SIZE : MAX_DOC_SIZE;

    if (file.size > maxSize) {
      return NextResponse.json({
        error: `File too large. Max size: ${Math.round(maxSize / (1024 * 1024))}MB`,
        maxSize,
        fileSize: file.size
      }, { status: 400 });
    }

    // Generate organized path
    const folderPath = customFolder || getOrganizedPath(file.type, purpose, userId);
    const filename = generateFilename(file.name, purpose);
    const fullPath = `${folderPath}/${filename}`;

    console.log('[Blob Upload] Uploading:', {
      originalName: file.name,
      path: fullPath,
      size: file.size,
      type: file.type,
      purpose
    });

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Vercel Blob
    const result = await uploadFile(fullPath, buffer, {
      access: 'public',
      contentType: file.type,
      addRandomSuffix: false, // We already have unique names
      cacheControlMaxAge: isVideo ? 31536000 : 86400, // 1 year for videos, 1 day for others
    });

    console.log('[Blob Upload] ✅ Success:', result.url);

    return NextResponse.json({
      success: true,
      url: result.url,
      publicUrl: result.url,
      pathname: result.pathname,
      contentType: result.contentType,
      data: {
        url: result.url,
        path: result.pathname,
        contentType: result.contentType,
        size: file.size,
        originalName: file.name,
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('[Blob Upload] Error:', error);
    return NextResponse.json({
      error: error.message || 'Upload failed',
      code: 'UPLOAD_ERROR'
    }, { status: 500 });
  }
}

/**
 * GET - List files in a folder
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get('prefix') || '';
    const limit = parseInt(searchParams.get('limit') || '100');

    const { list } = await import('@vercel/blob');
    const result = await list({ prefix, limit });

    return NextResponse.json({
      success: true,
      files: result.blobs.map(blob => ({
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
      })),
      hasMore: result.hasMore,
      cursor: result.cursor
    });

  } catch (error: any) {
    console.error('[Blob List] Error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to list files'
    }, { status: 500 });
  }
}

/**
 * DELETE - Remove a file
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    const userRole = ((session?.user as any)?.role || '').toLowerCase();
    
    // Only admins can delete files
    if (!['admin', 'super_admin', 'osis'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 });
    }

    const { del } = await import('@vercel/blob');
    await del(url);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error: any) {
    console.error('[Blob Delete] Error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to delete file'
    }, { status: 500 });
  }
}
