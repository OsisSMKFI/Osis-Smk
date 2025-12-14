import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// Cache untuk schema check - hindari query berulang
let schemaChecked = false;
let useErrorMessageColumn = true; // default ke error_message

async function checkSchema() {
  if (schemaChecked) return;
  
  try {
    // Test dengan error_message column dulu
    const { error } = await supabaseAdmin
      .from('error_logs')
      .select('error_message')
      .limit(1);
    
    if (error && error.message?.includes('error_message')) {
      // Kolom error_message tidak ada, coba dengan message
      useErrorMessageColumn = false;
    }
    schemaChecked = true;
  } catch {
    schemaChecked = true;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      error_type,
      error_message,
      message, // support both field names
      error_stack,
      stack_trace, // support both field names
      url,
      page_url, // support both field names
      status_code,
      user_agent,
      context,
      method,
      severity: bodySeverity,
    } = body;

    // Support both error_message and message field
    const messageContent = error_message || message;
    
    // Validate required fields
    if (!messageContent) {
      return NextResponse.json({ error: 'error_message or message is required' }, { status: 400 });
    }

    // Get client IP
    const ip_address = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';

    // Check schema untuk tahu kolom mana yang dipakai
    await checkSchema();

    // Build insert data - adaptive berdasarkan schema
    const insertData: Record<string, any> = {
      error_type: error_type || 'runtime_error',
      url: url || page_url,
      status_code,
      user_agent,
      ip_address,
      method: method || 'GET',
      context,
      severity: bodySeverity || determineSeverity(status_code, messageContent),
    };

    // Set message column berdasarkan schema
    if (useErrorMessageColumn) {
      insertData.error_message = messageContent;
      insertData.error_stack = error_stack || stack_trace;
    } else {
      insertData.message = messageContent;
      insertData.stack_trace = error_stack || stack_trace;
    }

    // Insert error log
    const { error } = await supabaseAdmin
      .from('error_logs')
      .insert(insertData);

    if (error) {
      const msg = (error as any)?.message || String(error);
      
      // If column not found, try with alternative column name
      if (msg.includes('error_message') || msg.includes("Could not find the")) {
        // Reset cache dan coba lagi dengan nama kolom alternatif
        schemaChecked = false;
        useErrorMessageColumn = !useErrorMessageColumn;
        
        const retryData = { ...insertData };
        if (useErrorMessageColumn) {
          delete retryData.message;
          delete retryData.stack_trace;
          retryData.error_message = messageContent;
          retryData.error_stack = error_stack || stack_trace;
        } else {
          delete retryData.error_message;
          delete retryData.error_stack;
          retryData.message = messageContent;
          retryData.stack_trace = error_stack || stack_trace;
        }
        
        const { error: retryError } = await supabaseAdmin
          .from('error_logs')
          .insert(retryData);
        
        if (retryError) {
          console.error('[/api/log-error] Retry failed:', retryError);
          // Don't fail the request, just log it
          return NextResponse.json({ success: true, warning: 'Error logged with fallback' });
        }
        
        schemaChecked = true;
        return NextResponse.json({ success: true });
      }
      
      // If table missing, don't fail logging pipeline; surface setup hint
      if (msg.toLowerCase().includes('relation') && msg.toLowerCase().includes('error_logs') && msg.toLowerCase().includes('does not exist')) {
        console.warn('[/api/log-error] error_logs table missing. Returning setupRequired=true');
        return NextResponse.json({ success: true, setupRequired: true });
      }
      
      console.error('[/api/log-error] Failed to log error:', error);
      // Don't return 500 for logging failures - it creates more errors
      return NextResponse.json({ success: true, warning: msg });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[/api/log-error] Exception:', error);
    // Don't fail - error logging should not cause more errors
    return NextResponse.json({ success: true, warning: error.message });
  }
}

function determineSeverity(statusCode?: number, message?: string): string {
  if (!statusCode && !message) return 'low';
  
  if (statusCode) {
    if (statusCode >= 500) return 'critical';
    if (statusCode >= 400) return 'medium';
  }
  
  const msg = message?.toLowerCase() || '';
  if (msg.includes('cors') || msg.includes('network') || msg.includes('fetch failed')) {
    return 'high';
  }
  if (msg.includes('unauthorized') || msg.includes('forbidden')) {
    return 'medium';
  }
  
  return 'low';
}
