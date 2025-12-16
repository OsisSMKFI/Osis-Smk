import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Roles that can upload files
const UPLOAD_ALLOWED_ROLES = ['super_admin', 'admin', 'osis', 'moderator', 'editor'];

/**
 * Get a signed upload URL for direct client-to-Supabase upload
 * This bypasses the 4.5MB Vercel request body limit
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check role permission
    const userRole = ((session.user as any).role || '').toLowerCase();
    if (!UPLOAD_ALLOWED_ROLES.includes(userRole)) {
      return NextResponse.json({ 
        error: 'Forbidden - Role tidak memiliki izin upload',
        role: userRole
      }, { status: 403 });
    }

    const body = await request.json();
    const { fileName, bucket = 'gallery', folder = '', contentType = 'application/octet-stream' } = body;

    if (!fileName) {
      return NextResponse.json({ error: 'fileName is required' }, { status: 400 });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate file path
    const timestamp = Date.now();
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = folder 
      ? `${folder}/${timestamp}_${cleanFileName}`
      : `${timestamp}_${cleanFileName}`;

    // Create signed upload URL (valid for 1 hour)
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

    // Also get the public URL for after upload
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      signedUrl: data.signedUrl,
      token: data.token,
      path: filePath,
      publicUrl: publicUrl,
      bucket: bucket,
      expiresIn: 3600, // 1 hour
    });

  } catch (error: any) {
    console.error('[signed-url] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
