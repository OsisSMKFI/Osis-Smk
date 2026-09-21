import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing. Server-side admin operations will fail.');
}
// Do not log secrets. Avoid printing SUPABASE_SERVICE_ROLE_KEY even in development.
// Server-only Supabase client using the Service Role key (never expose to client)
// Created lazily on first use so `next build` (page data collection) does not
// require secrets to be present at module-evaluation time.
let adminClient: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (!adminClient) {
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        'Supabase admin client is not configured: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
      );
    }
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    // Provide a safe fallback for `rpc` in environments where the client
    // doesn't expose it (some test mocks or lightweight Supabase clients).
    if (typeof (adminClient as any).rpc !== 'function') {
      (adminClient as any).rpc = async (fnName: string, payload?: any) => {
        console.warn(`supabaseAdmin.rpc fallback called for ${fnName}; rpc not available on client`);
        return { data: null, error: new Error('rpc not available') };
      };
    }
  }
  return adminClient;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin() as any;
    const value = client[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
  has(_target, prop) {
    return prop in (getSupabaseAdmin() as any);
  },
});

/**
 * Safe RPC wrapper that callers can import to avoid checking `supabaseAdmin.rpc`
 * at each callsite. Returns the same shape as supabase-js `{ data, error }`.
 */
export async function safeRpc(fnName: string, payload?: any) {
  if (typeof (supabaseAdmin as any).rpc === 'function') {
    try {
      return await (supabaseAdmin as any).rpc(fnName, payload);
    } catch (e) {
      console.warn('safeRpc rpc call failed', fnName, e);
      return { data: null, error: e };
    }
  }
  console.warn(`safeRpc: rpc not available for ${fnName}`);
  return { data: null, error: new Error('rpc not available') };
}

/**
 * Fetch the freshest role for a user from the database.
 * Ensures RBAC decisions reflect current DB state.
 */
export async function fetchUserRole(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
    if (error) {
      console.warn('fetchUserRole error', error);
      return null;
    }
    return (data?.role || '').trim().toLowerCase() || null;
  } catch (e) {
    console.warn('fetchUserRole exception', e);
    return null;
  }
}
