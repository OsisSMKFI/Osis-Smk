import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { analyzeErrorRuleBased, buildAiAnalysisPayload, analyzeErrorWithLLM, saveAiAnalysis } from '@/lib/errorAnalysis';
import { maybePurgeLogs } from '@/lib/logRetention';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    console.log('[/api/admin/errors GET] Session:', { hasSession: !!session, user: session?.user?.email });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const summary = searchParams.get('summary') === 'true';

    console.log('[/api/admin/errors GET] Fetching errors, summary:', summary);

    // Retention otomatis (throttled): error > 30 hari + baris probe dibuang
    await maybePurgeLogs(supabaseAdmin, 'errors');

    if (summary) {
      // Get error summary for dashboard
      const { data: errors, error, count } = await supabaseAdmin
        .from('error_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        console.error('[/api/admin/errors GET] Supabase error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log('[/api/admin/errors GET] Fetched errors:', errors?.length || 0);

      // Calculate statistics
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;
      const oneWeekAgo = now - 7 * 86400000;
      const total = count ?? errors?.length ?? 0;
      const critical =
        errors?.filter((e: any) => e.severity === 'critical' || e.severity === 'error').length || 0;
      const recent =
        errors?.filter((e: any) => new Date(e.created_at).getTime() > oneHourAgo).length || 0;
      const resolved =
        errors?.filter((e: any) => {
          const t = e.resolved_at ? new Date(e.resolved_at).getTime() : 0;
          return e.fix_status === 'fixed' || (t > oneWeekAgo);
        }).length || 0;

      // Group errors by message
      const grouped = errors?.reduce((acc: any, err: any) => {
        const key = err.error_message || err.message || 'Unknown';
        if (!acc[key]) {
          acc[key] = { message: key, count: 0, severity: err.severity, latest: err.created_at };
        }
        acc[key].count++;
        if (new Date(err.created_at) > new Date(acc[key].latest)) {
          acc[key].latest = err.created_at;
        }
        return acc;
      }, {});

      const topErrors = Object.values(grouped || {})
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 3)
        .map((e: any) => ({
          message: e.message,
          count: e.count,
          latest: e.latest,
          lastSeen: new Date(e.latest).toLocaleString('id-ID'),
        }));

      return NextResponse.json({
        total,
        critical,
        recent,
        resolved,
        topErrors,
      });
    }

    // Get all errors
    const { data: errors, error } = await supabaseAdmin
      .from('error_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[/api/admin/errors GET] Supabase error:', error);
      
      // If table doesn't exist, return helpful message
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        return NextResponse.json({ 
          error: 'Table error_logs not found',
          hint: 'Jalankan scripts/setup-error-logs.sql di Supabase SQL Editor',
          setupRequired: true,
          errors: []
        }, { status: 200 });
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Auto-analyze ringan: error yang belum punya ai_analysis dianalisis
    // sekarang juga (rule-based, tanpa LLM) supaya panel selalu menampilkan
    // root cause + saran perbaikan tanpa klik manual.
    const list = errors || [];
    const pending = list.filter((e: any) => !e.ai_analysis && !e.deleted_at).slice(0, 20);
    if (pending.length > 0) {
      await Promise.all(pending.map(async (e: any) => {
        const a = analyzeErrorRuleBased({
          message: e.message,
          stack: e.stack_trace,
          errorType: e.error_type,
          errorCode: e.error_code,
          statusCode: e.response_status,
        });
        const payload = buildAiAnalysisPayload(a);
        const save = await saveAiAnalysis(supabaseAdmin, e.id, payload, {
          auto_fixable: a.autoFixable,
        });
        if (save.saved) {
          e.ai_analysis = payload;
          e.fix_status = 'analyzed';
          e.ai_analyzed = true;
        }
      }));
      console.log('[/api/admin/errors GET] Auto-analyzed', pending.length, 'error(s)');
    }

    console.log('[/api/admin/errors GET] Returning errors:', list.length);
    return NextResponse.json({ errors: list });
  } catch (error: any) {
    console.error('[/api/admin/errors GET] Exception:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { errorId, errorData, deep, message, severity, stack, metadata } = body;

    // If errorId provided, this is an AI analysis request
    if (errorId && errorData) {
      // deep=true (tombol Analyze) → AI provider custom default (1 panggilan);
      // selalu ada fallback rule-based sehingga analisis tidak pernah gagal total.
      const result = deep
        ? await analyzeErrorWithLLM({
            message: errorData.message || errorData.error_message,
            stack: errorData.stack_trace || errorData.error_stack,
            error_type: errorData.error_type,
            response_status: errorData.response_status || errorData.status_code,
          })
        : (() => {
            const a = analyzeErrorRuleBased({
              message: errorData.message || errorData.error_message,
              stack: errorData.stack_trace || errorData.error_stack,
              errorType: errorData.error_type,
              errorCode: errorData.error_code,
              statusCode: errorData.response_status || errorData.status_code,
            });
            return { analysis: a, payload: buildAiAnalysisPayload(a), source: 'rule-based' };
          })();

      const aiAnalysis = {
        timestamp: new Date().toISOString(),
        error_type: errorData.error_type || 'Unknown',
        severity: result.analysis.severity,
        root_cause: result.payload.root_cause,
        suggestions: result.payload.suggestions,
        category: result.payload.category,
        confidence: result.payload.confidence,
        analyzer: result.payload.analyzer,
      };

      // Simpan — toleran kolom hilang (kalau SQL setup belum dijalankan,
      // analisis tetap dikembalikan + warning, bukan error 500)
      const save = await saveAiAnalysis(supabaseAdmin, errorId, aiAnalysis, {
        auto_fixable: result.analysis.autoFixable,
      });

      return NextResponse.json({ 
        success: true, 
        analysis: aiAnalysis,
        analyzer: result.payload.analyzer,
        saved: save.saved,
        warning: save.saved ? undefined : `Hasil tidak tersimpan ke DB: ${save.warning} — jalankan scripts/setup-error-logs.sql`,
        message: 'AI analysis completed successfully'
      });
    }

    // Otherwise, create new error log
    const { data, error } = await supabaseAdmin
      .from('error_logs')
      .insert({
        message,
        severity: severity || 'error',
        stack,
        metadata,
        user_id: session.user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const clearAll = searchParams.get('clearAll') === 'true';

    if (clearAll) {
      const { error } = await supabaseAdmin
        .from('error_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'All errors cleared' });
    }

    if (!id) {
      return NextResponse.json({ error: 'Error ID required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('error_logs')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Error deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
