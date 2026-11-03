import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiAuth';
import { supabaseAdmin } from '@/lib/supabase/server';

const ALLOWED_KEYS = new Set([
  'mikrotik_enabled',
  'mikrotik_host',
  'mikrotik_port',
  'mikrotik_username',
  'mikrotik_password',
  'mikrotik_api_type',
  'mikrotik_use_dhcp',
  'mikrotik_use_arp',
  'mikrotik_cache_duration',
  'ip_validation_mode',
  'location_strict_mode',
  'location_max_radius',
  'location_gps_accuracy_required',
]);

const SECRET_KEYS = new Set(['mikrotik_password']);

/**
 * GET /api/admin/settings/mikrotik
 * Super-admin only. Secrets are never returned in plain text.
 */
export async function GET() {
  try {
    const authErr = await requirePermission('settings:read');
    if (authErr) return authErr;

    const { data, error } = await supabaseAdmin
      .from('admin_settings')
      .select('key, value')
      .in('key', Array.from(ALLOWED_KEYS));

    if (error) throw error;

    const settings: Record<string, string> = {};
    (data || []).forEach((row: { key: string; value: string | null }) => {
      if (!ALLOWED_KEYS.has(row.key)) return;
      settings[row.key] = SECRET_KEYS.has(row.key) && row.value ? '***' : (row.value ?? '');
    });

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error('[Mikrotik Settings API] Read failed:', error?.code || error?.message);
    return NextResponse.json({ success: false, error: 'Pengaturan tidak dapat dimuat.' }, { status: 500 });
  }
}

/**
 * POST /api/admin/settings/mikrotik
 * Super-admin only, and only whitelisted keys can be written.
 */
export async function POST(request: NextRequest) {
  try {
    const authErr = await requirePermission('settings:write');
    if (authErr) return authErr;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: 'Format pengaturan tidak valid.' }, { status: 400 });
    }

    const entries = Object.entries(body as Record<string, unknown>).filter(([key]) => ALLOWED_KEYS.has(key));
    if (!entries.length) {
      return NextResponse.json({ success: false, error: 'Tidak ada pengaturan yang diizinkan.' }, { status: 400 });
    }

    for (const [key, value] of entries) {
      if (SECRET_KEYS.has(key) && value === '***') continue;
      if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
        return NextResponse.json({ success: false, error: `Nilai ${key} tidak valid.` }, { status: 400 });
      }
    }

    const updates = entries
      .filter(([key, value]) => !(SECRET_KEYS.has(key) && value === '***'))
      .map(([key, value]) =>
        supabaseAdmin.from('admin_settings').upsert({
          key,
          value: String(value),
          category: key.includes('location') ? 'attendance' : 'security',
          is_secret: SECRET_KEYS.has(key),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' })
      );

    const results = await Promise.all(updates);
    const failed = results.find((result) => result.error);
    if (failed?.error) throw failed.error;

    return NextResponse.json({ success: true, message: 'Pengaturan berhasil disimpan.' });
  } catch (error: any) {
    console.error('[Mikrotik Settings API] Write failed:', error?.code || error?.message);
    return NextResponse.json({ success: false, error: 'Pengaturan tidak dapat disimpan.' }, { status: 500 });
  }
}
