// lib/errorAnalysis.ts
/**
 * Rule-based error analyzer — ringan, tanpa LLM, tanpa network call.
 * Dipakai oleh: /api/errors/log (analisis otomatis saat error masuk),
 * /api/admin/errors (auto-analyze saat panel dibuka + tombol Analyze).
 */

export interface AnalysisSuggestion {
  action: string;
  details: string;
  priority: number;
}

export interface ErrorAnalysis {
  root_cause: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  suggestions: AnalysisSuggestion[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  autoFixable: boolean;
  autoFixCode: string | null;
  confidence: number;
}

export function analyzeErrorRuleBased(input: {
  message?: string | null;
  stack?: string | null;
  errorType?: string | null;
  errorCode?: string | null;
  statusCode?: number | null;
}): ErrorAnalysis {
  const msg = String(input.message || '');
  const stack = String(input.stack || '');
  const full = `${msg} ${stack} ${input.errorCode || ''} ${input.errorType || ''}`;

  const s: AnalysisSuggestion[] = [];
  let root_cause = 'Penyebab belum teridentifikasi. Tinjau stack trace secara manual.';
  let severity: ErrorAnalysis['severity'] = 'medium';
  let category = 'bug';
  let autoFixable = false;
  let autoFixCode: string | null = null;
  let confidence = 50;

  // 1. Skema database / kolom hilang (paling sering di proyek ini)
  if (/column .* (does not exist|not exist)|unknown column|could not find the '\w+' column|PGRST204|42703|no such column/i.test(full)) {
    const col = full.match(/'([^']+)' column|column ["']?(\w+)["']? does not exist/i);
    const column = col?.[1] || col?.[2] || 'yang disebut di pesan';
    root_cause = `Kolom database "${column}" tidak ada di tabel (schema cache / migration belum jalan).`;
    severity = 'high';
    category = 'database/schema';
    confidence = 92;
    s.push({ action: 'Tambahkan kolom yang hilang', details: `Jalankan ALTER TABLE ... ADD COLUMN ${column} <tipe>; lalu NOTIFY pgrst, 'reload schema'; di SQL Editor Supabase.`, priority: 1 });
    s.push({ action: 'Kode lebih tahan banting', details: 'Gunakan select(*) atau fallback ketika kolom opsional ditolak, supaya request tidak gagal total.', priority: 2 });
  }

  // 2. Tabel tidak ada
  else if (/could not find the table|PGRST205|relation .* does not exist/i.test(full)) {
    root_cause = 'Tabel yang diminta tidak ada di database (setup SQL belum dijalankan).';
    severity = 'high';
    category = 'database/schema';
    confidence = 92;
    s.push({ action: 'Buat tabel yang hilang', details: 'Jalankan file setup SQL yang sesuai (scripts/setup-*.sql) di SQL Editor Supabase.', priority: 1 });
  }

  // 3. RLS / permission
  else if (/RLS|row level|permission denied|policy/i.test(full)) {
    root_cause = 'Row Level Security (RLS) memblokir akses database.';
    severity = 'high';
    category = 'database/security';
    confidence = 90;
    s.push({ action: 'Periksa RLS policy tabel terkait', details: 'Tambahkan policy untuk role service_role/authenticated/anon sesuai kebutuhan akses.', priority: 1 });
    s.push({ action: 'Konfirmasi role yang dipakai', details: 'API server memakai service_role (bypass RLS) — kalau error terjadi di client, periksa policy anon/authenticated.', priority: 2 });
  }

  // 4. CORS
  else if (/CORS|cross-origin/i.test(full)) {
    root_cause = 'CORS memblokir request lintas origin.';
    severity = 'medium';
    category = 'configuration';
    autoFixable = true;
    autoFixCode = 'ADD_CORS_HEADER';
    confidence = 88;
    s.push({ action: 'Tambahkan header CORS', details: 'Set Access-Control-Allow-Origin/Methods/Headers pada response API atau atur di middleware.', priority: 1 });
  }

  // 5. Auth
  else if (/401|403|unauthorized|forbidden|invalid token|session.*(expired|invalid)/i.test(full)) {
    root_cause = 'Kegagalan autentikasi/otorisasi (sesi tidak valid atau izin kurang).';
    severity = 'high';
    category = 'security';
    confidence = 85;
    s.push({ action: 'Periksa sesi & permission', details: 'Pastikan token sesi masih valid dan role pengguna punya izin untuk route ini.', priority: 1 });
    s.push({ action: 'Periksa gate role di route API', details: 'Cek auth()/requirePermission() di route terkait — role mungkin tidak cocok (mis. super_admin vs admin).', priority: 2 });
  }

