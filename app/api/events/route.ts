import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { resolveStorageUrl } from '@/lib/mediaUrls';

export async function GET() {
  try {
    console.log('[api/events GET] Fetching events...');
    
    // Get all events, ordered by date descending (newest first)
    const { data: events, error: evtError } = await supabaseAdmin
      .from('events')
      .select('*')
      .order('event_date', { ascending: false })
      .limit(50);

    if (evtError) {
      console.error('[api/events GET] Error:', evtError);
      if (evtError.code === 'PGRST116' || evtError.code === 'PGRST204' || evtError.code === 'PGRST205') {
        return NextResponse.json({ events: [] });
      }
      return NextResponse.json({ error: evtError.message }, { status: 500 });
    }

    // Resolve media URLs (signed → public, relative → full, dead → null)
    const safeEvents = (events || []).map(event => ({
      ...event,
      image_url: resolveStorageUrl(event.image_url, 'events')
    }));

    console.log(`[api/events GET] Found ${safeEvents.length} events`);
    const res = NextResponse.json({ events: safeEvents });
    res.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=60');
    return res;
  } catch (error: any) {
    console.error('[api/events GET] Exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
