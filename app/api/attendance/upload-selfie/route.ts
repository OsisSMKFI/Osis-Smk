import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadFileWithSignedUrl } from '@/lib/signedUrls';

// Check if Vercel Blob is available
const useVercelBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing file or userId' },
        { status: 400 }
      );
    }

    // Verify user is uploading their own photo
    if (session.user.id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot upload for other users' },
        { status: 403 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ===== PRIMARY: Use Vercel Blob if available =====
    if (useVercelBlob) {
      try {
        const { uploadFile, generateFilename } = await import('@/lib/vercel/blob');
        
        // Organize by date: attendance/selfies/YYYY/MM/userId/filename
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const filename = generateFilename(file.name || 'selfie.jpg', 'selfie');
        const fullPath = `attendance/selfies/${year}/${month}/${userId.substring(0, 8)}/${filename}`;
        
        const result = await uploadFile(fullPath, buffer, {
          access: 'public',
          contentType: file.type || 'image/jpeg',
          addRandomSuffix: false,
          cacheControlMaxAge: 31536000, // 1 year cache
        });

        console.log('[Upload Selfie] ✅ Vercel Blob upload:', {
          path: result.pathname,
          url: result.url.substring(0, 50) + '...'
        });

        return NextResponse.json({
          success: true,
          url: result.url,
          publicUrl: result.url,
          path: result.pathname,
          storage: 'vercel-blob'
        });
      } catch (blobError: any) {
        console.error('[Upload Selfie] Vercel Blob failed, falling back to Supabase:', blobError.message);
        // Fall through to Supabase
      }
    }

    // ===== FALLBACK: Supabase Storage =====
    const result = await uploadFileWithSignedUrl(buffer, userId, {
      type: 'selfie',
      bucket: 'user-photos',
      contentType: file.type || 'image/jpeg',
      fileName: `selfie_${Date.now()}.jpg`
    });

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Upload failed' },
        { status: 500 }
      );
    }

    console.log('[Upload Selfie] ✅ Supabase upload:', {
      path: result.path,
      expiresAt: result.expiresAt
    });

    return NextResponse.json({
      success: true,
      url: result.signedUrl,
      publicUrl: result.url,
      path: result.path,
      expiresAt: result.expiresAt,
      bucket: result.bucket,
      storage: 'supabase'
    });
  } catch (error: any) {
    console.error('Upload selfie error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