  // 6. Timeout / network
  else if (/timeout|ETIMEDOUT|ECONNRESET|network|failed to fetch|ECONNREFUSED/i.test(full)) {
    root_cause = 'Gangguan jaringan / request timeout ke service eksternal.';
    severity = 'medium';
    category = 'performance/network';
    autoFixable = true;
    autoFixCode = 'RETRY_WITH_BACKOFF';
    confidence = 80;
    s.push({ action: 'Tambahkan retry dengan backoff', details: 'Bungkus fetch dengan retry eksponensial + timeout yang wajar.', priority: 1 });
    s.push({ action: 'Cek uptime service eksternal', details: 'Verifikasi endpoint/URL eksternal (provider AI, Supabase, dsb) sedang normal.', priority: 2 });
  }

  // 7. 404 / routing
  else if (/404|not found/i.test(full)) {
    root_cause = 'Resource/route yang diminta tidak ditemukan (URL salah atau handler belum ada).';
    severity = 'low';
    category = 'routing';
    confidence = 82;
    s.push({ action: 'Verifikasi path route', details: 'Cek file route di app/api/ dan pastikan URL yang dipanggil persis sama.', priority: 1 });
    s.push({ action: 'Cek cache CDN', details: 'Kalau route sudah ada tapi masih 404, kemungkinan respons lama di cache — pakai cache-buster.', priority: 2 });
  }

  // 8. Server 500
  else if (/500|internal server error/i.test(full)) {
    root_cause = 'Error server-side tak tertangani (logic/query/DB gagal).';
    severity = 'critical';
    category = 'bug';
    confidence = 75;
    s.push({ action: 'Periksa log server & query DB', details: 'Lihat stack trace di bawah — biasanya ada query atau validasi yang gagal.', priority: 1 });
    s.push({ action: 'Cek kolom & koneksi database', details: 'Kunci PGRST204/42703 = kolom hilang; PGRST205 = tabel hilang; jalankan setup SQL terkait.', priority: 2 });
  }

  // 9. Memory
  else if (/memory|heap|out of bound/i.test(full)) {
    root_cause = 'Penggunaan memori berlebih / indikasi memory leak.';
    severity = 'critical';
    category = 'performance';
    confidence = 85;
    s.push({ action: 'Optimasi resource', details: 'Periksa listener/interval yang tidak dibersihkan dan data besar yang di-cache di memori.', priority: 1 });
  }

  // 10. TypeError JS
  else if (/typeerror|undefined is not|null is not|cannot read propert/i.test(full)) {
    root_cause = 'Nilai undefined/null diakses sebelum data tersedia.';
    severity = 'medium';
    category = 'bug';
    confidence = 88;
    s.push({ action: 'Tambahkan guard nullish', details: 'Gunakan optional chaining (a?.b) dan default value (a ?? b) pada akses data.', priority: 1 });
    s.push({ action: 'Validasi data sumber', details: 'Pastikan API/DB benar-benar mengembalikan field yang dikonsumsi komponen.', priority: 2 });
  }

  // 11. Kategori dari tipe error client
  if (input.errorType === 'authentication_error' || input.errorType === 'authorization_error') {
    severity = severity === 'medium' ? 'high' : severity;
    category = 'security';
  }

  // 12. Fallback
  if (s.length === 0) {
    s.push({ action: 'Aktifkan logging detail', details: 'Tambahkan console.error/log pada titik gagal untuk mempersempit lokasi masalah.', priority: 3 });
    s.push({ action: 'Reproduksi langkah error', details: 'Ulangi alur yang sama dan amati request/response yang terjadi.', priority: 2 });
  }

  // Severity dari status code kalau tersedia
  if (input.statusCode && input.statusCode >= 500) severity = 'critical';
  else if (input.statusCode && input.statusCode >= 400 && severity === 'medium') severity = 'high';

  return {
    root_cause,
    severity,
    suggestions: s,
    riskLevel: severity,
    category,
    autoFixable,
    autoFixCode,
    confidence,
  };
}

/** Format siap simpan ke kolom error_logs.ai_analysis (dibaca admin panel). */
export function buildAiAnalysisPayload(a: ErrorAnalysis) {
  return {
    root_cause: a.root_cause,
    severity: a.severity,
    suggestions: a.suggestions,
    category: a.category,
    confidence: a.confidence,
    analyzer: 'rule-based v1',
    analyzed_at: new Date().toISOString(),
  };
}
