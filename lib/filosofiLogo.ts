export type FilosofiLogoElement = {
  icon: string;
  imageSrc: string;
  title: string;
  description: string;
  color: string;
  gradient: string;
};

// Default filosofi logo elements — dipakai API /api/public/filosofi-logo
// dan knowledge base AI (lib/aiAutoLearn) supaya konsisten saat DB kosong.
export const DEFAULT_FILOSOFI: FilosofiLogoElement[] = [
  {
    icon: '🏫',
    imageSrc: '/images/Fitrah Insani.svg',
    title: 'Fithrah Insani',
    description:
      'Identitas OSIS yaitu SMK Informatika Fithrah Insani. Nama ini mencerminkan nilai-nilai fitrah manusia yang suci dan islami sebagai landasan pendidikan.',
    color: '#22c55e',
    gradient: 'bg-gradient-to-r from-green-500 to-emerald-600',
  },
  {
    icon: '⚡',
    imageSrc: '/images/Garis dan Titik.svg',
    title: 'Titik & Garis',
    description:
      'Persatuan dalam perbedaan masing-masing anggota. Seperti titik dan garis yang membentuk kesatuan, setiap anggota OSIS memiliki keunikan yang saling melengkapi.',
    color: '#3b82f6',
    gradient: 'bg-gradient-to-r from-blue-500 to-indigo-600',
  },
  {
    icon: '🛡️',
    imageSrc: '/images/Perisai.svg',
    title: 'Perisai',
    description:
      'Pelindung untuk melindungi seluruh anggotanya. Simbol perlindungan dan keamanan bagi seluruh warga sekolah dalam menjalankan aktivitas organisasi.',
    color: '#f59e0b',
    gradient: 'bg-gradient-to-r from-amber-500 to-yellow-600',
  },
  {
    icon: '✏️',
    imageSrc: '/images/Pensil dan pulpen.svg',
    title: 'Pensil & Pulpen',
    description:
      'Anggota adalah seorang pelajar. Melambangkan semangat belajar dan menulis ilmu yang tidak pernah padam sebagai identitas utama siswa.',
    color: '#ef4444',
    gradient: 'bg-gradient-to-r from-red-500 to-rose-600',
  },
  {
    icon: '📸',
    imageSrc: '/images/kamera.svg',
    title: 'Kamera',
    description:
      'Menegaskan pelajar yaitu pelajar multimedia. Simbol kreativitas dalam bidang multimedia, fotografi, dan videografi sebagai keahlian utama jurusan.',
    color: '#a855f7',
    gradient: 'bg-gradient-to-r from-purple-500 to-violet-600',
  },
];
