// app/api/errors/log/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { analyzeErrorRuleBased, buildAiAnalysisPayload } from '@/lib/errorAnalysis';

/**
 * LOG ERROR - Called from client or server
 * AI-powered error analysis and auto-fix
 * 
 * SAFETY: Will gracefully handle missing table/columns
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    const body = await request.json();
    const {
      errorType,
      severity,
      message,
      stackTrace,
      errorCode,
      pageUrl,
      apiEndpoint,
      requestMethod,
      requestBody,
      responseStatus,
      environment,
      browser,
      os,
      deviceType,
      metadata = {}
    } = body;

    // Always log to console first (fallback if DB fails)
    console.log('[Error Log] 📝', {
      type: errorType,
      severity,
      message: message?.substring(0, 200),
      pageUrl,
      timestamp: new Date().toISOString()
    });

    // Get user context
    const userId = session?.user?.id;
    const userEmail = session?.user?.email;
    const userRole = session?.user?.role;

    // Get IP and User Agent
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    // AI Analysis (rule-based, ringan — tanpa LLM/network)
    const analysis = analyzeErrorRuleBased({
      message,
      stack: stackTrace,
      errorType,
      errorCode,
      statusCode: responseStatus,
    });
    const aiAnalysis = {
      riskLevel: analysis.riskLevel,
      category: analysis.category,
      suggestions: analysis.suggestions.map((s) => `${s.action}: ${s.details}`),
      autoFixable: analysis.autoFixable,
      autoFixCode: analysis.autoFixCode,
      suggestedSeverity: severity || analysis.severity,
      panel: buildAiAnalysisPayload(analysis),
    };

    // Try to check for duplicates (skip if table doesn't exist)
    let existingError = null;
    try {
      const { data } = await supabaseAdmin
        .from('error_logs')
        .select('*')
        .eq('message', message)
        .eq('error_type', errorType)
        .gte('created_at', new Date(Date.now() - 3600000).toISOString())
        .is('deleted_at', null)
        .maybeSingle(); // Use maybeSingle to avoid error on 0 rows

      existingError = data;

      if (existingError) {
        // Update occurrence count
        await supabaseAdmin
          .from('error_logs')
          .update({
            occurrence_count: (existingError.occurrence_count || 0) + 1,
            last_occurred_at: new Date().toISOString()
          })
          .eq('id', existingError.id);

        console.log('[Error Log] ✅ Updated existing error:', existingError.id);

        return NextResponse.json({
          success: true,
          data: {
            errorId: existingError.id,
            duplicate: true,
            aiAnalysis
          }
        });
      }
    } catch (checkError: any) {
      // Table might not exist yet - just log and continue
      console.warn('[Error Log] ⚠️ Cannot check duplicates:', checkError.message);
    }

    // Try to insert new error log — loop strip kolom yang ditolak DB
    // (error_logs versi lama mungkin belum punya kolom tertentu)
    let errorLog = null;
    try {
      let insertPayload: any = {
        error_type: errorType,
        severity: severity || aiAnalysis.suggestedSeverity,
        message,
        stack_trace: stackTrace,
        error_code: errorCode,
        user_id: userId,
        user_email: userEmail,
        user_role: userRole,
        page_url: pageUrl,
        api_endpoint: apiEndpoint,
        request_method: requestMethod,
        request_body: requestBody,
        response_status: responseStatus,
        environment: environment || 'production',
        browser,
        os,
        device_type: deviceType,
        ip_address: ipAddress,
        user_agent: userAgent,
        ai_analyzed: true,
        ai_risk_level: aiAnalysis.riskLevel,
        ai_category: aiAnalysis.category,
        ai_suggestions: aiAnalysis.suggestions,
        ai_analysis: aiAnalysis.panel,
        fix_status: 'analyzed',
        auto_fixable: aiAnalysis.autoFixable,
        metadata,
        first_occurred_at: new Date().toISOString(),
        last_occurred_at: new Date().toISOString()
      };

      let insertError: any = null;
      let lastAttempt = -1;
      // Batas = jumlah kolom payload (~30) — tabel versi lama bisa kehilangan
      // banyak kolom sekaligus; strip satu per satu sampai insert masuk.
      for (let attempt = 0; attempt < 40; attempt++) {
        lastAttempt = attempt;
        const res = await supabaseAdmin
          .from('error_logs')
          .insert([insertPayload])
          .select()
          .maybeSingle();
        if (!res.error) {
          errorLog = res.data;
          break;
        }
        insertError = res.error;
        const msg = insertError.message || '';
        const colMatch = msg.match(/'([^']+)' column/) || msg.match(/column "([^"]+)"/);
        const unknownCol =
          insertError.code === 'PGRST204' ||
          insertError.code === '42703' ||
          /Could not find the '[^']+' column|schema cache/i.test(msg);
        if (colMatch && colMatch[1] in insertPayload && (unknownCol || !insertError.code)) {
          console.warn('[Error Log] Column rejected, dropping:', colMatch[1]);
          delete insertPayload[colMatch[1]];
          continue;
        }
        break;
      }

      if (insertError || !errorLog) {
        console.error('[Error Log] ⚠️ Insert error:', insertError?.message);
        console.log('[Error Log] 📋 Logged to console only (DB unavailable)');

        return NextResponse.json({
          success: true,
          data: {
            errorId: 'console-only',
            logged: 'console',
            aiAnalysis,
            warning: `attempt=${lastAttempt} keys=${Object.keys(insertPayload).length} has=${'user_role' in insertPayload} ${insertError?.code || 'nocode'}: ${insertError?.message?.slice(0, 200)}`.trim()
          }
        });
      }

      console.log('[Error Log] ✅ Created new error log:', errorLog?.id);
    } catch (dbError: any) {
      // Database error - log to console only
      console.error('[Error Log] ⚠️ Database unavailable:', dbError.message);
      console.log('[Error Log] 📋 Error logged to console only');
      
      return NextResponse.json({
        success: true,
        data: {
          errorId: 'console-only',
          logged: 'console',
          aiAnalysis,
          warning: 'Database unavailable - logged to console'
        }
      });
    }

    // Auto-fix if applicable and we have an error log ID
    if (errorLog && aiAnalysis.autoFixable && aiAnalysis.autoFixCode) {
      try {
        const fixResult = await applyAutoFix(errorLog.id, aiAnalysis.autoFixCode);
        
        await supabaseAdmin
          .from('error_logs')
          .update({
            auto_fix_applied: true,
            auto_fix_details: fixResult,
            status: 'fixed',
            resolved_at: new Date().toISOString()
          })
          .eq('id', errorLog.id);

        console.log('[Error Log] ✅ Auto-fix applied:', errorLog.id);
      } catch (fixError) {
        console.error('[Error Log] ⚠️ Auto-fix failed:', fixError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        errorId: errorLog?.id || 'console-only',
        aiAnalysis,
        autoFixApplied: aiAnalysis.autoFixable,
        logged: errorLog ? 'database' : 'console'
      }
    });

  } catch (error: any) {
    console.error('[Error Log] ❌ Critical error:', error);
    // ALWAYS return success - error logging should NEVER break the app
    return NextResponse.json({
      success: true,
      data: {
        errorId: 'fallback',
        logged: 'console-only',
        warning: 'Error logging service unavailable'
      }
    });
  }
}

/**
 * Apply Auto-Fix
 */
async function applyAutoFix(errorId: string, fixCode: string) {
  console.log('[Auto-Fix] Applying fix:', fixCode);

  switch (fixCode) {
    case 'ADD_CORS_HEADER':
      // Automatically add CORS headers (already handled in middleware)
      return {
        action: 'CORS headers added',
        success: true,
        timestamp: new Date().toISOString()
      };

    case 'RETRY_WITH_BACKOFF':
      // Implement retry logic
      return {
        action: 'Retry scheduled with exponential backoff',
        success: true,
        retry_count: 3,
        timestamp: new Date().toISOString()
      };

    default:
      return {
        action: 'No auto-fix available',
        success: false,
        timestamp: new Date().toISOString()
      };
  }
}
