import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { generateSignedUrl } from '@/lib/signedUrls';
import { uploadFile } from '@/lib/vercel/blob';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Check if Vercel Blob is configured
const hasVercelBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

// Roles that can upload files
const UPLOAD_ALLOWED_ROLES = ['super_admin', 'admin', 'osis', 'moderator', 'editor'];

// Auto-create bucket if it doesn't exist
async function ensureBucket(supabase: any, bucketName: string) {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some((b: any) => b.id === bucketName || b.name === bucketName);
    
    if (!exists) {
      console.log(`[/api/upload] Creating bucket: ${bucketName}`);
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: bucketName === 'backgrounds' ? 10485760 : 104857600, // 10MB for backgrounds, 100MB for others
        // Allow ALL file types - no restriction
      });
      
      if (createError) {
        console.error(`[/api/upload] Failed to create bucket ${bucketName}:`, createError);
        return false;
      }
      console.log(`[/api/upload] Bucket ${bucketName} created successfully`);
    } else {
      // Bucket exists - try to update settings (no MIME restriction)
      console.log(`[/api/upload] Bucket ${bucketName} exists, attempting to update settings`);
      const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
        public: true,
        fileSizeLimit: bucketName === 'backgrounds' ? 10485760 : 104857600,
        // Remove allowedMimeTypes to allow ALL file types
      });
      
      if (updateError) {
        console.warn(`[/api/upload] Could not update bucket settings:`, updateError);
        // Don't fail - bucket might have restrictions, try upload anyway
      } else {
        console.log(`[/api/upload] ✅ Bucket ${bucketName} settings updated`);
      }
    }
    return true;
  } catch (error) {
    console.error(`[/api/upload] Error checking/creating bucket:`, error);
    return false;
  }
}

// Direct upload endpoint (uses same logic as admin upload)
export async function POST(request: NextRequest) {
  const isDev = process.env.NODE_ENV !== 'production';
  try {
    if (isDev) console.log('[/api/upload] Upload request started');
    const session = await auth();
    
    if (!session?.user) {
      console.error('[/api/upload] No session or user found');
      return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 });
    }

    // Check role permission for upload
    const userRole = ((session.user as any).role || '').toLowerCase();
    if (!UPLOAD_ALLOWED_ROLES.includes(userRole)) {
      console.error('[/api/upload] User role not allowed to upload:', userRole);
      return NextResponse.json({ 
        error: 'Forbidden - Role tidak memiliki izin upload', 
        role: userRole,
        allowedRoles: UPLOAD_ALLOWED_ROLES 
      }, { status: 403 });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[/api/upload] Missing Supabase credentials');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    let formData;
    try {
      formData = await request.formData();
    } catch (formError) {
      console.error('[/api/upload] FormData parsing failed:', formError);
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
    }

    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string || 'gallery';
    const folder = formData.get('folder') as string || '';

    if (isDev) {
      console.log('[/api/upload] Upload params:', { fileName: file?.name, bucket, folder, userRole });
    }

    if (!file) {
      console.error('[/api/upload] No file in formData');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Allow ALL file types - no MIME type restriction
    // Just check that file has some content
    if (file.size === 0) {
      console.error('[/api/upload] File is empty');
      return NextResponse.json({ error: 'File is empty' }, { status: 400 });
    }

    // Max file size: 100MB
    const maxSize = 104857600; // 100MB
    if (file.size > maxSize) {
      console.error('[/api/upload] File too large:', file.size);
      return NextResponse.json({ 
        error: `File too large. Maximum size is 100MB. Your file: ${(file.size / 1048576).toFixed(2)}MB` 
      }, { status: 400 });
    }

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Ensure bucket exists
    const bucketReady = await ensureBucket(supabase, bucket);
    if (!bucketReady) {
      return NextResponse.json({ 
        error: `Bucket '${bucket}' not available. Please create it in Supabase Storage.` 
      }, { status: 500 });
    }

    // Generate file path
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = folder 
      ? `${folder}/${timestamp}_${cleanFileName}`
      : `${timestamp}_${cleanFileName}`;

    // Upload file
    let arrayBuffer;
    try {
      arrayBuffer = await file.arrayBuffer();
    } catch (bufferError) {
      console.error('[/api/upload] Failed to read file buffer:', bufferError);
      return NextResponse.json({ error: 'Failed to read file data' }, { status: 500 });
    }

    const fileBuffer = Buffer.from(arrayBuffer);

    if (isDev) {
      console.log('[/api/upload] Uploading to:', { bucket, filePath });
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      // Check if it's a storage quota error - try Vercel Blob as fallback
      const isQuotaError = error.message?.toLowerCase().includes('storage') || 
                           error.message?.toLowerCase().includes('quota') ||
                           error.message?.toLowerCase().includes('limit') ||
                           error.message?.toLowerCase().includes('full');
      
      if (isQuotaError && hasVercelBlob) {
        console.log('[/api/upload] Supabase storage error, trying Vercel Blob fallback...');
        try {
          const blobResult = await uploadFile(filePath, fileBuffer, {
            access: 'public',
            contentType: file.type,
          });
          
          console.log('[/api/upload] ✅ Vercel Blob fallback success');
          return NextResponse.json({
            success: true,
            url: blobResult.url,
            publicUrl: blobResult.url,
            path: blobResult.pathname,
            storage: 'vercel-blob',
            data: {
              path: blobResult.pathname,
              publicUrl: blobResult.url,
              url: blobResult.url,
            },
          });
        } catch (blobError: any) {
          console.error('[/api/upload] Vercel Blob fallback also failed:', blobError);
        }
      }
      
      console.error('[/api/upload] Upload error:', error);
      return NextResponse.json({ 
        error: error.message || 'Upload failed',
        details: error 
      }, { status: 500 });
    }

    if (isDev) console.log('[/api/upload] ✅ Upload success');

    // Generate signed URL for the uploaded file
    const signedUrlResult = await generateSignedUrl(data.path, { bucket });
    
    if (!signedUrlResult) {
      console.warn('[/api/upload] Failed to generate signed URL, falling back to public URL');
      // Fallback to public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return NextResponse.json({
        success: true,
        url: publicUrl,
        publicUrl: publicUrl,
        path: data.path,
        data: {
          path: data.path,
          publicUrl,
          url: publicUrl,
        },
      });
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[/api/upload] \u2705 Signed URL generated');
    }

    // Get public URL as fallback for storage
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: signedUrlResult.url,
      publicUrl: publicUrl,  // Add publicUrl for compatibility
      signedUrl: signedUrlResult.url,
      expiresAt: signedUrlResult.expiresAt,
      bucket: signedUrlResult.bucket,
      path: data.path,
      data: {
        path: data.path,
        publicUrl,
        signedUrl: signedUrlResult.url,
        url: signedUrlResult.url,
        expiresAt: signedUrlResult.expiresAt,
        bucket: signedUrlResult.bucket
      },
    });
  } catch (error: any) {
    console.error('[/api/upload] ===== UNEXPECTED ERROR =====');
    console.error('[/api/upload] Error type:', error?.constructor?.name);
    console.error('[/api/upload] Error message:', error?.message);
    console.error('[/api/upload] Error stack:', error?.stack);
    return NextResponse.json({ 
      error: error.message || 'Upload failed',
      errorType: error?.constructor?.name || 'Unknown',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
