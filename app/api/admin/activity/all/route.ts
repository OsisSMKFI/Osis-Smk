// app/api/admin/activity/all/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { maybePurgeLogs } from '@/lib/logRetention';

/**
 * GET ALL USER ACTIVITIES - ADMIN ONLY
 * Includes anonymous users, IP tracking, full metadata
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // Check admin permission
    const userRole = (session.user.role || '').toLowerCase();
    if (!['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json({
        success: false,
        error: 'Forbidden: Admin access required'
      }, { status: 403 });
    }

    // Retention otomatis (throttled): activity > 14 hari dibuang
    // supaya tabel tidak penuh & panel tidak berat.
    await maybePurgeLogs(supabaseAdmin, 'activity');

    const { searchParams } = new URL(request.url);
    
    // Query parameters
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const activityType = searchParams.get('type');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const ipAddress = searchParams.get('ipAddress');
    const searchTerm = searchParams.get('search');

    console.log('[Admin Activity] Fetching all activities with filters:', {
      userId,
      activityType,
      status,
      startDate,
      endDate,
      ipAddress,
      searchTerm
    });

    // Build query
    let query = supabaseAdmin
      .from('activity_logs')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (activityType) {
      query = query.eq('activity_type', activityType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    if (ipAddress) {
      query = query.eq('ip_address', ipAddress);
    }

    if (searchTerm) {
      query = query.or(`user_email.ilike.%${searchTerm}%,user_name.ilike.%${searchTerm}%`);
    }

    const { data: activities, error, count } = await query;

    if (error) {
      console.error('[Admin Activity] Query error:', error);
      throw error;
    }

    // Calculate stats — pakai count query ringan (tanpa select semua baris)
    const stats = {
      total: count || 0,
      suspicious: 0,
      anonymous: 0,
      failed: 0
    };

    const [{ count: failedCount }, { count: anonCount }, { data: recentActs }] =
      await Promise.all([
        supabaseAdmin
          .from('activity_logs')
          .select('id', { count: 'exact', head: true })
          .is('deleted_at', null)
          .in('status', ['failure', 'error']),
        supabaseAdmin
          .from('activity_logs')
          .select('id', { count: 'exact', head: true })
          .is('deleted_at', null)
          .or('user_name.is.null,user_name.eq.Anonymous'),
        // 24 jam terakhir — deteksi suspicious berbasis jendela waktu,
        // bukan semua waktu (pindah IP selama berminggu-minggu itu normal)
        supabaseAdmin
          .from('activity_logs')
          .select('user_id, user_name, user_email, ip_address')
          .is('deleted_at', null)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      ]);

    stats.failed = failedCount || 0;
    stats.anonymous = anonCount || 0;

    if (recentActs) {
      // IP nyata saja (Unknown/kosong tidak dihitung)
      const ipByUser = new Map<string, Set<string>>();
      recentActs.forEach((a) => {
        const key = a.user_id || a.user_email || a.user_name;
        const ip = (a.ip_address || '').trim().toLowerCase();
        if (!key || !ip || ip === 'unknown' || ip === '-' || ip === 'n/a') return;
        if (!ipByUser.has(key)) ipByUser.set(key, new Set());
        ipByUser.get(key)!.add(ip);
      });
      // ≥6 IP nyata berbeda dalam 24 jam = patut dicurigai
      stats.suspicious = Array.from(ipByUser.values()).filter((ips) => ips.size >= 6).length;
    }

    console.log('[Admin Activity] Found:', count, 'activities');
    console.log('[Admin Activity] Stats:', stats);

    return NextResponse.json({
      success: true,
      data: {
        activities,
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > offset + limit
        },
        stats
      }
    });

  } catch (error: any) {
    console.error('[Admin Activity] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch activities'
    }, { status: 500 });
  }
}
