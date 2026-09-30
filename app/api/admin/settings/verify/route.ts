import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
  try {
    const authErr = await requirePermission('settings:read');
    if (authErr) return authErr;

    // Verify Supabase connection
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    return NextResponse.json({
      success: true,
      supabase: {
        connected: !!supabaseUrl && hasServiceKey,
        url: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
