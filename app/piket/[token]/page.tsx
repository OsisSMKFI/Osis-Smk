'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type FormState = { name: string; kelas: string; nisn: string };

export default function PiketStudentFormPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [form, setForm] = useState<FormState>({ name: '', kelas: '', nisn: '' });
  const [status, setStatus] = useState<'loading' | 'active' | 'invalid' | 'sent'>('loading');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/piket/${encodeURIComponent(token)}`, { cache: 'no-store' })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Tautan tidak tersedia');
        if (alive) { setDate(body.reportDate); setStatus('active'); }
      })
      .catch(() => { if (alive) setStatus('invalid'); });
    return () => { alive = false; };
  }, [token]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!form.name.trim() || !form.kelas.trim() || !form.nisn.trim()) {
      setError('Nama, kelas, dan NISN wajib diisi.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`/api/piket/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), kelas: form.kelas.trim(), nisn: form.nisn.trim() }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Laporan tidak dapat dikirim');
      setForm({ name: '', kelas: '', nisn: '' });
      setStatus('sent');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Laporan tidak dapat dikirim');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-semibold text-blue-700">OSIS SMK Informatika Fithrah Insani</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Form Piket Pagi</h1>
        {status === 'loading' && <p className="mt-5 text-slate-600">Memeriksa tautan QR…</p>}
        {status === 'invalid' && <p className="mt-5 rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-950/30 dark:text-red-200">Tautan QR ini tidak aktif atau sudah kedaluwarsa. Minta QR terbaru kepada petugas OSIS.</p>}
        {status === 'sent' && <div className="mt-5 rounded-lg bg-emerald-50 p-4 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"><h2 className="font-semibold">Data berhasil dikirim</h2><p className="mt-1 text-sm">Laporan keterlambatan hari {date} sudah tercatat. Ikuti arahan petugas OSIS.</p><button type="button" onClick={() => setStatus('active')} className="mt-4 rounded-lg border border-emerald-800 px-3 py-2 text-sm font-semibold">Isi untuk siswa berikutnya</button></div>}
        {status === 'active' && <>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Isi semua data sesuai akun siswa yang terdaftar. Formulir ini tidak meminta login.</p>
          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <label className="block text-sm font-medium">Nama lengkap
              <input required autoComplete="name" maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950" />
            </label>
            <label className="block text-sm font-medium">Kelas
              <input required maxLength={40} value={form.kelas} onChange={(event) => setForm({ ...form, kelas: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950" />
            </label>
            <label className="block text-sm font-medium">NISN
              <input required inputMode="numeric" autoComplete="off" maxLength={32} value={form.nisn} onChange={(event) => setForm({ ...form, nisn: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950" />
            </label>
            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">{error}</p>}
            <button type="submit" disabled={submitting} className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white disabled:opacity-60">{submitting ? 'Mengirim…' : 'Kirim laporan'}</button>
          </form>
          <p className="mt-4 text-xs text-slate-500">Tanggal laporan: {date}. Data hanya dikirim ke sistem absensi sekolah.</p>
        </>}
      </section>
    </main>
  );
}
