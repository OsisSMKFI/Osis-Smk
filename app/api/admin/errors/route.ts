import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { analyzeErrorRuleBased, buildAiAnalysisPayload } from '@/lib/errorAnalysis';

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

    if (summary) {
      // Get error summary for dashboard
      const { data: errors, error } = await supabaseAdmin
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('[/api/admin/errors GET] Supabase error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      console.log('[/api/admin/errors GET] Fetched errors:', errors?.length || 0);

      // Calculate statistics
      const total = errors?.length || 0;
      const critical = errors?.filter((e: any) => e.severity === 'critical').length || 0;
      const recentCount = errors?.filter((e: any) => {
        const errorDate = new Date(e.created_at);
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        return errorDate > oneDayAgo;
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
        .slice(0, 3);

      return NextResponse.json({
        total,
        critical,
        recent: recentCount,
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
        const { error: updErr } = await supabaseAdmin
          .from('error_logs')
          .update({
            ai_analysis: payload,
            fix_status: e.fix_status && e.fix_status !== 'pending' ? e.fix_status : 'analyzed',
            ai_analyzed: true,
            ai_risk_level: a.riskLevel,
            ai_category: a.category,
            auto_fixable: a.autoFixable,
          })
          .eq('id', e.id);
        if (!updErr) {
          e.ai_analysis = payload;
          e.fix_status = e.fix_status && e.fix_status !== 'pending' ? e.fix_status : 'analyzed';
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
    const { errorId, errorData, message, severity, stack, metadata } = body;

    // If errorId provided, this is an AI analysis request
    if (errorId && errorData) {
      // Rule-based analysis (ringan, tanpa LLM) — konsisten dengan analisis
      // otomatis di /api/errors/log dan auto-analyze saat GET.
      const shared = analyzeErrorRuleBased({
        message: errorData.message || errorData.error_message,
        stack: errorData.stack_trace || errorData.error_stack,
        errorType: errorData.error_type,
        errorCode: errorData.error_code,
        statusCode: errorData.response_status || errorData.status_code,
      });
      const aiAnalysis = {
        timestamp: new Date().toISOString(),
        error_type: errorData.error_type || 'Unknown',
        severity: shared.severity,
        root_cause: shared.root_cause,
        suggestions: shared.suggestions,
        category: shared.category,
        confidence: shared.confidence,
        analyzer: 'rule-based v1',
      };

      // Update error log with AI analysis
      const { error: updateError } = await supabaseAdmin
        .from('error_logs')
        .update({
          ai_analysis: aiAnalysis,
          fix_status: 'analyzed',
          ai_analyzed: true,
          ai_risk_level: shared.riskLevel,
          ai_category: shared.category,
          auto_fixable: shared.autoFixable,
        })
        .eq('id', errorId);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        analysis: aiAnalysis,
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
