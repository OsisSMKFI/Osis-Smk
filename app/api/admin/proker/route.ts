import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiAuth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { mapProkerList, insertProkerSafe } from '@/lib/proker';

export async function GET(request: NextRequest) {
  try {
    const authErr = await requirePermission('proker:read');
    if (authErr) return authErr;

    // Join sekbid; fall back to a plain select if embed fails
    let { data: proker, error } = await supabaseAdmin
      .from('program_kerja')
      .select(`
        *,
        sekbid:sekbid_id (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[admin/proker GET] join failed, retrying without embed:', error.message);
      const retry = await supabaseAdmin
        .from('program_kerja')
        .select('*')
        .order('created_at', { ascending: false });
      if (retry.error) {
        console.error('[admin/proker GET] error:', retry.error);
        return NextResponse.json({ error: retry.error.message }, { status: 500 });
      }
      proker = retry.data;
    }

    return NextResponse.json(mapProkerList(proker));
  } catch (error: any) {
    console.error('[admin/proker GET] exception:', error);
    return NextResponse.json({ error: error.message || 'Gagal memuat program kerja' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authErr = await requirePermission('proker:create');
    if (authErr) return authErr;

    const body = await request.json();
    const title = (body.title || body.nama || '').trim();

    if (!title) {
      return NextResponse.json({ error: 'Nama program kerja wajib diisi' }, { status: 400 });
    }

    const { data, error } = await insertProkerSafe(supabaseAdmin, {
      title,
      description: body.description ?? null,
      sekbid_id: body.sekbid_id ?? null,
      start_date: body.start_date ?? null,
      end_date: body.end_date ?? null,
      status: body.status || 'planned',
      progress: body.progress ?? null,
    });

    if (error) {
      console.error('[admin/proker POST] Supabase error:', error);
      return NextResponse.json(
        { error: error.message || 'Gagal menyimpan program kerja' },
        { status: 500 }
      );
    }

    const { mapProkerRow } = await import('@/lib/proker');
    return NextResponse.json(mapProkerRow(data));
  } catch (error: any) {
    console.error('[admin/proker POST] exception:', error);
    return NextResponse.json({ error: error.message || 'Gagal menyimpan program kerja' }, { status: 500 });
  }
}
