import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { ensurePublicBucket } from '@/lib/supabase/ensureBucket';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

    const body = await request.json();
    const { fileName, bucket = 'gallery', folder = '', contentType = 'application/octet-stream' } = body;

    if (!fileName) {
      return NextResponse.json({ error: 'fileName is required' }, { status: 400 });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try to ensure bucket, but don't hard-fail — bucket may exist even if listing/verification fails
    const bucketReady = await ensurePublicBucket(supabase as any, bucket);
    if (!bucketReady) {
      console.warn(`[signed-url] ensurePublicBucket returned false for '${bucket}', attempting upload anyway`);
    }

    const timestamp = Date.now();
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = folder
      ? `${folder}/${timestamp}_${cleanFileName}`
      : `${timestamp}_${cleanFileName}`;

    // Try to create signed upload URL — may work even if ensureBucket failed
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(filePath);

    if (error) {
      console.error('[signed-url] Error creating signed URL:', error);
      return NextResponse.json({
        error: 'Failed to create upload URL',
        details: error.message
      }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      signedUrl: data.signedUrl,
      token: data.token,
      path: filePath,
      publicUrl,
      bucket,
      expiresIn: 3600,
    });

  } catch (error: any) {
    console.error('[signed-url] Error:', error);
    return NextResponse.json({
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}
