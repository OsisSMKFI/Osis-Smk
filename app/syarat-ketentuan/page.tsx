import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Syarat dan Ketentuan',
  description: 'Syarat penggunaan situs OSIS SMK Informatika 2 Fithrah Insani.',
};

const sections = [
  {
    title: 'Tentang layanan',
    body: 'Situs OSIS SMK Informatika 2 Fithrah Insani menyediakan informasi kegiatan dan layanan digital sekolah, termasuk akun pengguna, pengumuman, kegiatan, dan fitur administrasi yang tersedia sesuai role.',
  },
  {
    title: 'Akun dan akses',
    body: 'Pengguna wajib memberikan informasi yang benar saat mendaftar, menjaga kerahasiaan kata sandi, dan segera memberi tahu pengelola jika menduga akun digunakan orang lain. Pendaftaran akun tidak otomatis memberikan akses: verifikasi email dan persetujuan admin dapat diperlukan. Setiap pengguna hanya boleh menggunakan fitur yang diizinkan untuk role akunnya.',
  },
  {
    title: 'Penggunaan yang diperbolehkan',
    body: 'Gunakan situs untuk keperluan informasi dan kegiatan sekolah. Jangan mengunggah data yang bukan hak Anda, mencoba mengakses akun atau data orang lain, mengganggu keamanan atau ketersediaan layanan, menyebarkan konten yang melanggar hukum, atau memakai situs untuk menipu maupun merugikan pihak lain.',
  },
  {
    title: 'Data dan kiriman pengguna',
    body: 'Pengguna bertanggung jawab atas kebenaran informasi, laporan, komentar, dan berkas yang dikirim melalui situs. Kiriman hanya digunakan untuk menjalankan fitur terkait, moderasi, keamanan, dan penanganan laporan. Pengelola dapat membatasi atau menghapus kiriman yang melanggar ketentuan atau membahayakan pengguna.',
  },
  {
    title: 'Ketersediaan dan perubahan layanan',
    body: 'Fitur dapat diperbarui, dihentikan sementara, atau diubah untuk pemeliharaan, keamanan, dan kebutuhan sekolah. Pengelola akan berupaya menjaga layanan tetap dapat digunakan, tetapi tidak menjamin situs selalu tersedia tanpa gangguan. Perubahan penting pada ketentuan akan ditampilkan di halaman ini dengan tanggal pembaruan.',
  },
  {
    title: 'Pembatasan akses',
    body: 'Akses dapat dibatasi atau ditangguhkan jika akun melanggar ketentuan, digunakan tanpa izin, atau menimbulkan risiko bagi keamanan dan kegiatan sekolah. Jika pembatasan terjadi karena kekeliruan, pengguna dapat menghubungi pengelola untuk meminta pemeriksaan.',
  },
  {
    title: 'Privasi',
    body: 'Pemrosesan data pribadi dijelaskan lebih lengkap dalam Kebijakan Privasi dan Cookie. Dengan memakai fitur yang meminta data, pengguna menyatakan telah membaca pemberitahuan yang berkaitan dengan fitur tersebut.',
  },
  {
    title: 'Kontak',
    body: 'Pertanyaan mengenai situs atau ketentuan ini dapat disampaikan kepada pengelola melalui osissmkinformatika2.fi@gmail.com.',
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6">
      <article className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-10">
        <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">OSIS SMK Informatika 2 Fithrah Insani</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Syarat dan Ketentuan</h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Berlaku mulai 21 Oktober 2026. Dengan menggunakan fitur situs, pengguna diminta mengikuti ketentuan berikut.</p>

        <div className="mt-8 space-y-7">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <p className="mt-2 leading-7 text-slate-700 dark:text-slate-300">{section.body}</p>
              {section.title === 'Privasi' && (
                <Link href="/kebijakan-privasi" className="mt-2 inline-block font-semibold text-amber-700 underline dark:text-amber-400">
                  Baca Kebijakan Privasi dan Cookie
                </Link>
              )}
            </section>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="rounded-lg bg-amber-500 px-5 py-3 font-semibold text-white hover:bg-amber-600">Beranda</Link>
          <Link href="/kebijakan-privasi" className="rounded-lg border border-slate-300 px-5 py-3 font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">Kebijakan Privasi</Link>
        </div>
      </article>
    </main>
  );
}
