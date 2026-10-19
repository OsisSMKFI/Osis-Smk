'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-hot-toast';

type PiketReport = { id: string; report_date: string; student_name: string; student_unit: string | null; student_class: string; student_no_induk: string | null; submitted_at: string };
type DataCorrection = { id: string; student_name: string; student_unit: string; student_class: string; details: string; suggested_name: string | null; suggested_unit: string | null; suggested_class: string | null; status: 'pending' | 'resolved' | 'dismissed'; submitted_at: string };
type PiketApproval = { report_count: number; approver_name: string; approved_at: string; snapshot_sha256: string } | null;

function todayJakarta() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short',
  }).format(new Date(value));
}

export default function PiketAttendancePage() {
  const { data: session, status } = useSession();
  const [reports, setReports] = useState<PiketReport[]>([]);
  const [corrections, setCorrections] = useState<DataCorrection[]>([]);
  const [approval, setApproval] = useState<PiketApproval>(null);
  const [date, setDate] = useState(todayJakarta);
  const [qrUrl, setQrUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const role = (session?.user?.role || '').toLowerCase();
  const canView = ['osis', 'guru', 'admin', 'super_admin'].includes(role);
  const canGenerate = ['osis', 'admin', 'super_admin'].includes(role);

  const loadReports = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    try {
      const [reportsResponse, correctionsResponse] = await Promise.all([
        fetch(`/api/piket/reports?date=${encodeURIComponent(date)}`, { cache: 'no-store' }),
        fetch(`/api/piket/corrections?date=${encodeURIComponent(date)}`, { cache: 'no-store' }),
      ]);
      const [body, correctionBody] = await Promise.all([reportsResponse.json(), correctionsResponse.json()]);
      if (!reportsResponse.ok) throw new Error(body.error || 'Rekap gagal dimuat');
      if (!correctionsResponse.ok) throw new Error(correctionBody.error || 'Keluhan gagal dimuat');
      setReports(body.reports || []);
      setApproval(body.approval || null);
      setCorrections(correctionBody.corrections || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Rekap gagal dimuat');
    } finally {
      setLoading(false);
    }
  }, [canView, date]);

  useEffect(() => {
    if (status === 'authenticated') void loadReports();
  }, [status, loadReports]);

  const generateQr = async () => {
    setWorking(true);
    try {
      const response = await fetch('/api/piket/sessions', { method: 'POST' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'QR gagal dibuat');
      setQrUrl(body.url);
      setExpiresAt(body.expiresAt);
      setDate(body.reportDate);
      await loadReports();
      toast.success('QR baru dibuat. QR sebelumnya dari akun ini sudah tidak berlaku.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'QR gagal dibuat');
    } finally {
      setWorking(false);
    }
  };

  const approveDay = async () => {
    if (!window.confirm(`Setujui seluruh ${reports.length} laporan tanggal ${date}? Setelah disetujui, laporan baru untuk tanggal itu ditutup.`)) return;
    setWorking(true);
    try {
      const response = await fetch('/api/piket/approve', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Persetujuan gagal');
      toast.success('Rekap harian disetujui.');
      await loadReports();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Persetujuan gagal');
    } finally {
      setWorking(false);
    }
  };

  const exportCsv = () => {
    const quote = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const csv = [
      ['Tanggal', 'Nama', 'No Induk', 'Unit Sekolah', 'Kelas', 'Waktu kirim'],
      ...reports.map((report) => [report.report_date, report.student_name, report.student_no_induk || '', report.student_unit || '', report.student_class, formatTime(report.submitted_at)]),
    ].map((row) => row.map((value) => quote(String(value))).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `rekap-piket-${date}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const updateCorrection = async (correction: DataCorrection, nextStatus: DataCorrection['status']) => {
    setWorking(true);
    try {
      const response = await fetch('/api/piket/corrections', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: correction.id, status: nextStatus }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Status keluhan gagal diperbarui');
      toast.success(nextStatus === 'resolved' ? 'Keluhan ditandai selesai.' : nextStatus === 'dismissed' ? 'Keluhan ditutup.' : 'Keluhan dibuka kembali.');
      await loadReports();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Status keluhan gagal diperbarui');
    } finally {
      setWorking(false);
    }
  };

  if (status === 'loading') return <main className="p-8">Memeriksa akses…</main>;
  if (!canView) return <main className="p-8">Akses Piket tidak tersedia untuk role ini.</main>;

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/attendance" className="text-sm text-blue-700 hover:underline">← Kembali ke Absensi</Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Piket Pagi</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">QR berlaku sampai akhir hari WIB. Generate ulang akan menonaktifkan QR sebelumnya dari akun ini.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['admin', 'super_admin'].includes(role) && <Link href="/admin/attendance/piket/roster" className="rounded-lg border px-4 py-2.5 text-sm font-semibold">Kelola roster siswa</Link>}
          {canGenerate && <button onClick={generateQr} disabled={working} className="rounded-lg bg-blue-700 px-4 py-2.5 font-semibold text-white disabled:opacity-60">{working ? 'Memproses…' : 'Generate QR'}</button>}
        </div>
      </header>

      {qrUrl && (
        <section className="flex flex-wrap items-center gap-6 rounded-xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/30">
          <div className="rounded-lg bg-white p-3"><QRCodeSVG value={qrUrl} size={190} level="H" includeMargin /></div>
          <div className="min-w-64 flex-1">
            <h2 className="text-lg font-semibold">QR aktif untuk {date}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Tautan ini dapat dipakai banyak siswa. Setiap siswa hanya dapat mengirim satu laporan per hari.</p>
            <p className="mt-2 break-all text-sm">{qrUrl}</p>
            <p className="mt-1 text-xs text-slate-500">Berakhir: {expiresAt ? formatTime(expiresAt) : 'akhir hari WIB'}</p>
            <button className="mt-3 rounded-md border px-3 py-1.5 text-sm" onClick={() => void navigator.clipboard.writeText(qrUrl).then(() => toast.success('Tautan disalin'))}>Salin tautan</button>
          </div>
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Rekap laporan</h2>
            <p className="text-sm text-slate-500">{reports.length} siswa tercatat untuk tanggal ini.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input aria-label="Tanggal rekap" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="rounded-md border px-3 py-2 dark:bg-slate-800" />
            <button onClick={exportCsv} disabled={!reports.length} className="rounded-md border px-3 py-2 disabled:opacity-50">Simpan CSV</button>
            {role === 'guru' && !approval && <button onClick={approveDay} disabled={working} className="rounded-md bg-emerald-700 px-3 py-2 font-semibold text-white disabled:opacity-50">Setujui rekap hari</button>}
          </div>
        </div>

        {approval && <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
          Disetujui oleh <strong>{approval.approver_name}</strong> pada {formatTime(approval.approved_at)} · {approval.report_count} laporan · sidik hash rekap {approval.snapshot_sha256.slice(0, 16)}…
        </div>}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b text-slate-500"><th className="p-2">No.</th><th className="p-2">Nama</th><th className="p-2">No Induk</th><th className="p-2">Unit sekolah</th><th className="p-2">Kelas</th><th className="p-2">Waktu kirim</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="p-6 text-center">Memuat rekap…</td></tr> : reports.length === 0 ? <tr><td colSpan={6} className="p-6 text-center text-slate-500">Belum ada laporan untuk tanggal ini.</td></tr> : reports.map((report, index) => <tr key={report.id} className="border-b last:border-0"><td className="p-2">{index + 1}</td><td className="p-2 font-medium">{report.student_name}</td><td className="p-2 font-mono">{report.student_no_induk || '—'}</td><td className="p-2">{report.student_unit || '—'}</td><td className="p-2">{report.student_class}</td><td className="p-2">{formatTime(report.submitted_at)}</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <div>
          <h2 className="text-lg font-semibold">Keluhan data siswa</h2>
          <p className="text-sm text-slate-500">Admin memperbaiki data utama di roster siswa, lalu menandai keluhan selesai. Perubahan roster otomatis disinkronkan ke akun siswa yang tertaut. {['admin', 'super_admin'].includes(role) && <Link href="/admin/attendance/piket/roster" className="font-medium text-blue-700 underline">Buka roster siswa</Link>}</p>
        </div>
        {corrections.length === 0 ? <p className="mt-4 text-sm text-slate-500">Belum ada keluhan untuk tanggal ini.</p> : <div className="mt-4 space-y-3">
          {corrections.map((correction) => <article key={correction.id} className="rounded-lg border p-4 dark:border-slate-700">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{correction.student_name} · {correction.student_unit} · {correction.student_class}</p>
                <p className="mt-1 text-sm">{correction.details}</p>
                {(correction.suggested_name || correction.suggested_unit || correction.suggested_class) && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Usulan: {[correction.suggested_name, correction.suggested_unit, correction.suggested_class].filter(Boolean).join(' · ')}</p>}
                <p className="mt-2 text-xs text-slate-500">{formatTime(correction.submitted_at)} · Status: {correction.status}</p>
              </div>
              {['admin', 'super_admin'].includes(role) && <div className="flex gap-2">
                {correction.status !== 'resolved' && <button onClick={() => void updateCorrection(correction, 'resolved')} disabled={working} className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Tandai selesai</button>}
                {correction.status === 'pending' && <button onClick={() => void updateCorrection(correction, 'dismissed')} disabled={working} className="rounded-md border px-3 py-2 text-sm disabled:opacity-50">Tutup</button>}
              </div>}
            </div>
          </article>)}
        </div>}
      </section>
    </main>
  );
}
