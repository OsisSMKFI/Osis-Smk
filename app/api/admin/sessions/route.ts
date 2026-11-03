import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/apiAuth';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// Session administration exposes IP addresses and can revoke anyone else's
// login, so it stays super-admin only.
export async function GET() {
  const authErr = await requirePermission('tools:access');
  if (authErr) return authErr;

  const { data, error } = await supabaseAdmin.from('app_sessions')
    .select('id,user_id,session_key,alias,user_agent,ip_address,created_at,last_seen_at,expires_at,revoked_at')
    .order('last_seen_at', { ascending: false }).limit(500);
  if (error) return NextResponse.json({ error: 'Daftar sesi tidak dapat dimuat.' }, { status: 500 });
  const userIds = [...new Set((data || []).map((s) => s.user_id))];
  const { data: users } = await supabaseAdmin.from('users').select('id,name,email,role,is_universal').in('id', userIds);
  const userById = new Map((users || []).map((u) => [u.id, u]));
  return NextResponse.json({ sessions: (data || []).map(({ session_key: _key, ...row }) => ({ ...row, user: userById.get(row.user_id) || null })) });
}

export async function DELETE(request: NextRequest) {
  const authErr = await requirePermission('tools:access');
  if (authErr) return authErr;

  const { sessionId } = await request.json().catch(() => ({}));
  if (typeof sessionId !== 'string') return NextResponse.json({ error: 'ID sesi tidak valid.' }, { status: 400 });
  const { error } = await supabaseAdmin.from('app_sessions').update({ revoked_at: new Date().toISOString() })
    .eq('id', sessionId).is('revoked_at', null);
  if (error) return NextResponse.json({ error: 'Sesi tidak dapat dicabut.' }, { status: 500 });
  return NextResponse.json({ success: true });
}
