// app/api/enroll/upload-photo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { uploadFileWithSignedUrl } from '@/lib/signedUrls';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Check if Vercel Blob is available
const useVercelBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

/**
 * POST /api/enroll/upload-photo
 * Upload verified face anchor photo to storage with signed URL
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const formData = await request.formData();
    const photo = formData.get('photo') as File;
    
    if (!photo) {
      return NextResponse.json(
        { success: false, error: 'Photo required' },
        { status: 400 }
      );
    }
    
    console.log('[Upload Face Anchor] User:', userId);
    
    // Convert to buffer
    const arrayBuffer = await photo.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let photoUrl: string;
    let storageType = 'supabase';
    
    // ===== PRIMARY: Use Vercel Blob if available =====
    if (useVercelBlob) {
      try {
        const { uploadFile, generateFilename } = await import('@/lib/vercel/blob');
        
        // Organize: enrollment/photos/YYYY/MM/userId/filename
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const filename = generateFilename(photo.name || 'anchor.jpg', 'anchor');
        const fullPath = `enrollment/photos/${year}/${month}/${userId.substring(0, 8)}/${filename}`;
        
        const result = await uploadFile(fullPath, buffer, {
          access: 'public',
          contentType: photo.type || 'image/jpeg',
          addRandomSuffix: false,
          cacheControlMaxAge: 31536000, // 1 year cache
        });

        photoUrl = result.url;
        storageType = 'vercel-blob';
        console.log('[Upload Face Anchor] ✅ Vercel Blob:', result.url.substring(0, 50) + '...');
      } catch (blobError: any) {
        console.error('[Upload Face Anchor] Vercel Blob failed, falling back to Supabase:', blobError.message);
        // Fall through to Supabase
        const result = await uploadFileWithSignedUrl(buffer, userId, {
          type: 'reference',
          bucket: 'biometric-data',
          contentType: photo.type || 'image/jpeg',
          fileName: `${userId}_anchor_${Date.now()}.jpg`
        });
        
        if (!result) throw new Error('Upload failed');
        photoUrl = result.url;
      }
    } else {
      // ===== FALLBACK: Supabase Storage =====
      const result = await uploadFileWithSignedUrl(buffer, userId, {
        type: 'reference',
        bucket: 'biometric-data',
        contentType: photo.type || 'image/jpeg',
        fileName: `${userId}_anchor_${Date.now()}.jpg`
      });
      
      if (!result) throw new Error('Upload failed');
      photoUrl = result.url;
    }
    
    // Check if biometric_data exists
    const { data: existingBiometric } = await supabaseAdmin
      .from('biometric_data')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (existingBiometric) {
      // Update existing
      await supabaseAdmin
        .from('biometric_data')
        .update({
          reference_photo_url: photoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
    } else {
      // Insert new
      await supabaseAdmin
        .from('biometric_data')
        .insert({
          user_id: userId,
          reference_photo_url: photoUrl,
          enrollment_status: 'photo_completed',
        });
    }
    
    console.log('[Face Anchor Saved] ✅ URL:', photoUrl.substring(0, 50) + '...');
    
    // Log security event
    await supabaseAdmin.from('security_events').insert({
      user_id: userId,
      event_type: 'enrollment_photo_uploaded',
      severity: 'LOW',
      metadata: {
        description: 'Face anchor photo uploaded successfully',
        photoUrl,
        storage: storageType
      },
    });
    
    return NextResponse.json({
      success: true,
      photoUrl,
      publicUrl: photoUrl,
      storage: storageType,
      message: 'Face anchor saved successfully',
    });
    
  } catch (error: any) {
    console.error('[Upload Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
