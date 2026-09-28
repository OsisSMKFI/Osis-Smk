// instrumentation.ts
/**
 * Server-side error capture (error internal).
 * Next.js memanggil onRequestError untuk exception pada server component /
 * route handler -> dicatat ke error_logs -> dianalisis & tampil di /admin/errors.
 * Semua gagal di-swallow: logging tidak boleh memperburuk error utama.
 */
export async function register() {}

export async function onRequestError(error: any, request: any) {
  try {
    const { supabaseAdmin } = await import('@/lib/supabase/server');
    await supabaseAdmin.from('error_logs').insert({
      error_type: 'server_error',
      severity: 'critical',
      message: String(error?.message || error).slice(0, 2000),
      stack_trace: String(error?.stack || '').slice(0, 8000),
      error_code: error?.digest || null,
      page_url: String(request?.pathname || request?.path || '/').slice(0, 500),
      api_endpoint: String(request?.path || '').slice(0, 500) || null,
      request_method: request?.method || null,
      environment: process.env.NODE_ENV,
      ai_analyzed: false,
      metadata: { source: 'instrumentation:onRequestError', digest: error?.digest || null },
    });
  } catch {
    // jangan pernah throw dari sini
  }
}
