import { createHash } from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase/server';

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

export async function stageUniversalChange(input: {
  actorId: string; sessionKey?: string; entityType: string; entityId: string | null;
  operation: 'create' | 'update' | 'delete'; beforeData?: unknown; proposedData: unknown;
}) {
  const { data: user, error: userError } = await supabaseAdmin.from('users').select('is_universal').eq('id', input.actorId).maybeSingle();
  if (userError) throw userError;
  if (!user?.is_universal) return null;
  const { data: session, error: sessionError } = await supabaseAdmin.from('app_sessions').select('id')
    .eq('session_key', input.sessionKey || '').eq('user_id', input.actorId).is('revoked_at', null).maybeSingle();
  if (sessionError || !session) throw new Error('Sesi universal tidak valid; login ulang sebelum mengubah data.');
  const payloadHash = createHash('sha256').update(canonical({
    entityType: input.entityType, entityId: input.entityId, operation: input.operation, proposedData: input.proposedData,
  })).digest('hex');
  let duplicateOf: string | null = null;
  let status: 'pending' | 'duplicate' | 'conflict' = 'pending';
  if (input.entityId) {
    const { data: existing, error } = await supabaseAdmin.from('universal_change_proposals')
      .select('id,payload_sha256,status').eq('entity_type', input.entityType).eq('entity_id', input.entityId)
      .in('status', ['pending', 'conflict']).order('created_at', { ascending: true }).limit(20);
    if (error) throw error;
    const same = existing?.find((item) => item.payload_sha256 === payloadHash);
    const root = same ? (same.status === 'duplicate' ? same.id : same.id) : existing?.[0]?.id;
    if (same) { status = 'duplicate'; duplicateOf = root || null; }
    else if (existing?.length) {
      status = 'conflict';
      await supabaseAdmin.from('universal_change_proposals').update({ status: 'conflict' }).in('id', existing.map((item) => item.id));
    }
  }
  const { data, error } = await supabaseAdmin.from('universal_change_proposals').insert({
    actor_user_id: input.actorId, actor_session_id: session.id, entity_type: input.entityType,
    entity_id: input.entityId, operation: input.operation, before_data: input.beforeData || null,
    proposed_data: input.proposedData, payload_sha256: payloadHash, status, duplicate_of: duplicateOf,
  }).select('id,status,duplicate_of').single();
  if (error) throw error;
  return data;
}
