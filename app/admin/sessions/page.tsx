'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type Entry = { id: string; alias: string | null; user_agent: string | null; ip_address: string | null; created_at: string; last_seen_at: string; expires_at: string; revoked_at: string | null; user: { name: string | null; email: string; role: string; is_universal: boolean } | null };

export default function AdminSessionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState('');
  const [working, setWorking] = useState<string | null>(null);
  const load = useCallback(async () => {
    const response = await fetch('/api/admin/sessions', { cache: 'no-store' });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'Sesi tidak dapat dimuat');
    setEntries(body.sessions || []);
  }, []);
  useEffect(() => { if (status === 'unauthenticated') router.replace('/admin/login'); }, [status, router]);
  useEffect(() => { if (status === 'authenticated') void load().catch((e) => setError(e.message)); }, [status, load]);
  const revoke = async (id: string) => {
    setWorking(id); setError('');
    try {
      const response = await fetch('/api/admin/sessions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: id }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Sesi gagal dicabut');
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Sesi gagal dicabut'); }
    finally { setWorking(null); }
  };
  const role = (session?.user?.role || '').toLowerCase();
  if (status === 'loading') return <main className="p-8">Memuat sesi…</main>;
  if (!['admin','super_admin'].includes(role)) return <main className="p-8">Akses admin diperlukan.</main>;
  return <main className="mx-auto max-w-5xl space-y-4 p-4 md:p-8">
    <h1 className="text-2xl font-bold">Sesi akun</h1>
    <p className="text-sm text-slate-600">IP dan informasi perangkat disimpan paling lama 90 hari untuk audit sesi. Perubahan IP tidak otomatis memutus login.</p>
    {error && <p role="alert" className="rounded bg-red-50 p-3 text-red-800">{error}</p>}
    {entries.map((entry) => <article key={entry.id} className="rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3"><div>
        <h2 className="font-semibold">{entry.user?.name || entry.user?.email || 'Akun'}{entry.alias ? ` · ${entry.alias}` : ''}</h2>
        <p className="text-sm text-slate-600">{entry.user?.role}{entry.user?.is_universal ? ' · Universal' : ''} · IP {entry.ip_address || 'tidak tercatat'}</p>
        <p className="text-xs text-slate-500">Masuk {new Date(entry.created_at).toLocaleString('id-ID')} · aktif {new Date(entry.last_seen_at).toLocaleString('id-ID')} · berakhir {new Date(entry.expires_at).toLocaleString('id-ID')}</p>
        <p className="mt-1 break-all text-xs text-slate-500">{entry.user_agent || 'Perangkat tidak diketahui'}{entry.revoked_at ? ` · Dicabut ${new Date(entry.revoked_at).toLocaleString('id-ID')}` : ''}</p>
      </div>{!entry.revoked_at && <button disabled={working === entry.id} onClick={() => void revoke(entry.id)} className="rounded bg-red-700 px-3 py-2 text-sm text-white disabled:opacity-50">{working === entry.id ? 'Memproses…' : 'Cabut sesi'}</button>}</div>
    </article>)}
    {!entries.length && <p className="rounded border p-4 text-slate-600">Belum ada sesi login yang tercatat.</p>}
  </main>;
}
