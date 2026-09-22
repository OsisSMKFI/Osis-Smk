import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiAuth';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authErr = await requirePermission('sekbid:read');
    if (authErr) return authErr;
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from('sekbid')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: 'Sekbid not found' }, { status: 404 });
    }

    return NextResponse.json({ sekbid: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authErr = await requirePermission('sekbid:edit');
    if (authErr) return authErr;
    const { id } = await params;

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const updatePayload: Record<string, any> = { name };
    if (description !== undefined) updatePayload.description = description;

    // Detect available columns
    const { data: existing } = await supabaseAdmin
      .from('sekbid')
      .select('*')
      .eq('id', id)
      .limit(1)
      .maybeSingle();

    if (existing) {
      const cols = Object.keys(existing);
      if (cols.includes('slug')) {
        updatePayload.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 100);
      }
      if (cols.includes('display_order') && body.display_order !== undefined) {
        updatePayload.display_order = body.display_order;
      }
    }

    console.log('[API sekbid][PUT] Updating:', { id, fields: Object.keys(updatePayload) });

    const { data, error } = await supabaseAdmin
      .from('sekbid')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[API sekbid][PUT] Supabase error:', error.message, error);
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: 'Sekbid not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API sekbid][PUT] exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authErr = await requirePermission('sekbid:delete');
    if (authErr) return authErr;
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('sekbid')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
