export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import React from 'react';
import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/metadata-helper';

export const metadata: Metadata = generatePageMetadata({
  title: 'Sekbid 1 - Keagamaan',
  description: 'Seksi Bidang 1 (Keagamaan) OSIS SMK Informatika 2 Fithrah Insani. Menangani kegiatan keagamaan dan spiritual siswa.',
  url: '/sekbid/sekbid-1',
  type: 'article',
});

export default function Page() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-3xl font-bold mb-4">Sekbid 1</h1>
      <p className="text-lg text-gray-600">Halaman utama Sekbid 1. Silakan pilih program insidental atau rutinan dari menu.</p>
    </div>
  );
}
