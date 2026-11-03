import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';
const fields: Record<string, string[]> = {
  piket_student_roster: ['no_induk','name','unit_sekolah','kelas','name_aliases','is_active'],
  users_profile: ['name','nickname','unit_sekolah','kelas','no_induk','nisn','nik','instagram_username','photo_url'],
  posts: ['title','slug','content','excerpt','featured_image','author_id','sekbid_id','category','tags','status','is_featured','published_at'],
  events: ['title','slug','description','content','location','start_date','end_date','image_url','status','sekbid_id'],
  program_kerja: ['title','description','status','start_date','end_date','sekbid_id','target','budget'],
  members: ['name','role','sekbid_id','photo_url','quote','instagram','instagram_username','email','class','achievements','display_order','is_active'],
};

async function requireReviewer() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return { response: NextResponse.json({ error: 'Login diperlukan.' }, { status: 401 }) };
  const { data: user } = await supabaseAdmin.from('users').select('role,approved,email_verified').eq('id', id).maybeSingle();
  if (!user?.approved || !user.email_verified || !['admin','super_admin'].includes(user.role)) return { response: NextResponse.json({ error: 'Akses admin diperlukan.' }, { status: 403 }) };
  return { id };
}

export async function GET() {
  const reviewer = await requireReviewer();
  if ('response' in reviewer) return reviewer.response;
  const { data, error } = await supabaseAdmin.from('universal_change_proposals')
    .select('id,actor_user_id,actor_session_id,entity_type,entity_id,operation,before_data,proposed_data,status,duplicate_of,created_at')
    .in('status', ['pending','conflict']).order('created_at', { ascending: true }).limit(500);
  if (error) return NextResponse.json({ error: 'Antrean perubahan belum dapat dimuat.' }, { status: 500 });
  const actorIds = [...new Set((data || []).map((item) => item.actor_user_id))];
  const sessionIds = [...new Set((data || []).map((item) => item.actor_session_id).filter(Boolean))] as string[];
  const [{ data: actors }, { data: sessions }] = await Promise.all([
    supabaseAdmin.from('users').select('id,name,email,role').in('id', actorIds),
    sessionIds.length ? supabaseAdmin.from('app_sessions').select('id,alias,ip_address,user_agent').in('id', sessionIds) : Promise.resolve({ data: [] as any[] }),
  ]);
  const actorMap = new Map((actors || []).map((item) => [item.id, item]));
  const sessionMap = new Map((sessions || []).map((item) => [item.id, item]));
  return NextResponse.json({ proposals: (data || []).map((item) => ({ ...item, actor: actorMap.get(item.actor_user_id), session: sessionMap.get(item.actor_session_id) })) });
}

export async function PATCH(request: NextRequest) {
  const reviewer = await requireReviewer();
  if ('response' in reviewer) return reviewer.response;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.id !== 'string' || !['approve','reject'].includes(body.decision)) return NextResponse.json({ error: 'Keputusan perubahan tidak valid.' }, { status: 400 });
  const { data: proposal, error: loadError } = await supabaseAdmin.from('universal_change_proposals').select('*').eq('id', body.id).maybeSingle();
  if (loadError || !proposal || !['pending','conflict'].includes(proposal.status)) return NextResponse.json({ error: 'Pengajuan sudah diproses atau tidak ditemukan.' }, { status: 409 });
  if (proposal.actor_user_id === reviewer.id) return NextResponse.json({ error: 'Pengajuan sendiri tidak dapat disetujui oleh pembuatnya.' }, { status: 409 });
  if (body.decision === 'reject') {
    await supabaseAdmin.from('universal_change_proposals').update({ status: 'rejected', reviewed_by: reviewer.id, reviewed_at: new Date().toISOString() }).eq('id', proposal.id);
    return NextResponse.json({ success: true, status: 'rejected' });
  }
  const allowed = fields[proposal.entity_type];
  if (!allowed) return NextResponse.json({ error: 'Jenis data belum diizinkan untuk approval otomatis.' }, { status: 409 });
  const proposed = proposal.proposed_data && typeof proposal.proposed_data === 'object' && !Array.isArray(proposal.proposed_data)
    ? proposal.proposed_data as Record<string, unknown>
    : null;
  if (!proposed) return NextResponse.json({ error: 'Data perubahan tidak valid.' }, { status: 400 });
  const patch = Object.fromEntries(Object.entries(proposed).filter(([key]) => allowed.includes(key)));
  const table = proposal.entity_type === 'users_profile' ? 'users' : proposal.entity_type;
  let applyError: any = null;
  if (proposal.operation !== 'create' && !proposal.entity_id) {
    return NextResponse.json({ error: 'Perubahan tidak memiliki target data.' }, { status: 409 });
  }
  if (proposal.operation === 'create' && proposal.entity_type === 'users_profile') {
    return NextResponse.json({ error: 'Pembuatan akun pengguna tidak diizinkan dari antrean ini.' }, { status: 409 });
  }
  if (proposal.operation === 'delete') {
    if (proposal.entity_type === 'piket_student_roster' || proposal.entity_type === 'members') {
      ({ error: applyError } = await (supabaseAdmin as any).from(table).update({ is_active: false }).eq('id', proposal.entity_id));
    } else if (proposal.entity_type === 'posts') {
      ({ error: applyError } = await supabaseAdmin.from('posts').update({ status: 'archived' }).eq('id', proposal.entity_id));
    } else return NextResponse.json({ error: 'Penghapusan jenis data ini tidak diizinkan.' }, { status: 409 });
  } else if (proposal.operation === 'create') {
    if (!Object.keys(patch).length) return NextResponse.json({ error: 'Data perubahan kosong.' }, { status: 400 });
    const conflict = proposal.entity_type === 'piket_student_roster' ? 'no_induk,unit_sekolah' : proposal.entity_type === 'posts' ? 'slug' : undefined;
    const result = await (supabaseAdmin as any).from(table).upsert(patch, conflict ? { onConflict: conflict } : undefined);
    applyError = result.error;
  } else {
    if (!Object.keys(patch).length) return NextResponse.json({ error: 'Data perubahan kosong.' }, { status: 400 });
    const { error } = await (supabaseAdmin as any).from(table).update(patch).eq('id', proposal.entity_id);
    applyError = error;
  }
  if (applyError) return NextResponse.json({ error: 'Perubahan gagal diterapkan; pengajuan tetap menunggu.' }, { status: 500 });
  const now = new Date().toISOString();
  await supabaseAdmin.from('universal_change_proposals').update({ status: 'approved', reviewed_by: reviewer.id, reviewed_at: now }).eq('id', proposal.id);
  if (proposal.entity_id) {
    await supabaseAdmin.from('universal_change_proposals').update({ status: 'duplicate', duplicate_of: proposal.id, reviewed_by: reviewer.id, reviewed_at: now })
      .eq('entity_type', proposal.entity_type).eq('entity_id', proposal.entity_id).eq('payload_sha256', proposal.payload_sha256).neq('id', proposal.id).in('status', ['pending','conflict']);
    await supabaseAdmin.from('universal_change_proposals').update({ status: 'rejected', reviewed_by: reviewer.id, reviewed_at: now })
      .eq('entity_type', proposal.entity_type).eq('entity_id', proposal.entity_id).neq('payload_sha256', proposal.payload_sha256).neq('id', proposal.id).in('status', ['pending','conflict']);
  }
  revalidatePath('/', 'layout'); revalidatePath('/posts'); revalidatePath('/people'); revalidatePath('/info');
  return NextResponse.json({ success: true, status: 'approved' });
}
