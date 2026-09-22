import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requirePermission } from '@/lib/apiAuth';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const authErr = await requirePermission('proker:read');
    if (authErr) return authErr;

    const { data: proker, error } = await supabaseAdmin
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
      console.error('Error fetching proker:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json((proker || []).map((p: any) => ({ ...p, title: p.nama || p.title })));
  } catch (error: any) {
    console.error('Error in GET /api/admin/proker:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authErr = await requirePermission('proker:create');
    if (authErr) return authErr;

    const body = await request.json();
    const { title, description, sekbid_id, start_date, end_date, status } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const waktu = [start_date, end_date].filter(Boolean).join(' - ') || null;

    const { data, error } = await supabaseAdmin
      .from('program_kerja')
      .insert({
        nama: title,
        description: description || null,
        sekbid_id: sekbid_id || null,
        waktu,
        status: status || 'planned',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating proker:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in POST /api/admin/proker:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
