import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi dan Cookie',
  description: 'Informasi tentang data yang digunakan, cookie, keamanan, dan hak pengguna di situs OSIS SMK Informatika 2 Fithrah Insani.',
};

const sections = [
  {
    title: 'Data yang diproses',
    body: 'Saat membuat akun, situs dapat memproses nama, nama panggilan, email, unit sekolah, kelas, role yang diminta, kata sandi dalam bentuk hash, serta NIK dan nama pengguna Instagram jika diisi. Sistem juga mencatat waktu pendaftaran dan status verifikasi email serta persetujuan kebijakan. Jika menggunakan fitur lain, situs dapat memproses data yang dibutuhkan fitur tersebut, seperti laporan keterlambatan, alasan, tanda tangan yang dikirim, komentar, polling, dan aktivitas akun.',
  },
  {
    title: 'Tujuan penggunaan',
    body: 'Data digunakan untuk membuat dan mengamankan akun, memverifikasi email, mengatur role dan persetujuan akses, menjalankan fitur situs termasuk administrasi kegiatan sekolah, menanggapi laporan atau keluhan, serta mendiagnosis gangguan teknis. Data tidak boleh digunakan untuk tujuan baru yang tidak dijelaskan kepada pengguna.',
  },
  {
    title: 'Dasar dan persetujuan',
    body: 'Pendaftaran meminta persetujuan yang jelas sebelum akun dibuat. Persetujuan pendaftaran dicatat bersama versi kebijakan dan waktu yang dibuat server. Beberapa pemrosesan dapat diperlukan untuk menyediakan fitur yang diminta, menjaga keamanan layanan, atau memenuhi kewajiban hukum. Untuk data pribadi anak, persetujuan orang tua atau wali harus diperoleh sesuai ketentuan yang berlaku; pengguna yang belum berusia 18 tahun perlu meminta persetujuan orang tua/wali sebelum mendaftar.',
  },
  {
    title: 'Cookie, penyimpanan lokal, dan analitik',
    body: 'Cookie sesi digunakan untuk autentikasi dan keamanan saat pengguna masuk. Preferensi tampilan seperti tema dan bahasa disimpan di penyimpanan lokal browser. Situs ini juga memuat Vercel Web Analytics dan Speed Insights untuk statistik penggunaan serta kinerja; dokumentasi Vercel menyatakan Web Analytics tidak menggunakan cookie dan mengolah statistik agregat. Saat ini kode situs tidak memuat cookie iklan. Jika integrasi atau tujuan pemrosesan berubah, informasi ini perlu diperbarui.',
  },
  {
    title: 'Penyedia layanan dan akses data',
    body: 'Data hanya dapat diakses oleh personel yang berwenang sesuai role dan kebutuhan tugas. Situs menggunakan penyedia hosting, basis data, email, analitik, dan layanan AI sesuai konfigurasi yang aktif. Penyedia tersebut dapat memproses data untuk menyediakan layanan; data tidak boleh dibagikan untuk tujuan iklan. Jangan kirim kata sandi atau data pribadi sensitif melalui fitur chat atau kolom yang tidak memerlukannya.',
  },
  {
    title: 'Penyimpanan dan keamanan',
    body: 'Kata sandi disimpan dalam bentuk hash, bukan teks biasa. Sistem menerapkan pembatasan akses berdasarkan role dan menggunakan koneksi terenkripsi saat tersedia. Data disimpan selama akun atau fitur masih diperlukan, lalu dihapus atau dianonimkan ketika tidak lagi diperlukan, kecuali ada kewajiban penyimpanan lain. Jangka waktu retensi khusus untuk setiap jenis data harus ditetapkan oleh pengelola sekolah.',
  },
  {
    title: 'Hak pengguna dan permintaan bantuan',
    body: 'Pengguna dapat meminta akses atau koreksi data, menarik persetujuan yang bergantung pada persetujuan, meminta penghapusan atau pembatasan pemrosesan jika berlaku, dan mengajukan keluhan. Penarikan persetujuan tidak membatalkan pemrosesan yang telah dilakukan secara sah sebelumnya. Hubungi pengelola melalui email kontak di bawah; permintaan mungkin perlu diverifikasi agar data tidak diberikan kepada orang yang salah.',
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6">
      <article className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-10">
        <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">OSIS SMK Informatika 2 Fithrah Insani</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Kebijakan Privasi dan Cookie</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Versi 21 Oktober 2026. Kebijakan ini menjelaskan data yang diproses situs dan cara menghubungi pengelola.</p>

        <div className="mt-8 space-y-7">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <p className="mt-2 leading-7 text-slate-700 dark:text-slate-300">{section.body}</p>
            </section>
          ))}
        </div>

        <section className="mt-8 rounded-xl bg-slate-100 p-5 dark:bg-slate-800">
          <h2 className="text-xl font-semibold">Kontak privasi</h2>
          <p className="mt-2 leading-7 text-slate-700 dark:text-slate-300">Untuk permintaan atau pertanyaan tentang data pribadi, hubungi pengelola situs melalui email sekolah:</p>
          <a className="mt-2 inline-block font-semibold text-amber-700 underline dark:text-amber-400" href="mailto:osissmkinformatika2.fi@gmail.com">osissmkinformatika2.fi@gmail.com</a>
        </section>

        <section className="mt-8 border-t border-slate-200 pt-6 text-sm leading-6 text-slate-600 dark:border-slate-700 dark:text-slate-400">
          <h2 className="font-semibold text-slate-800 dark:text-slate-200">Rujukan resmi</h2>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li><a className="underline" href="https://jdih.komdigi.go.id/produk_hukum/view/id/832/t/undangundang%2Bnomor%2B27%2Btahun%2B2022" target="_blank" rel="noreferrer">UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi</a></li>
            <li><a className="underline" href="https://peraturan.bpk.go.id/Details/122030/pp-no-71-tahun-2019" target="_blank" rel="noreferrer">PP No. 71 Tahun 2019 tentang Penyelenggaraan Sistem dan Transaksi Elektronik</a></li>
            <li><a className="underline" href="https://peraturan.bpk.go.id/Details/316698/pp-no-17-tahun-2025" target="_blank" rel="noreferrer">PP No. 17 Tahun 2025 tentang Tata Kelola Penyelenggaraan Sistem Elektronik dalam Pelindungan Anak</a></li>
            <li><a className="underline" href="https://peraturan.bpk.go.id/Details/346040/permenkomdigi-no-9-tahun-2026" target="_blank" rel="noreferrer">Permenkomdigi No. 9 Tahun 2026</a></li>
          </ul>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/register" className="rounded-lg bg-amber-500 px-5 py-3 font-semibold text-white hover:bg-amber-600">Kembali ke pendaftaran</Link>
          <Link href="/" className="rounded-lg border border-slate-300 px-5 py-3 font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">Beranda</Link>
        </div>
      </article>
    </main>
  );
}
