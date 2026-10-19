'use client';

import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

type Student = {
  id: string; no_induk: string; name: string; unit_sekolah: string; kelas: string;
  name_aliases: string[]; is_active: boolean; has_account: boolean; updated_at: string;
};
type StudentInput = Pick<Student, 'no_induk' | 'name' | 'unit_sekolah' | 'kelas'> & { name_aliases: string };

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  const source = text.replace(/^\uFEFF/, '');
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted && character === '"' && source[index + 1] === '"') { field += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === ',' && !quoted) { row.push(field.trim()); field = ''; }
    else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && source[index + 1] === '\n') index += 1;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = []; field = '';
    } else field += character;
  }
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function normalizeHeader(value: string) { return value.normalize('NFC').toLowerCase().replace(/[\s_-]+/g, ''); }

export default function PiketRosterAdminPage() {
  const { data: session, status } = useSession();
  const role = (session?.user?.role || '').toLowerCase();
  const canManage = ['admin', 'super_admin'].includes(role);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StudentInput>({ no_induk: '', name: '', unit_sekolah: '', kelas: '', name_aliases: '' });
  const [importRows, setImportRows] = useState<StudentInput[]>([]);
  const [importName, setImportName] = useState('');

  const loadRoster = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/piket/roster', { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Roster gagal dimuat');
      setStudents(body.students || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Roster gagal dimuat');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (status === 'authenticated' && canManage) void loadRoster(); }, [status, canManage, loadRoster]);

  const handleCsv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setImportRows([]);
    setImportName('');
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Ukuran CSV maksimal 2 MB.'); return; }
    try {
      const parsed = parseCsv(await file.text());
      if (parsed.length < 2) throw new Error('CSV harus memiliki baris judul dan setidaknya satu data.');
      const headers = parsed[0].map(normalizeHeader);
      const indexFor = (names: string[]) => headers.findIndex((header) => names.includes(header));
      const indexes = {
        no_induk: indexFor(['noinduk', 'nomorinduk']),
        name: indexFor(['nama', 'name']),
        unit_sekolah: indexFor(['unitsekolah', 'unit']),
        kelas: indexFor(['kelas', 'class']),
        name_aliases: indexFor(['namapanggilan', 'alias', 'aliases']),
      };
      if (Object.values(indexes).some((index) => index < 0)) {
        throw new Error('Judul kolom wajib: No Induk, Nama, Unit Sekolah, Kelas.');
      }
      const rows = parsed.slice(1).map((values, rowIndex) => {
        const result = {
          no_induk: values[indexes.no_induk] || '',
          name: values[indexes.name] || '',
          unit_sekolah: values[indexes.unit_sekolah] || '',
          kelas: values[indexes.kelas] || '',
          name_aliases: indexes.name_aliases >= 0 ? values[indexes.name_aliases] || '' : '',
        };
        if (Object.values(result).some((value) => !value)) throw new Error(`Ada kolom kosong pada baris ${rowIndex + 2}.`);
        return result;
      });
      if (rows.length > 1000) throw new Error('Batas satu kali impor adalah 1000 baris.');
      setImportRows(rows);
      setImportName(file.name);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'CSV tidak dapat dibaca.');
      event.target.value = '';
    }
  };

  const importRoster = async () => {
    if (!importRows.length) return;
    setSaving(true);
    try {
      const response = await fetch('/api/piket/roster', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: importRows }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Impor gagal');
      toast.success(`${body.count} baris roster disimpan.`);
      setImportRows([]); setImportName('');
      await loadRoster();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Impor gagal');
    } finally { setSaving(false); }
  };

  const saveStudent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/piket/roster', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...form } : { students: [form] }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Data roster gagal disimpan');
      toast.success(editingId ? 'Data roster diperbarui.' : 'Siswa ditambahkan ke roster.');
      setEditingId(null); setForm({ no_induk: '', name: '', unit_sekolah: '', kelas: '', name_aliases: '' });
      await loadRoster();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Data roster gagal disimpan');
    } finally { setSaving(false); }
  };

  const toggleActive = async (student: Student) => {
    setSaving(true);
    try {
      const response = await fetch('/api/piket/roster', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: student.id, is_active: !student.is_active }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Status siswa gagal diubah');
      await loadRoster();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Status siswa gagal diubah');
    } finally { setSaving(false); }
  };

  const downloadTemplate = () => {
    const blob = new Blob(['No Induk,Nama,Unit Sekolah,Kelas,Nama Panggilan (opsional)\r\n'], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'template-roster-piket.csv'; anchor.click(); URL.revokeObjectURL(url);
  };

  const visibleStudents = students.filter((student) => `${student.no_induk} ${student.name} ${student.unit_sekolah} ${student.kelas}`.toLocaleLowerCase('id-ID').includes(search.toLocaleLowerCase('id-ID')));

  if (status === 'loading') return <main className="p-8">Memeriksa akses…</main>;
  if (!canManage) return <main className="p-8">Halaman pengelolaan roster hanya dapat dibuka Admin.</main>;

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <header>
        <Link href="/admin/attendance/piket" className="text-sm text-blue-700 hover:underline">← Kembali ke Piket Pagi</Link>
        <h1 className="mt-2 text-2xl font-bold">Daftar Siswa Piket</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Roster resmi menjadi sumber pencocokan QR. Siswa tidak perlu punya akun atau login.</p>
      </header>

      <section className="rounded-xl border bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-semibold">Impor daftar hadir</h2><p className="text-sm text-slate-500">CSV wajib berisi No Induk, Nama, Unit Sekolah, Kelas. Kolom Nama Panggilan opsional; tulis beberapa panggilan dengan pemisah koma atau titik koma agar sistem merekomendasikan nama resmi. Impor memperbarui No Induk dan unit yang sama. Untuk mengubah No Induk, edit baris roster agar tautan akun dan riwayat tetap terjaga.</p></div>
          <button type="button" onClick={downloadTemplate} className="rounded-md border px-3 py-2 text-sm">Unduh template CSV</button>
        </div>
        <input type="file" accept=".csv,text/csv" onChange={handleCsv} className="mt-4 block w-full text-sm" />
        {importRows.length > 0 && <div className="mt-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30"><p className="text-sm">{importName}: {importRows.length} baris siap diimpor. Periksa contoh data berikut.</p><div className="mt-3 overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b"><th className="p-2">No Induk</th><th className="p-2">Nama</th><th className="p-2">Unit</th><th className="p-2">Kelas</th></tr></thead><tbody>{importRows.slice(0, 5).map((student, index) => <tr key={`${student.no_induk}-${index}`}><td className="p-2">{student.no_induk}</td><td className="p-2">{student.name}</td><td className="p-2">{student.unit_sekolah}</td><td className="p-2">{student.kelas}</td></tr>)}</tbody></table></div><button type="button" onClick={() => void importRoster()} disabled={saving} className="mt-3 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Menyimpan…' : 'Impor roster'}</button></div>}
      </section>

      <section className="rounded-xl border bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="font-semibold">{editingId ? 'Edit data siswa' : 'Tambah satu siswa'}</h2>
        <form onSubmit={saveStudent} className="mt-3 grid gap-3 md:grid-cols-5">
          <input required aria-label="No Induk" placeholder="No Induk" value={form.no_induk} onChange={(event) => setForm({ ...form, no_induk: event.target.value })} className="rounded-md border px-3 py-2 dark:border-slate-700 dark:bg-slate-800" />
          <input required aria-label="Nama resmi" placeholder="Nama resmi persis" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="rounded-md border px-3 py-2 dark:border-slate-700 dark:bg-slate-800" />
          <input required aria-label="Unit sekolah" placeholder="Unit sekolah" value={form.unit_sekolah} onChange={(event) => setForm({ ...form, unit_sekolah: event.target.value })} className="rounded-md border px-3 py-2 dark:border-slate-700 dark:bg-slate-800" />
          <input required aria-label="Kelas" placeholder="Kelas" value={form.kelas} onChange={(event) => setForm({ ...form, kelas: event.target.value })} className="rounded-md border px-3 py-2 dark:border-slate-700 dark:bg-slate-800" />
          <input aria-label="Nama panggilan" placeholder="Nama panggilan (pisahkan koma)" value={form.name_aliases} onChange={(event) => setForm({ ...form, name_aliases: event.target.value })} className="rounded-md border px-3 py-2 dark:border-slate-700 dark:bg-slate-800" />
          <div className="flex gap-2"><button disabled={saving} className="flex-1 rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Menyimpan…' : editingId ? 'Simpan' : 'Tambah'}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ no_induk: '', name: '', unit_sekolah: '', kelas: '', name_aliases: '' }); }} className="rounded-md border px-3 py-2 text-sm">Batal</button>}</div>
        </form>
      </section>

      <section className="rounded-xl border bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Roster terdaftar</h2><p className="text-sm text-slate-500">{students.length} baris · {students.filter((student) => student.is_active).length} aktif</p></div><input aria-label="Cari siswa" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama atau No Induk" className="rounded-md border px-3 py-2 dark:border-slate-700 dark:bg-slate-800" /></div>
        <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="p-2">No Induk</th><th className="p-2">Nama resmi & panggilan</th><th className="p-2">Unit</th><th className="p-2">Kelas</th><th className="p-2">Akun</th><th className="p-2">Status</th><th className="p-2">Tindakan</th></tr></thead><tbody>
          {loading ? <tr><td colSpan={7} className="p-6 text-center">Memuat roster…</td></tr> : visibleStudents.length === 0 ? <tr><td colSpan={7} className="p-6 text-center text-slate-500">Data tidak ditemukan.</td></tr> : visibleStudents.map((student) => <tr key={student.id} className="border-b last:border-0"><td className="p-2 font-mono">{student.no_induk}</td><td className="p-2 font-medium">{student.name}{student.name_aliases.length > 0 && <span className="block text-xs font-normal text-slate-500">Panggilan: {student.name_aliases.join(', ')}</span>}</td><td className="p-2">{student.unit_sekolah}</td><td className="p-2">{student.kelas}</td><td className="p-2">{student.has_account ? 'Tertaut' : 'Tanpa akun'}</td><td className="p-2">{student.is_active ? 'Aktif' : 'Nonaktif'}</td><td className="p-2"><div className="flex gap-2"><button onClick={() => { setEditingId(student.id); setForm({ no_induk: student.no_induk, name: student.name, unit_sekolah: student.unit_sekolah, kelas: student.kelas, name_aliases: student.name_aliases.join(', ') }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-blue-700 underline">Edit</button><button disabled={saving} onClick={() => void toggleActive(student)} className="text-slate-600 underline disabled:opacity-50">{student.is_active ? 'Nonaktifkan' : 'Aktifkan'}</button></div></td></tr>)}
        </tbody></table></div>
      </section>
    </main>
  );
}
