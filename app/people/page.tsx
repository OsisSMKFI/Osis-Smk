import React from 'react';
import { Metadata } from 'next';
import PeopleSectionsClient from '@/components/PeopleSectionsClient';
import PageHero from '@/components/animations/PageHero';
import { supabaseAdmin } from '@/lib/supabase/server';
import { STATIC_METADATA } from '@/lib/metadata-helper';

export const metadata: Metadata = STATIC_METADATA.people;
export const revalidate = 0; // Always fetch fresh data

// Fix incomplete URLs stored as just filenames
const SUPABASE_STORAGE_URL = 'https://mhefqwregrldvxtqqxbb.supabase.co/storage/v1/object/public/gallery/members';

function fixPhotoUrl(url: string | null | undefined): string {
  if (!url) return '/images/placeholder.svg';
  // Already a full URL
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Local path
  if (url.startsWith('/images/')) return url;
  // Path starting with /
  if (url.startsWith('/')) return `https://mhefqwregrldvxtqqxbb.supabase.co/storage/v1/object/public${url}`;
  // Just a filename - construct full URL
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

      // Transform to expected format
      members = validMembers.map((m: any) => {
        // Use role as-is from database - NO cleaning needed
        // This ensures proper detection in PeopleSectionsClient
        const roleValue = m.role || 'Anggota';
        
        return {
          id: m.id || 0,
          name: m.name || 'Data Tidak Tersedia',
          position: roleValue, // Use actual role from DB
          description: m.quote || '',
          image: fixPhotoUrl(m.photo_url),
          instagram_username: m.instagram || m.instagram_username || undefined,
          kelas: m.class || m.kelas || undefined,
          department: m.sekbid?.name || undefined, // Only set if has sekbid
          departmentId: m.sekbid?.id ?? null,
          displayOrder: m.display_order || 0,
        };
      });
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
