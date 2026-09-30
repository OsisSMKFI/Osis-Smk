// lib/logRetention.ts
// Retention otomatis (ringan, dijalankan on-read dari admin API, di-throttle
// supaya tidak query DB tiap request):
//   - activity_logs : hanya simpan 14 hari terakhir (panel tidak penuh/berat)
//   - error_logs    : simpan 30 hari + buang baris probe verifikasi & duplikat
import { SupabaseClient } from '@supabase/supabase-js';

const THROTTLE_MS = 6 * 60 * 60 * 1000; // sekali per 6 jam per instance
const lastRun: Record<string, number> = {};

const PROBE_TYPES = ['verify_after_sql', 'probe', 'verification'];
const PROBE_MESSAGE_PREFIXES = ['verify', 'probe', '__probe__'];

export async function maybePurgeLogs(
  supabase: SupabaseClient,
  scope: 'errors' | 'activity'
): Promise<void> {
  const now = Date.now();
  if (now - (lastRun[scope] || 0) < THROTTLE_MS) return;
  lastRun[scope] = now;

  try {
    if (scope === 'activity') {
      const cutoff = new Date(now - 14 * 86400000).toISOString();
      await supabase.from('activity_logs').delete().lt('created_at', cutoff);
      console.log('[Retention] activity_logs > 14 hari dibersihkan (throttle 6 jam)');
    } else {
      const cutoff = new Date(now - 30 * 86400000).toISOString();
      await supabase.from('error_logs').delete().lt('created_at', cutoff);
      // Baris probe verifikasi test
      await supabase.from('error_logs').delete().in('error_type', PROBE_TYPES);
      for (const prefix of PROBE_MESSAGE_PREFIXES) {
        await supabase
          .from('error_logs')
          .delete()
          .or(`message.ilike.${prefix}%,error_type.ilike.${prefix}%`);
      }
      console.log('[Retention] error_logs > 30 hari + baris probe dibersihkan (throttle 6 jam)');
    }
  } catch (e: any) {
    // Kolom/table mungkin belum siap — jangan gagalkan request admin
    console.warn('[Retention] purge dilewati:', e?.message);
  }
}
