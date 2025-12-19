import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { DEPRECATED_PROJECTS } from '@/lib/supabase/storage';

// Filter out deprecated Supabase URLs
function filterDeprecatedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  for (const deprecated of DEPRECATED_PROJECTS) {
    if (url.includes(deprecated)) {
      console.warn(`[Events API] Filtering deprecated URL from project: ${deprecated}`);
      return null;
    }
  }
  return url;
}

export async function GET() {
  try {
    console.log('[api/events GET] Fetching events...');
    
    // Get all events, ordered by date descending (newest first)
    const { data: events, error: evtError } = await supabaseAdmin
      .from('events')
      .select('*')
      .order('event_date', { ascending: false });

    if (evtError) {
      console.error('[api/events GET] Error:', evtError);
      if (evtError.code === 'PGRST116' || evtError.code === 'PGRST204' || evtError.code === 'PGRST205') {
        return NextResponse.json({ events: [] });
      }
      return NextResponse.json({ error: evtError.message }, { status: 500 });
    }

    // Filter out events with deprecated storage URLs
    const safeEvents = (events || []).map(event => ({
      ...event,
      image_url: filterDeprecatedUrl(event.image_url)
    }));

    console.log(`[api/events GET] Found ${safeEvents.length} events`);
    return NextResponse.json({ events: safeEvents });
  } catch (error: any) {
    console.error('[api/events GET] Exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
