'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type FormState = { name: string; unit: string; kelas: string };
type MatchedStudent = { name: string; unit: string; kelas: string };
type StudentOption = { unit: string; kelas: string };

export default function PiketStudentFormPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [form, setForm] = useState<FormState>({ name: '', unit: '', kelas: '' });
  const [matchedStudent, setMatchedStudent] = useState<MatchedStudent | null>(null);
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [status, setStatus] = useState<'loading' | 'active' | 'invalid' | 'sent'>('loading');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctionSent, setCorrectionSent] = useState(false);

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

  const updateForm = (next: FormState) => {
    setForm(next);
    setMatchedStudent(null);
    setStudentOptions([]);
    setError('');
    setCorrectionSent(false);
  };

  const checkStudent = async () => {
    setError('');
    setMatchedStudent(null);
    setStudentOptions([]);
    if (!form.name.trim()) {
      setError('Nama lengkap wajib diisi.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`/api/piket/${encodeURIComponent(token)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'lookup', name: form.name.trim() }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Data siswa tidak cocok');
      if (body.student) {
        setForm({ name: body.student.name, unit: body.student.unit, kelas: body.student.kelas });
        setMatchedStudent(body.student);
      } else if (Array.isArray(body.candidates)) {
        setStudentOptions(body.candidates);
      } else {
        throw new Error('Data siswa tidak dapat diperiksa.');
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Data siswa tidak cocok');
    } finally {
      setSubmitting(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!matchedStudent) {
      setError('Periksa data siswa terlebih dahulu.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`/api/piket/${encodeURIComponent(token)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), unit: form.unit.trim(), kelas: form.kelas.trim() }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Laporan tidak dapat dikirim');
      setForm({ name: '', unit: '', kelas: '' });
      setMatchedStudent(null);
      setStatus('sent');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Laporan tidak dapat dikirim');
    } finally {
      setSubmitting(false);
    }
  };

  const submitCorrection = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const formData = new FormData(event.currentTarget);
    setSubmitting(true);
    try {
      const response = await fetch(`/api/piket/${encodeURIComponent(token)}/corrections`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          unit: formData.get('reportedUnit') || form.unit,
          kelas: formData.get('reportedClass') || form.kelas,
          details: formData.get('details'), suggestedName: formData.get('suggestedName'),
          suggestedUnit: formData.get('suggestedUnit'), suggestedClass: formData.get('suggestedClass'),
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Keluhan belum dapat dikirim');
      setCorrectionSent(true);
      setShowCorrection(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Keluhan belum dapat dikirim');
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
        {status === 'sent' && <div className="mt-5 rounded-lg bg-emerald-50 p-4 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"><h2 className="font-semibold">Data berhasil dikirim</h2><p className="mt-1 text-sm">Laporan keterlambatan hari {date} sudah tercatat. Ikuti arahan petugas OSIS.</p><button type="button" onClick={() => { setStatus('active'); setCorrectionSent(false); setShowCorrection(false); setError(''); }} className="mt-4 rounded-lg border border-emerald-800 px-3 py-2 text-sm font-semibold">Isi untuk siswa berikutnya</button></div>}
        {status === 'active' && <>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Isi nama persis seperti daftar hadir. Unit sekolah, kelas, dan No Induk dicocokkan otomatis dari data akun. Login tidak diperlukan.</p>
          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            <label className="block text-sm font-medium">Nama lengkap
              <input required autoComplete="name" maxLength={120} value={form.name} onChange={(event) => updateForm({ name: event.target.value, unit: '', kelas: '' })} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950" />
            </label>
            {studentOptions.length > 0 && <fieldset className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30"><legend className="px-1 text-sm font-semibold">Ada beberapa siswa dengan nama ini. Pilih unit dan kelas Anda.</legend><div className="mt-2 space-y-2">{studentOptions.map((option, index) => <label key={`${option.unit}-${option.kelas}-${index}`} className="flex cursor-pointer items-center gap-2 rounded-md bg-white p-3 text-sm dark:bg-slate-900"><input type="radio" name="studentOption" onChange={() => { const student = { name: form.name.trim(), unit: option.unit, kelas: option.kelas }; setForm(student); setMatchedStudent(student); setStudentOptions([]); setError(''); }} /><span>{option.unit} · {option.kelas}</span></label>)}</div></fieldset>}
            {matchedStudent && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100"><p className="font-semibold">Periksa data siswa</p><dl className="mt-2 grid grid-cols-[7rem_1fr] gap-y-1"><dt>Nama</dt><dd>{matchedStudent.name}</dd><dt>Unit</dt><dd>{matchedStudent.unit}</dd><dt>Kelas</dt><dd>{matchedStudent.kelas}</dd><dt>No Induk</dt><dd>No Induk tersimpan akan dilampirkan ke rekap.</dd></dl></div>}
            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">{error}</p>}
            {!matchedStudent ? <button type="button" onClick={checkStudent} disabled={submitting} className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white disabled:opacity-60">{submitting ? 'Memeriksa…' : 'Periksa data siswa'}</button> : <button type="submit" disabled={submitting} className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white disabled:opacity-60">{submitting ? 'Mengirim…' : 'Konfirmasi dan kirim'}</button>}
          </form>
          <p className="mt-4 text-xs text-slate-500">Tanggal laporan: {date}. Jika nama, unit, atau kelas tidak cocok, minta bantuan petugas OSIS.</p>
          <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
            {correctionSent ? <p className="text-sm text-emerald-700 dark:text-emerald-300">Keluhan terkirim. Petugas OSIS atau Admin akan memeriksa data yang Anda laporkan.</p> : <button type="button" onClick={() => { setShowCorrection(!showCorrection); setError(''); }} className="text-sm font-medium text-blue-700 underline dark:text-blue-300">Data saya tidak cocok? Ajukan keluhan</button>}
            {showCorrection && <form onSubmit={submitCorrection} className="mt-3 space-y-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
              <p className="text-sm text-slate-600 dark:text-slate-300">Petugas akan meninjau keluhan ini. Data akun resmi hanya dapat diperbaiki oleh Admin.</p>
              <label className="block text-sm font-medium">Unit sekolah Anda
                <input required name="reportedUnit" maxLength={80} defaultValue={form.unit} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" />
              </label>
              <label className="block text-sm font-medium">Kelas Anda
                <input required name="reportedClass" maxLength={40} defaultValue={form.kelas} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" />
              </label>
              <label className="block text-sm font-medium">Jelaskan bagian yang keliru
                <textarea required name="details" maxLength={1000} rows={3} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950" />
              </label>
              <details>
                <summary className="cursor-pointer text-sm">Usulkan data yang benar (opsional)</summary>
                <div className="mt-2 space-y-2">
                  <input name="suggestedName" maxLength={120} placeholder="Nama yang benar" className="block w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" />
                  <input name="suggestedUnit" maxLength={80} placeholder="Unit sekolah yang benar" className="block w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" />
                  <input name="suggestedClass" maxLength={40} placeholder="Kelas yang benar" className="block w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-950" />
                </div>
              </details>
              {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
              <button type="submit" disabled={submitting} className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{submitting ? 'Mengirim…' : 'Kirim keluhan'}</button>
            </form>}
          </div>
        </>}
      </section>
    </main>
  );
}
