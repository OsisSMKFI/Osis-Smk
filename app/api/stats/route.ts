import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// Helper to detect core team roles
function isCoreTeamRole(position: string): boolean {
  const p = (position || '').trim().toLowerCase();
  return (
    /^ketua(\s+osis)?$/i.test(p) ||
    /^wakil(\s+ketua(\s+osis)?)?$/i.test(p) ||
    /^sekretaris(\s*\d+)?$/i.test(p) ||
    /^bendahara(\s*\d+)?$/i.test(p)
  );
}

// Helper to detect koordinator sekbid
function isKoordinator(position: string): boolean {
  const p = (position || '').trim().toLowerCase();
  return p === 'koordinator sekbid' || p === 'kepala departemen';
}

export async function GET() {
  try {
    // Fetch all data in parallel
    const [membersResult, postsResult, galleryResult] = await Promise.all([
      // Get all active members with sekbid info
      supabaseAdmin
        .from('members')
        .select('id, name, position, sekbid_id, sekbid:sekbid_id(id, name)')
        .eq('is_active', true),
      // Count posts/activities
      supabaseAdmin.from('posts').select('id', { count: 'exact', head: true }),
      // Count gallery items
      supabaseAdmin.from('gallery').select('id', { count: 'exact', head: true }),
    ]);

    const allMembers = (membersResult.data || []).filter((m: any) => {
      const sekbidId = m.sekbid_id;
      return sekbidId === null || (sekbidId >= 1 && sekbidId <= 6);
    });

    // Calculate statistics based on actual data
    let ketuaCount = 0;
    let coreTeamCount = 0; // Pengurus Inti (excluding Ketua)
    let koordinatorCount = 0;
    let anggotaSekbidCount = 0;
    const sekbidCounts: Record<number, number> = {};

    allMembers.forEach((m: any) => {
      const position = m.position || '';
      const sekbidId = m.sekbid_id;
      
      if (/^ketua(\s+osis)?$/i.test(position.trim())) {
        ketuaCount++;
      } else if (isCoreTeamRole(position)) {
        coreTeamCount++;
      } else if (isKoordinator(position)) {
        koordinatorCount++;
        // Count per sekbid
        if (sekbidId) {
          sekbidCounts[sekbidId] = (sekbidCounts[sekbidId] || 0);
        }
      } else if (sekbidId) {
        // Anggota Sekbid (has department but not coordinator/core)
        anggotaSekbidCount++;
        sekbidCounts[sekbidId] = (sekbidCounts[sekbidId] || 0) + 1;
      }
    });

    const totalMembers = allMembers.length;
    
    // Count unique sekbid that have members
    const activeSekbidCount = Object.keys(sekbidCounts).length;

    const stats = {
      year: 2024,
      // Total members
      totalMembers,
      activeMembers: totalMembers,
      // Breakdown
      ketuaCount, // Ketua OSIS
      coreTeamCount, // Pengurus Inti (Wakil, Sekretaris, Bendahara)
      koordinatorCount, // Koordinator Sekbid
      anggotaSekbidCount, // Anggota Sekbid
      // Sekbid details
      departments: activeSekbidCount || 6,
      sekbidCounts, // Per-sekbid member counts
      // Other stats
      activities: postsResult.count || 0,
      galleryItems: galleryResult.count || 0,
    };

    return NextResponse.json({
      success: true,
      code: 'STATS_OK',
      stats,
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=120',
      }
    });
  } catch (error: any) {
    console.error('Stats API error:', error);
    return NextResponse.json({
      success: false,
      code: 'STATS_ERROR',
      message: error.message,
      stats: {
        year: 2024,
        totalMembers: 0,
        activeMembers: 0,
        ketuaCount: 0,
        coreTeamCount: 0,
        koordinatorCount: 0,
        anggotaSekbidCount: 0,
        departments: 6,
        sekbidCounts: {},
        activities: 0,
        galleryItems: 0,
      },
    }, { status: 200 }); // Still return 200 with fallback data
  }
}
