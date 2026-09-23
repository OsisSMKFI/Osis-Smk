
import React from 'react';
import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/metadata-helper';

export const metadata: Metadata = generatePageMetadata({
  title: 'Sekbid 2 - Kaderisasi',
  description: 'Seksi Bidang 2 (Kaderisasi) OSIS SMK Informatika 2 Fithrah Insani. Membentuk karakter kepemimpinan dan kaderisasi anggota OSIS.',
  url: '/sekbid/sekbid-2',
  type: 'article',
});

export default function Page() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-3xl font-bold mb-4">Sekbid 2</h1>
      <p className="text-lg text-gray-600">Halaman utama Sekbid 2. Konten akan segera tersedia.</p>
    </div>
  );
}
