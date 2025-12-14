/**
 * Vercel Blob Upload API Route
 * Server-side file upload handler
 * 
 * Usage:
 * - POST /api/blob/upload - Upload a file
 * - DELETE /api/blob/delete - Delete a file
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, deleteFile, listFiles } from '@/lib/vercel/blob';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = formData.get('folder') as string || 'uploads';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-');
    const pathname = `${folder}/${timestamp}-${safeName}`;

    // Upload to Blob Store
    const result = await uploadFile(pathname, file, {
      access: 'public',
      contentType: file.type,
      addRandomSuffix: false,
    });

    return NextResponse.json({
      success: true,
      url: result.url,
      pathname: result.pathname,
      contentType: result.contentType,
    });
  } catch (error) {
    console.error('[Blob Upload] Error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL required' }, { status: 400 });
    }

    await deleteFile(url);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Blob Delete] Error:', error);
    return NextResponse.json(
      { error: 'Delete failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get('prefix') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100');

    const result = await listFiles({ prefix, limit });

    return NextResponse.json({
      success: true,
      files: result.blobs,
      hasMore: result.hasMore,
      cursor: result.cursor,
    });
  } catch (error) {
    console.error('[Blob List] Error:', error);
    return NextResponse.json(
      { error: 'List failed' },
      { status: 500 }
    );
  }
}
