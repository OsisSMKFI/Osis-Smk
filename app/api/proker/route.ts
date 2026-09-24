import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { mapProkerList } from '@/lib/proker';

// Remember join failure so we don't re-run the full join on every request
let joinBroken = false;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sekbidId = searchParams.get('sekbid_id');
    const status = searchParams.get('status');

    let data: any[] | null = null;

    if (!joinBroken) {
      let query = supabaseAdmin
        .from('program_kerja')
        .select(`
          *,
          sekbid:sekbid_id (
            id,
            name,
            description,
            color,
            icon
          )
        `)
        .order('created_at', { ascending: false });

      if (sekbidId) {
        query = query.eq('sekbid_id', parseInt(sekbidId));
      }

      if (status) {
        query = query.eq('status', status);
      }

      const joined = await query;
      if (joined.error) {
        console.error('[api/proker] join failed, retrying without embed:', joined.error.message);
        joinBroken = true;
      } else {
        data = joined.data;
      }
    }

    if (!data) {
      let retry = supabaseAdmin
        .from('program_kerja')
        .select('*')
        .order('created_at', { ascending: false });
      if (sekbidId) retry = retry.eq('sekbid_id', parseInt(sekbidId));
      if (status) retry = retry.eq('status', status);
      const retried = await retry;
      if (retried.error) {
        console.error('[api/proker] error:', retried.error);
        return NextResponse.json({ error: retried.error.message }, { status: 500 });
      }
      data = retried.data;
    }

    const res = NextResponse.json({ proker: mapProkerList(data) });
    res.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=60');
    return res;
  } catch (error: any) {
    console.error('[api/proker] exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
