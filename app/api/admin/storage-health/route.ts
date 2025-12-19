import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { auth } from '@/lib/auth';

/**
 * API to validate all storage URLs and detect broken references
 * GET /api/admin/storage-health
 * 
 * Returns a report of all storage URLs and their accessibility status
 */

const CURRENT_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mhefqwregrldvxtqqxbb.supabase.co';

// Known old/invalid domains
const INVALID_DOMAINS = [
  'eilrnslorvfrtwjwvbaw.supabase.co',
];

async function checkUrl(url: string): Promise<{ ok: boolean; status?: number; error?: string }> {
  if (!url) return { ok: false, error: 'Empty URL' };
  
  // Check if URL uses invalid domain
  for (const domain of INVALID_DOMAINS) {
    if (url.includes(domain)) {
      return { ok: false, error: `Uses deprecated domain: ${domain}` };
    }
  }
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, { 
      method: 'HEAD',
      signal: controller.signal 
    });
    
    clearTimeout(timeout);
    
    return { ok: response.ok, status: response.status };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Network error' };
  }
}

export async function GET(request: NextRequest) {
  // Check admin auth
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userRole = (session.user.role || '').toLowerCase();
  if (!['super_admin', 'admin'].includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const report: {
    timestamp: string;
    supabaseUrl: string;
    members: { total: number; withPhotos: number; broken: any[] };
    events: { total: number; withImages: number; broken: any[] };
    summary: { totalBroken: number; status: 'healthy' | 'warning' | 'critical' };
  } = {
    timestamp: new Date().toISOString(),
    supabaseUrl: CURRENT_SUPABASE_URL,
    members: { total: 0, withPhotos: 0, broken: [] },
    events: { total: 0, withImages: 0, broken: [] },
    summary: { totalBroken: 0, status: 'healthy' }
  };

  // Check members
  const { data: members } = await supabaseAdmin
    .from('members')
    .select('id, name, photo_url');

  if (members) {
    report.members.total = members.length;
    
    for (const member of members) {
      if (member.photo_url) {
        report.members.withPhotos++;
        const check = await checkUrl(member.photo_url);
        if (!check.ok) {
          report.members.broken.push({
            id: member.id,
            name: member.name,
            url: member.photo_url,
            error: check.error || `HTTP ${check.status}`
          });
        }
      }
    }
  }

  // Check events
  const { data: events } = await supabaseAdmin
    .from('events')
    .select('id, title, image_url');

  if (events) {
    report.events.total = events.length;
    
    for (const event of events) {
      if (event.image_url) {
        report.events.withImages++;
        const check = await checkUrl(event.image_url);
        if (!check.ok) {
          report.events.broken.push({
            id: event.id,
            title: event.title,
            url: event.image_url,
            error: check.error || `HTTP ${check.status}`
          });
        }
      }
    }
  }

  // Calculate summary
  report.summary.totalBroken = report.members.broken.length + report.events.broken.length;
  
  if (report.summary.totalBroken === 0) {
    report.summary.status = 'healthy';
  } else if (report.summary.totalBroken <= 5) {
    report.summary.status = 'warning';
  } else {
    report.summary.status = 'critical';
  }

  return NextResponse.json(report);
}

/**
 * POST /api/admin/storage-health
 * Auto-fix broken URLs by setting them to null
 */
export async function POST(request: NextRequest) {
  // Check admin auth
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userRole = (session.user.role || '').toLowerCase();
  if (!['super_admin', 'admin'].includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { action } = body;

  if (action !== 'cleanup') {
    return NextResponse.json({ error: 'Invalid action. Use action: "cleanup"' }, { status: 400 });
  }

  const results = {
    members: { cleaned: 0, errors: [] as string[] },
    events: { cleaned: 0, errors: [] as string[] }
  };

  // Clean members
  const { data: members } = await supabaseAdmin
    .from('members')
    .select('id, name, photo_url')
    .not('photo_url', 'is', null);

  if (members) {
    for (const member of members) {
      const check = await checkUrl(member.photo_url!);
      if (!check.ok) {
        const { error } = await supabaseAdmin
          .from('members')
          .update({ photo_url: null })
          .eq('id', member.id);

        if (error) {
          results.members.errors.push(`ID ${member.id}: ${error.message}`);
        } else {
          results.members.cleaned++;
        }
      }
    }
  }

  // Clean events
  const { data: events } = await supabaseAdmin
    .from('events')
    .select('id, title, image_url')
    .not('image_url', 'is', null);

  if (events) {
    for (const event of events) {
      const check = await checkUrl(event.image_url!);
      if (!check.ok) {
        const { error } = await supabaseAdmin
          .from('events')
          .update({ image_url: null })
          .eq('id', event.id);

        if (error) {
          results.events.errors.push(`ID ${event.id}: ${error.message}`);
        } else {
          results.events.cleaned++;
        }
      }
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Cleanup completed',
    results
  });
}
