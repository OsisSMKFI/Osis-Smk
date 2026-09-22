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

    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = folder ? `${folder}/${timestamp}_${cleanFileName}` : `${timestamp}_${cleanFileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Always try Supabase upload — bucket may exist even if ensureBucket listing failed
    let uploadError: any = null;
    let uploadData: any = null;

    const result = await supabase.storage.from(bucket).upload(filePath, fileBuffer, {
      contentType: file.type,
      upsert: false,
    });
    uploadData = result.data;
    uploadError = result.error;

    // If Supabase upload failed → Vercel Blob fallback
    if (uploadError) {
      if (hasVercelBlob) {
        try {
          const blobResult = await uploadFile(filePath, fileBuffer, {
            access: 'public',
            contentType: file.type,
          });
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
          // Blob also failed
        }
      }
      // Both failed — return meaningful error
      const errMsg = uploadError?.message || 'Upload failed';
      return NextResponse.json({ error: errMsg }, { status: 500 });
    }

    // Supabase upload succeeded
    const signedUrlResult = await generateSignedUrl(uploadData.path, { bucket });
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: signedUrlResult?.url || publicUrl,
      publicUrl,
      signedUrl: signedUrlResult?.url,
      expiresAt: signedUrlResult?.expiresAt,
      bucket: signedUrlResult?.bucket || bucket,
      path: uploadData.path,
      data: {
        path: uploadData.path,
        publicUrl,
        signedUrl: signedUrlResult?.url,
        url: signedUrlResult?.url || publicUrl,
        expiresAt: signedUrlResult?.expiresAt,
        bucket: signedUrlResult?.bucket || bucket,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
