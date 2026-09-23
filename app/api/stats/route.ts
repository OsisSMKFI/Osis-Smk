import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// Helper to detect core team roles (same logic as PeopleSectionsClient)
// Note: DB uses 'role' or 'jabatan' column, not 'position'
function isCoreTeamRole(role: string): boolean {
  const r = (role || '').trim();
  return (
    /^ketua(\s+osis)?$/i.test(r) ||
    /^wakil(\s+ketua(\s+osis)?)?$/i.test(r) ||
    /^sekretaris(\s*\d+)?$/i.test(r) ||
    /^bendahara(\s*\d+)?$/i.test(r)
  );
}

// Helper to detect Ketua OSIS specifically
function isKetua(role: string): boolean {
  const r = (role || '').trim();
  return /^ketua(\s+osis)?$/i.test(r);
}

// Helper to detect koordinator sekbid
function isKoordinator(role: string): boolean {
  const r = (role || '').trim().toLowerCase();
  return r === 'koordinator sekbid' || r === 'kepala departemen';
}

export async function GET() {
  try {
    // Fetch all data in parallel - use simpler queries
    // Note: DB column is 'role' not 'position'
    const [membersResult, sekbidResult, postsResult, galleryResult] = await Promise.all([
      // Get ALL active members (no filtering here - filter in JS for consistency)
      supabaseAdmin
        .from('members')
        .select('id, name, role, sekbid_id, is_active')
        .eq('is_active', true),
      // Get sekbid count
      supabaseAdmin.from('sekbid').select('id, name'),
      // Count posts/activities
      supabaseAdmin.from('posts').select('id', { count: 'exact', head: true }),
      // Count gallery items
      supabaseAdmin.from('gallery').select('id', { count: 'exact', head: true }),
    ]);

    // Handle errors
    if (membersResult.error) {
      console.error('Stats API - Members fetch error:', membersResult.error);
      throw new Error('Failed to fetch members: ' + membersResult.error.message);
    }

    // Get all active members
    const allMembers = membersResult.data || [];
    
    // Get valid sekbid IDs from the sekbid table
    const validSekbidIds = new Set((sekbidResult.data || []).map((s: any) => s.id));
    
    // Filter members to only include those with valid sekbid or no sekbid (core team)
    const validMembers = allMembers.filter((m: any) => {
      return m.sekbid_id === null || validSekbidIds.has(m.sekbid_id);
    });

    // Calculate statistics (same logic as PeopleSectionsClient)
    let ketuaCount = 0;
    let coreTeamCount = 0; // Pengurus Inti excluding Ketua
    let koordinatorCount = 0;
    let anggotaSekbidCount = 0;
    const sekbidCounts: Record<number, number> = {};

    validMembers.forEach((m: any) => {
      // Use 'role' column (or fallback to 'jabatan')
      const memberRole = m.role || m.jabatan || '';
      const sekbidId = m.sekbid_id;
      
      if (isKetua(memberRole)) {
        // Ketua OSIS
        ketuaCount++;
      } else if (isCoreTeamRole(memberRole)) {
        // Core team (Wakil, Sekretaris, Bendahara) - not including Ketua
        coreTeamCount++;
      } else if (isKoordinator(memberRole)) {
        // Koordinator Sekbid
        koordinatorCount++;
      } else if (sekbidId) {
        // Anggota Sekbid (has department, not coordinator or core)
        anggotaSekbidCount++;
        sekbidCounts[sekbidId] = (sekbidCounts[sekbidId] || 0) + 1;
      }
      // else: unassigned members (no sekbid, not core team)
    });

    const totalMembers = validMembers.length;
    const departmentsCount = sekbidResult.data?.length || 6;

    const stats = {
      year: 2024,
      // Total members
      totalMembers,
      activeMembers: totalMembers,
      // Breakdown
      ketuaCount,
      coreTeamCount, // Pengurus Inti (excluding Ketua)
      koordinatorCount,
      anggotaSekbidCount,
      // Sekbid details
      departments: departmentsCount,
      sekbidCounts,
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
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
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
