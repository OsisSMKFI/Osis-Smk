
import React from 'react';
import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/metadata-helper';
import ClientSekbid4Page from './ClientSekbid4Page';

export const metadata: Metadata = generatePageMetadata({
  title: 'Sekbid 4 - Olahraga & Kewirausahaan',
  description: 'Seksi Bidang 4 (Olahraga & Kewirausahaan) OSIS SMK Informatika 2 Fithrah Insani. Menyelenggarakan kegiatan olahraga dan mengembangkan jiwa kewirausahaan.',
  url: '/sekbid/sekbid-4',
  type: 'article',
});

export default function Page() {
  return <ClientSekbid4Page />;
}
