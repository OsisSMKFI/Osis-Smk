import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiAuth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { mapProkerRow, updateProkerSafe } from '@/lib/proker';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authErr = await requirePermission('proker:read');
    if (authErr) return authErr;

    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from('program_kerja')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[admin/proker/[id] GET] error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Program kerja tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(mapProkerRow(data));
  } catch (error: any) {
    console.error('[admin/proker/[id] GET] exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authErr = await requirePermission('proker:edit');
    if (authErr) return authErr;

    const { id } = await params;
    const body = await request.json();
    const title = (body.title || body.nama || '').trim();

    if (!title) {
      return NextResponse.json({ error: 'Nama program kerja wajib diisi' }, { status: 400 });
    }

    const { data, error } = await updateProkerSafe(supabaseAdmin, id, {
      title,
      description: body.description ?? null,
      sekbid_id: body.sekbid_id ?? null,
      start_date: body.start_date ?? null,
      end_date: body.end_date ?? null,
      status: body.status || 'planned',
      progress: body.progress ?? null,
    });

    if (error) {
      console.error('[admin/proker/[id] PUT] error:', error);
      return NextResponse.json(
        { error: error.message || 'Gagal memperbarui program kerja' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({ error: 'Program kerja tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(mapProkerRow(data));
  } catch (error: any) {
    console.error('[admin/proker/[id] PUT] exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authErr = await requirePermission('proker:delete');
    if (authErr) return authErr;

    const { id } = await params;
    const { error } = await supabaseAdmin
      .from('program_kerja')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[admin/proker/[id] DELETE] error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[admin/proker/[id] DELETE] exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
