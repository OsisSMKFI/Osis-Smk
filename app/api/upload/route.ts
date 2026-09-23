import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { generateSignedUrl } from '@/lib/signedUrls';
import { uploadFile } from '@/lib/vercel/blob';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const hasVercelBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

const UPLOAD_ALLOWED_ROLES = ['super_admin', 'admin', 'osis', 'moderator', 'editor'];

async function ensureMediaBucket(supabase: any) {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some((b: any) => b.name === 'media');
    if (!exists) {
      await supabase.storage.createBucket('media', {
        public: true,
        fileSizeLimit: 104857600,
        allowedMimeTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'application/octet-stream'],
      });
      console.log('[Upload] Created media bucket with video MIME types');
    } else {
      // Update existing bucket to ensure video MIME types are allowed
      await supabase.storage.updateBucket('media', {
        public: true,
        fileSizeLimit: 104857600,
        allowedMimeTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'application/octet-stream'],
      });
    }
  } catch (e: any) {
    console.warn('[Upload] ensureMediaBucket warning:', e?.message);
  }
}

async function ensureBucketPublic(supabase: any, bucketName: string) {
  try {
    await supabase.storage.updateBucket(bucketName, { public: true });
  } catch (e) {
    // May lack permission or bucket doesn't exist — ignore
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = ((session.user as any).role || '').toLowerCase();
    if (!UPLOAD_ALLOWED_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden', role: userRole }, { status: 403 });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string || 'gallery';
    const folder = formData.get('folder') as string || '';

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const maxSize = 104857600;
    if (file.size > maxSize) {
      return NextResponse.json({ error: `File too large. Max 100MB. Yours: ${(file.size / 1048576).toFixed(2)}MB` }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const isVideo = file.type.startsWith('video/');

    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = folder ? `${folder}/${timestamp}_${cleanFileName}` : `${timestamp}_${cleanFileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // For videos, always try Vercel Blob first (Supabase buckets often reject video MIME types)
    // For images, also try Vercel Blob if Supabase fails
    if (hasVercelBlob) {
      try {
        console.log('[Upload] Trying Vercel Blob for:', filePath, 'type:', file.type);
        const blobResult = await uploadFile(filePath, fileBuffer, {
          access: 'public',
          contentType: file.type || 'application/octet-stream',
        });
        console.log('[Upload] Vercel Blob success:', blobResult.url);
        return NextResponse.json({
          success: true,
          url: blobResult.url,
          publicUrl: blobResult.url,
          signedUrl: blobResult.url,
          path: blobResult.pathname,
          storage: 'vercel-blob',
          data: { path: blobResult.pathname, publicUrl: blobResult.url, signedUrl: blobResult.url, url: blobResult.url },
        });
      } catch (blobError: any) {
        console.error('[Upload] Vercel Blob failed:', blobError.message);
        // Continue to Supabase fallback
      }
    }

    // For videos without Vercel Blob, try Supabase media bucket
    const targetBuckets = isVideo ? ['media', bucket] : [bucket];

    let uploadError: any = null;
    let uploadData: any = null;
    let usedBucket = bucket;

    if (isVideo) {
      await ensureMediaBucket(supabase);
    }

    // Ensure target bucket is public so images load correctly
    await ensureBucketPublic(supabase, bucket);

    for (const tryBucket of targetBuckets) {
      const result = await supabase.storage.from(tryBucket).upload(filePath, fileBuffer, {
        contentType: isVideo ? 'video/mp4' : file.type,
        upsert: false,
      });
      if (!result.error) {
        uploadData = result.data;
        usedBucket = tryBucket;
        uploadError = null;
        break;
      }
      uploadError = result.error;
      // If bucket doesn't exist or MIME type error, try next bucket
      if (result.error?.message?.includes('mime type') || result.error?.message?.includes('not found') || result.error?.message?.includes('does not exist')) {
        continue;
      }
      // Other errors — stop trying
      break;
    }

    // If all Supabase attempts failed
    if (uploadError) {
      // Helpful error for video uploads without Vercel Blob
      if (isVideo && !hasVercelBlob) {
        console.error('[Upload] Video upload failed: BLOB_READ_WRITE_TOKEN not set');
        return NextResponse.json({
          error: 'Video upload gagal. Vercel Blob belum dikonfigurasi.',
          help: 'Buka Vercel Dashboard → Project → Settings → Environment Variables → tambah BLOB_READ_WRITE_TOKEN dari Blob store. Lalu redeploy.',
        }, { status: 500 });
      }
      const errMsg = uploadError?.message || 'Upload failed';
      console.error('[Upload] Supabase upload error:', errMsg);
      return NextResponse.json({ error: errMsg }, { status: 500 });
    }

    // Supabase upload succeeded
    const { data: { publicUrl } } = supabase.storage.from(usedBucket).getPublicUrl(filePath);

    let signedUrlResult: any = null;
    try {
      signedUrlResult = await generateSignedUrl(uploadData.path, { bucket: usedBucket });
    } catch (e) {
      // Signed URL generation may fail for some buckets — publicUrl is enough
    }

    return NextResponse.json({
      success: true,
      url: publicUrl || signedUrlResult?.url,
      publicUrl,
      signedUrl: signedUrlResult?.url,
      expiresAt: signedUrlResult?.expiresAt,
      bucket: usedBucket,
      path: uploadData.path,
      data: {
        path: uploadData.path,
        publicUrl,
        signedUrl: signedUrlResult?.url,
        url: publicUrl || signedUrlResult?.url,
        expiresAt: signedUrlResult?.expiresAt,
        bucket: usedBucket,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
