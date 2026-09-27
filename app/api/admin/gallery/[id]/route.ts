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

    // Kolom thumbnail_url belum dikenal DB (PGRST204/42703 — migration
    // belum jalan / schema cache belum refresh) → retry tanpa kolom itu,
    // tapi JANGAN sukses senyap: sertakan warning agar client memberi tahu user.
    let warning: string | undefined;
    const unknownCol = (error as any)?.code === 'PGRST204' || (error as any)?.code === '42703';
    if (error && unknownCol && 'thumbnail_url' in updateData) {
      console.warn('[admin/gallery PUT] thumbnail_url column rejected:', (error as any).code, (error as any).message);
      delete updateData.thumbnail_url;
      const retry = await supabaseAdmin
        .from('gallery')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      data = retry.data;
      error = retry.error;
      if (!error) {
        warning = 'Thumbnail tidak dapat disimpan (kolom thumbnail_url ditolak database). Jalankan scripts/setup-gallery-thumbnails.sql di Supabase SQL Editor, lalu simpan ulang.';
      }
    }

    if (error) {
      return NextResponse.json({ error: error.message, code: (error as any).code }, { status: 500 });
    }

    return NextResponse.json({ success: true, data, ...(warning ? { warning } : {}) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
