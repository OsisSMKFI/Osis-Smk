import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiAuth';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const authErr = await requirePermission('sekbid:read');
    if (authErr) return authErr;

    const { data: sekbid, error } = await supabaseAdmin
      .from('sekbid')
      .select('*')
      .lte('id', 6)
      .order('id', { ascending: true });

    if (error) {
      console.error('[API sekbid][GET] error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(sekbid || []);
  } catch (error: any) {
    console.error('[API sekbid][GET] exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authErr = await requirePermission('sekbid:create');
    if (authErr) return authErr;

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Insert only guaranteed columns — let DB handle defaults
    const insertPayload: Record<string, any> = { name };
    if (description) insertPayload.description = description;

    // Try to detect available columns by checking an existing row
    const { data: existing } = await supabaseAdmin
      .from('sekbid')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (existing) {
      const cols = Object.keys(existing);
      // Add slug if column exists
      if (cols.includes('slug')) {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 100);
        insertPayload.slug = slug;
      }
      // Add display_order if column exists
      if (cols.includes('display_order') && body.display_order !== undefined) {
        insertPayload.display_order = body.display_order;
      }
    }

    console.log('[API sekbid][POST] Inserting:', Object.keys(insertPayload));

    const { data, error } = await supabaseAdmin
      .from('sekbid')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('[API sekbid][POST] Supabase error:', error.message, error);
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API sekbid][POST] exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
