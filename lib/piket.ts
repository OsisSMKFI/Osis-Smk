import { auth } from '@/lib/auth';
import { fetchUserRole, supabaseAdmin } from '@/lib/supabase/server';

export const PIKET_VIEW_ROLES = ['osis', 'guru', 'admin', 'super_admin'] as const;
export const PIKET_GENERATE_ROLES = ['osis', 'admin', 'super_admin'] as const;

export async function getPiketActor() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  const [role, { data: user, error }] = await Promise.all([
    fetchUserRole(userId),
    supabaseAdmin.from('users').select('name,email').eq('id', userId).maybeSingle(),
  ]);
  if (!role || error || !user) return null;
  return {
    id: userId,
    name: user.name?.trim() || user.email || 'Pengguna',
    role,
  };
}

export function jakartaDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function jakartaEndOfDay(dateKey = jakartaDateKey()) {
  const [year, month, day] = dateKey.split('-').map(Number);
  // Jakarta is UTC+7; this instant is 00:00 at the start of the next local day.
  return new Date(Date.UTC(year, month - 1, day, 17, 0, 0));
}

export function isDateKey(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
