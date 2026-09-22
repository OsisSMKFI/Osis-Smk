import React from 'react';
import { Metadata } from 'next';
import PeopleSectionsClient from '@/components/PeopleSectionsClient';
import PageHero from '@/components/animations/PageHero';
import { supabaseAdmin } from '@/lib/supabase/server';
import { convertToSignedUrl, extractPhotoPath } from '@/lib/signedUrls';
import { CURRENT_SUPABASE_PROJECT } from '@/lib/supabase/storage';
import { STATIC_METADATA } from '@/lib/metadata-helper';

export const metadata: Metadata = STATIC_METADATA.people;
export const revalidate = 0; // Always fetch fresh data

const SUPABASE_STORAGE_URL = `https://${CURRENT_SUPABASE_PROJECT}.supabase.co/storage/v1/object/public/gallery/members`;

function fixPhotoUrl(url: string | null | undefined): string {
  if (!url) return '/images/placeholder.svg';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/images/')) return url;
  if (url.startsWith('/')) return `https://${CURRENT_SUPABASE_PROJECT}.supabase.co/storage/v1/object/public${url}`;
  return `${SUPABASE_STORAGE_URL}/${url}`;
}

interface Member {
  id: number;
  name: string;
  role: string;
  photo_url?: string | null;
  instagram_username?: string | null;
  sekbid?: { id: number; name: string; color?: string; icon?: string } | null;
  quote?: string | null;
  display_order?: number;
}

export default async function PeoplePage() {
  // Fetch members directly from database (same query as API)
  let members: any[] = [];
  
  try {
    const { data: rawMembers, error } = await supabaseAdmin
      .from('members')
      .select('*, sekbid:sekbid_id(id, name, color, icon)')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching members:', error);
    } else {
      // Filter: only sekbid_id null (tim inti) or 1-6 (valid sekbid)
      const validMembers = (rawMembers || []).filter((m: any) => {
        const sekbidId = m.sekbid_id;
        return sekbidId === null || (sekbidId >= 1 && sekbidId <= 6);
      });

      // Transform to expected format — use signed URLs so photos work regardless of bucket public status
      const signedUrlPromises = validMembers.map(async (m: any) => {
        const storedUrl = m.photo_url;
        let imageUrl = '/images/placeholder.svg';

        if (storedUrl) {
          // Try signed URL first (works for both public and private buckets)
          const signed = await convertToSignedUrl(storedUrl, { bucket: 'gallery' });
          if (signed?.url) {
            imageUrl = signed.url;
          } else {
            // Fallback to fixed public URL
            imageUrl = fixPhotoUrl(storedUrl);
          }
        }

        const roleValue = m.role || 'Anggota';
        return {
          id: m.id || 0,
          name: m.name || 'Data Tidak Tersedia',
          position: roleValue,
          description: m.quote || '',
          image: imageUrl,
          instagram_username: m.instagram || m.instagram_username || undefined,
          kelas: m.class || m.kelas || undefined,
          department: m.sekbid?.name || undefined,
          departmentId: m.sekbid?.id ?? null,
          displayOrder: m.display_order || 0,
        };
      });

      members = await Promise.all(signedUrlPromises);
    }
  } catch (error) {
    console.error('Error fetching members:', error);
  }

  console.log('[PeoplePage] Loaded members count:', members.length);
  const sortedMembers = members.slice().sort((a, b) => {
    const aOrder = (a as any).display_order ?? (a as any).order_index ?? 0;
    const bOrder = (b as any).display_order ?? (b as any).order_index ?? 0;
    return aOrder - bOrder;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <PageHero
        title="Anggota OSIS"
        subtitle="Tim Kami"
        description="Daftar anggota OSIS yang aktif berkontribusi untuk sekolah"
        icon={<i className="fas fa-users text-4xl" />}
        gradient="yellow"
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <PeopleSectionsClient members={sortedMembers} />
      </div>
    </div>
  );
}
