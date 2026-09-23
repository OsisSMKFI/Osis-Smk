
import React from 'react';
import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/metadata-helper';
import ClientSekbid5Page from './ClientSekbid5Page';

export const metadata: Metadata = generatePageMetadata({
  title: 'Sekbid 5 - Kesehatan & Lingkungan',
  description: 'Seksi Bidang 5 (Kesehatan & Lingkungan) OSIS SMK Informatika 2 Fithrah Insani. Menjaga kesehatan dan kelestarian lingkungan sekolah.',
  url: '/sekbid/sekbid-5',
  type: 'article',
});

export default function Page() {
  return <ClientSekbid5Page />;
}
