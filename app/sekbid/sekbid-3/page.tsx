
import React from 'react';
import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/metadata-helper';

export const metadata: Metadata = generatePageMetadata({
  title: 'Sekbid 3 - Akademik',
  description: 'Seksi Bidang 3 (Akademik) OSIS SMK Informatika 2 Fithrah Insani. Mendukung kegiatan akademik dan pengembangan ilmu pengetahuan siswa.',
  url: '/sekbid/sekbid-3',
  type: 'article',
});

export default function Page() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-3xl font-bold mb-4">Sekbid 3</h1>
      <p className="text-lg text-gray-600">Halaman utama Sekbid 3. Konten akan segera tersedia.</p>
    </div>
  );
}
