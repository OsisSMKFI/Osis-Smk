import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Fetch stats from database
    const [membersResult, postsResult, galleryResult] = await Promise.all([
      // Count active members
      supabaseAdmin.from('members').select('id', { count: 'exact', head: true }).eq('is_active', true),
      // Count posts/activities
      supabaseAdmin.from('posts').select('id', { count: 'exact', head: true }),
      // Count gallery items
      supabaseAdmin.from('gallery').select('id', { count: 'exact', head: true }),
    ]);

    const stats = {
      year: 2024, // Year established
      activeMembers: membersResult.count || 0,
      departments: 6, // Fixed: 6 seksi bidang
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
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
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
        activeMembers: 50,
        departments: 6,
        activities: 20,
        galleryItems: 0,
      },
    }, { status: 200 }); // Still return 200 with fallback data
  }
}
