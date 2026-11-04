/**
 * Default konten publik — identik dengan fallback di app/about/AboutPageClient.tsx,
 * lib/translations.ts (id), dan components/Footer.tsx.
 *
 * Dipakai knowledge base AI (lib/aiAutoLearn) saat key CMS belum terisi di
 * database `page_content`, supaya jawaban AI = tampilan halaman sungguhan.
 * Saat admin menyimpan konten asli lewat Admin → Content, nilai DB yang menang.
 */
export const PUBLIC_CONTENT_DEFAULTS = {
  philosophy: {
    title: 'Filosofi Nama OSIS',
    highlight: 'Raveka Sena',
    part1: 'Nama',
    nameHighlight: 'RAVEKA SENA',
    part2: 'terdiri dari dua kata:',
    skyHighlight: '"Raveka" (sinar terang) dan "Sena" (pasukan)',
    part3: ', yang berarti "pasukan yang menjadi sinar terang".',
    desc1:
      'Filosofi ini mencerminkan semangat OSIS untuk menjadi pasukan yang membawa cahaya perubahan, inovasi, dan inspirasi bagi seluruh siswa SMK Informatika Fithrah Insani. Nama ini juga mencerminkan semangat',
    desc2: 'untuk seluruh warga sekolah.',
  },
  vision:
    'Menjadi organisasi siswa yang unggul, inovatif, dan berkarakter islami dalam membentuk generasi pemimpin masa depan yang berwawasan teknologi dan berjiwa kepemimpinan.',
  missions: [
    'Mengembangkan potensi kepemimpinan siswa melalui berbagai kegiatan organisasi',
    'Menumbuhkan kreativitas dan inovasi dalam setiap program kerja',
    'Menanamkan nilai-nilai keislaman dalam setiap aktivitas',
    'Membangun kerjasama yang solid antar anggota dan stakeholder',
  ],
  values: [
    { name: 'Inovasi', desc: 'Berlandaskan aqidahyang benar, berakhlak islami, menjadikan Allah sebagai pusat kehidupan' },
    { name: 'Integritas', desc: 'Unggul dalam keilmuan, komitmen, mutu, inovasi, dan standar tinggi dalam setiap aspek' },
    { name: 'Keunggulan', desc: 'Peduli kepada sesama, peka terhadap lingkungan, adab islami dalam interaksi sosial' },
    { name: 'Islami', desc: 'Mandiri, berjiwa kepemimpinan, bersemangat kewirausahaan, dan adaptif terhadapt perubahan' },
    { name: 'Youthfull', desc: 'Penuh semangat, terbuka terhadap pertumbuhan, menginspirasi dan berenergi positif.' },
  ],
  school: {
    name: 'SMK Informatika Fithrah Insani',
    address: 'Jl. H. Gofur No. 10 Tanimulya, Ngamprah, Kab. Bandung Barat',
    phone: '(022) 87805564',
    email: 'osissmkinformatika2.fi@gmail.com',
  },
};

/** Rangkai kalimat utama filosofi nama OSIS dari potongan default. */
export function buildDefaultPhilosophyKalimat(): string {
  const p = PUBLIC_CONTENT_DEFAULTS.philosophy;
  return [p.part1, p.nameHighlight, p.part2, p.skyHighlight, p.part3]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
