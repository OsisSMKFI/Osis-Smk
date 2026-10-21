"use client";
import { useEffect, useState } from 'react';

interface PendingUser { 
  id: string; 
  email: string; 
  name: string | null; 
  nickname?: string | null; 
  unit_sekolah?: string | null; 
  nik?: string | null; 
  nisn?: string | null; 
  requested_role?: string | null; 
  role: string; 
  created_at: string; 
  email_verified?: boolean;
  rejected?: boolean;
  rejection_reason?: string | null;
}

export default function PendingUsersPage() {
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkApproving, setBulkApproving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal memuat users');
      // API now returns { users: [...], fallback?: boolean }. Keep backward compat if array returned.
      const list: any[] = Array.isArray(json) ? json : (json.users || []);
      const pend = list.filter(u => !u.is_active && !u.rejected);
      const rej = list.filter(u => !u.is_active && u.rejected);
      setPending(pend);
      setRejected(rej);
      setSelectedIds(current => current.filter(id => pend.some((user: PendingUser) => user.id === id)));
    } catch (e: any) {
      setError(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function approve(id: string) {
    setApproving(id);
    try {
      const res = await fetch('/api/admin/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Gagal approve');
      await load();
    } catch (e: any) {
      setError(e.message || 'Gagal approve');
    } finally {
      setApproving(null);
    }
  }

  async function approveSelected() {
    if (!selectedIds.length) return;
    setBulkApproving(true);
    setError(null);
    try {
      const results = await Promise.all(selectedIds.map(async id => {
        const res = await fetch('/api/admin/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
        const body = await res.json();
        return { id, ok: res.ok, error: body.error as string | undefined };
      }));
      const failed = results.filter(result => !result.ok);
      if (failed.length) {
        setError(`${results.length - failed.length} akun disetujui. ${failed.length} gagal: ${failed[0].error || 'muat ulang lalu coba lagi'}`);
      }
      setSelectedIds([]);
      await load();
    } catch {
      setError('Persetujuan massal gagal karena koneksi. Muat ulang daftar dan coba lagi.');
    } finally {
      setBulkApproving(false);
    }
  }

  async function remove(id: string) {
    if(!confirm('Hapus user ini? Tindakan tidak dapat dibatalkan.')) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      const j = await res.json();
      if(!res.ok) throw new Error(j.error || 'Gagal hapus');
      await load();
    } catch(e:any){
      setError(e.message || 'Gagal hapus');
    }
  }

  async function rejectUser(id: string) {
    const reason = prompt('Alasan penolakan (opsional):') || '';
    try {
      const res = await fetch('/api/admin/users', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, reject: true, rejection_reason: reason }) });
      const j = await res.json();
      if(!res.ok) throw new Error(j.error || 'Gagal menolak user');
      await load();
    } catch(e:any){
      setError(e.message || 'Gagal menolak');
    }
  }

  const [rejected, setRejected] = useState<PendingUser[]>([]);
  async function restore(id: string) {
    if(!confirm('Pulihkan user ditolak kembali ke pending?')) return;
    try {
      const res = await fetch('/api/admin/users', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, restore: true }) });
      const j = await res.json();
      if(!res.ok) throw new Error(j.error || 'Gagal memulihkan');
      await load();
    } catch(e:any){
      setError(e.message || 'Gagal memulihkan');
    }
  }
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Pending Users</h1>
      {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
      {!loading && pending.length > 0 && <div className="mb-3 flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={pending.length > 0 && selectedIds.length === pending.length}
            onChange={event => setSelectedIds(event.target.checked ? pending.map(user => user.id) : [])}
            aria-label="Pilih semua akun menunggu persetujuan"
          />
          Pilih semua ({pending.length})
        </label>
        <button onClick={approveSelected} disabled={bulkApproving || selectedIds.length === 0} className="rounded bg-green-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {bulkApproving ? 'Menyetujui...' : `Setujui yang dipilih (${selectedIds.length})`}
        </button>
      </div>}
      {loading && <div className="text-sm">Memuat...</div>}
      {!loading && pending.length === 0 && <div className="text-sm text-gray-500">Tidak ada user pending.</div>}
      <ul className="space-y-3 mt-2">
        {pending.map(u => (
          <li key={u.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(u.id)}
                  onChange={event => setSelectedIds(current => event.target.checked ? [...current, u.id] : current.filter(id => id !== u.id))}
                  aria-label={`Pilih akun ${u.name || u.email}`}
                  className="mt-1"
                />
                <div>
                <div className="font-semibold text-sm">{u.name || '(Tanpa Nama)'} {u.nickname && <span className="text-gray-500 dark:text-gray-400 font-normal">({u.nickname})</span>}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{u.email}</div>
                <div className="text-[10px] mt-1 text-gray-500 dark:text-gray-400">Dibuat: {new Date(u.created_at).toLocaleString()}</div>
                <div className={`text-[10px] mt-1 ${u.email_verified ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-300'}`}>
                  {u.email_verified ? 'Email sudah diverifikasi' : 'Belum verifikasi email — akun belum bisa login'}
                </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => approve(u.id)}
                  disabled={approving === u.id}
                  className="px-3 py-1 rounded text-xs font-semibold bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white"
                >
                  {approving === u.id ? 'Memproses...' : 'Approve'}
                </button>
                <button
                  onClick={() => remove(u.id)}
                  className="px-3 py-1 rounded text-xs font-semibold bg-red-600 hover:bg-red-700 text-white"
                >
                  Hapus
                </button>
                <button
                  onClick={() => rejectUser(u.id)}
                  className="px-3 py-1 rounded text-xs font-semibold bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  Tolak
                </button>
              </div>
            </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-600 dark:text-gray-300">
              <div><span className="font-semibold">Unit:</span> {u.unit_sekolah || '-'}</div>
              <div><span className="font-semibold">NIK:</span> {u.nik || '-'}</div>
              <div><span className="font-semibold">NISN:</span> {u.nisn || '-'}</div>
              <div><span className="font-semibold">Role diminta:</span> {u.requested_role || '-'}</div>
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400">Status: pending approval • Current role: {u.role}</div>
          </li>
        ))}
      </ul>
      {rejected.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">User Ditolak</h2>
          <ul className="space-y-2">
            {rejected.map(r => (
              <li key={r.id} className="border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 rounded p-3 text-xs">
                <div className="font-semibold">{r.name || '(Tanpa Nama)'} • {r.email}</div>
                <div>Role diminta: {r.requested_role || '-'} • Dibuat: {new Date(r.created_at).toLocaleString()}</div>
                {r.rejection_reason && <div className="italic text-yellow-700 dark:text-yellow-300">Alasan: {r.rejection_reason}</div>}
                <div className="mt-2 flex gap-2">
                  <button onClick={() => restore(r.id)} className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded">Pulihkan</button>
                  <button onClick={() => remove(r.id)} className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded">Hapus</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
