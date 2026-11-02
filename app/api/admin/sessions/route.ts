import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';

async function adminRole() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { error: NextResponse.json({ error: 'Login diperlukan' }, { status: 401 }) };
  const { data } = await supabaseAdmin.from('users').select('role,approved,email_verified').eq('id', userId).maybeSingle();
  if (!data || !data.approved || !data.email_verified || !['admin','super_admin'].includes(data.role)) {
    return { error: NextResponse.json({ error: 'Akses admin diperlukan' }, { status: 403 }) };
  }
  return { userId };
}

export async function GET() {
  const actor = await adminRole();
  if (actor.error) return actor.error;
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
  const actor = await adminRole();
  if (actor.error) return actor.error;
  const { sessionId } = await request.json().catch(() => ({}));
  if (typeof sessionId !== 'string') return NextResponse.json({ error: 'ID sesi tidak valid.' }, { status: 400 });
  const { error } = await supabaseAdmin.from('app_sessions').update({ revoked_at: new Date().toISOString() })
    .eq('id', sessionId).is('revoked_at', null);
  if (error) return NextResponse.json({ error: 'Sesi tidak dapat dicabut.' }, { status: 500 });
  return NextResponse.json({ success: true });
}
