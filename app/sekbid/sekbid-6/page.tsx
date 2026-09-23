
import React from 'react';
import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/metadata-helper';

export const metadata: Metadata = generatePageMetadata({
  title: 'Sekbid 6 - Publikasi & Dokumentasi',
  description: 'Seksi Bidang 6 (Publikasi & Dokumentasi) OSIS SMK Informatika 2 Fithrah Insani. Mengelola publikasi, dokumentasi, dan teknologi informasi OSIS.',
  url: '/sekbid/sekbid-6',
  type: 'article',
});

export default function Page() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-3xl font-bold mb-4">Sekbid 6</h1>
      <p className="text-lg text-gray-600">Halaman utama Sekbid 6. Konten akan segera tersedia.</p>
    </div>
  );
}
