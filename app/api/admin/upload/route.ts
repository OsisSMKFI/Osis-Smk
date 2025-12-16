import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { generateSignedUrl } from '@/lib/signedUrls';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Roles that can upload files
const UPLOAD_ALLOWED_ROLES = ['super_admin', 'admin', 'osis', 'moderator', 'editor'];

// Auto-create bucket if it doesn't exist
async function ensureBucket(supabase: any, bucketName: string) {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some((b: any) => b.id === bucketName || b.name === bucketName);
    
    if (!exists) {
      console.log(`[/api/admin/upload] Creating bucket: ${bucketName}`);
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: bucketName === 'backgrounds' ? 10485760 : 104857600, // 10MB backgrounds, 100MB others
        // No MIME type restriction - allow ALL file types
      });
      
      if (createError) {
        console.error(`[/api/admin/upload] Failed to create bucket ${bucketName}:`, createError);
        return false;
      }
      console.log(`[/api/admin/upload] Bucket ${bucketName} created successfully`);
    } else {
      // Update bucket to remove MIME restrictions
      await supabase.storage.updateBucket(bucketName, {
        public: true,
        fileSizeLimit: bucketName === 'backgrounds' ? 10485760 : 104857600,
      });
    }
    return true;
  } catch (error) {
    console.error(`[/api/admin/upload] Error checking/creating bucket:`, error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    console.log('[/api/admin/upload] Session check:', { hasSession: !!session, hasUser: !!session?.user, userEmail: session?.user?.email });
    
    if (!session?.user) {
      console.error('[/api/admin/upload] No session or user found');
      return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 });
    }

    // Check role permission for upload
    const userRole = ((session.user as any).role || '').toLowerCase();
    console.log('[/api/admin/upload] User role:', userRole);
    
    if (!UPLOAD_ALLOWED_ROLES.includes(userRole)) {
      console.error('[/api/admin/upload] User role not allowed to upload:', userRole);
      return NextResponse.json({ 
        error: 'Forbidden - Role tidak memiliki izin upload', 
        role: userRole,
        allowedRoles: UPLOAD_ALLOWED_ROLES 
      }, { status: 403 });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[/api/admin/upload] Missing Supabase credentials');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string || 'gallery';
    const folder = formData.get('folder') as string || '';

    console.log('[/api/admin/upload] Upload params:', { fileName: file?.name, bucket, folder, fileSize: file?.size, userRole });

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Allow ALL file types - no MIME restriction
    // Just validate file is not empty and not too large
    if (file.size === 0) {
      return NextResponse.json({ error: 'File is empty' }, { status: 400 });
    }

    const maxSize = 104857600; // 100MB
    if (file.size > maxSize) {
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
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    console.log('[/api/admin/upload] Uploading to:', { bucket, filePath, size: fileBuffer.length });

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (error) {
      console.error('[/api/admin/upload] Upload error:', error);
      return NextResponse.json({ 
        error: error.message || 'Upload failed',
        details: error
      }, { status: 500 });
    }

    console.log('[/api/admin/upload] Upload success:', data);

    // Generate signed URL for the uploaded file
    const signedUrlResult = await generateSignedUrl(data.path, { bucket });
    
    if (!signedUrlResult) {
      console.warn('[/api/admin/upload] Failed to generate signed URL, falling back to public URL');
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

    console.log('[/api/admin/upload] ✅ Signed URL generated:', {
      bucket: signedUrlResult.bucket,
      expiresAt: signedUrlResult.expiresAt
    });

    // Get public URL for storage in database
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: signedUrlResult.url,      // Client gets signed URL
      publicUrl: publicUrl,          // Public URL for database storage
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
    console.error('[/api/admin/upload] Unexpected error:', error);
    return NextResponse.json({ 
      error: error.message || 'Upload failed',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const bucket = searchParams.get('bucket') || 'gallery';

    if (!path) {
      return NextResponse.json({ error: 'Path required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'File deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const bucket = searchParams.get('bucket') || 'gallery';

    if (!path) {
      return NextResponse.json({ error: 'Path required' }, { status: 400 });
    }

    // Generate signed URL instead of public URL
    const signedUrlResult = await generateSignedUrl(path, { bucket });
    
    if (!signedUrlResult) {
      // Fallback to public URL if signed URL generation fails
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return NextResponse.json({
        success: true,
        url: publicUrl,
        publicUrl,
      });
    }

    return NextResponse.json({
      success: true,
      url: signedUrlResult.url,
      signedUrl: signedUrlResult.url,
      expiresAt: signedUrlResult.expiresAt,
      bucket: signedUrlResult.bucket
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
