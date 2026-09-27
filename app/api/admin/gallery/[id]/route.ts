import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requirePermission } from '@/lib/apiAuth';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authErr = await requirePermission('gallery:delete');
    if (authErr) return authErr;

    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('gallery')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Gallery item deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authErr = await requirePermission('gallery:edit');
    if (authErr) return authErr;

    const { id } = await params;
    const body = await request.json();
    const { title, description, image_url, thumbnail_url, event_id, sekbid_id } = body;

    // Build update object without updated_at (let database handle it via trigger)
    const updateData: any = {
      title,
      description,
      image_url,
    };

    // thumbnail_url: string utk set, null utk hapus, undefined utk tidak diubah
    if (thumbnail_url !== undefined) updateData.thumbnail_url = thumbnail_url || null;

    // Only include optional fields if they're provided
    if (event_id !== undefined) updateData.event_id = event_id;
    if (sekbid_id !== undefined) updateData.sekbid_id = sekbid_id;

    let { data, error } = await supabaseAdmin
      .from('gallery')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    // Kolom thumbnail_url belum dibuat (SQL migration belum dijalankan) → retry tanpa kolom itu
    if (error && (error as any).code === 'PGRST204' && 'thumbnail_url' in updateData) {
      console.warn('[admin/gallery PUT] thumbnail_url column missing — run scripts/setup-gallery-thumbnails.sql, retrying without it');
      delete updateData.thumbnail_url;
      const retry = await supabaseAdmin
        .from('gallery')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
