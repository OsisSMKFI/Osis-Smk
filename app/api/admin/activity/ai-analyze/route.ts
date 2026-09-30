// app/api/admin/activity/ai-analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * AI-POWERED ACTIVITY ANALYSIS (rule-based, realistis)
 *
 * Prinsip:
 *  - IP "Unknown"/kosong TIDAK dihitung sebagai IP berbeda.
 *  - Sinyal dinilai dalam jendela 24 JAM (bukan semua waktu) — pindah
 *    jaringan/mobile selama berminggu-minggu itu normal, bukan kompromi.
 *  - Risk level = level TERTINGGI dari semua flag (bukan terakhir).
 *  - Aktivitas normal (login sukses, chat, dst.) tidak diberi flag.
 */

type Risk = 'low' | 'medium' | 'high' | 'critical';
const RISK_ORDER: Risk[] = ['low', 'medium', 'high', 'critical'];

function isRealIP(ip: any): boolean {
  if (!ip || typeof ip !== 'string') return false;
  const v = ip.trim().toLowerCase();
  if (!v || v === 'unknown' || v === '-' || v === 'n/a') return false;
  return /^[0-9a-f.:]+$/i.test(v); // IPv4/IPv6 dasar
}

function raiseRisk(current: Risk, next: Risk): Risk {
  return RISK_ORDER.indexOf(next) > RISK_ORDER.indexOf(current) ? next : current;
}

export async function POST(request: NextRequest) {
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

    const { activities } = await request.json();

    console.log('[AI Analysis] Analyzing', activities?.length, 'activities');

    if (!Array.isArray(activities)) {
      return NextResponse.json({
        success: false,
        error: 'activities must be an array'
      }, { status: 400 });
    }

    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const fifteenMinAgo = now - 15 * 60 * 1000;

    // Group per user (fallback: email, lalu nama)
    const byUser = new Map<string, any[]>();
    activities.forEach((a: any) => {
      const key = a.user_id || a.user_email || a.user_name || '__anon__';
      if (!byUser.has(key)) byUser.set(key, []);
      byUser.get(key)!.push(a);
    });

    const analysis: Record<string, any> = {};
    let suspiciousCount = 0;

    activities.forEach((activity: any) => {
      const flags: string[] = [];
      const suggestions: string[] = [];
      let riskLevel: Risk = 'low';
      let autoFixable = false;

      const userActs: any[] = byUser.get(
        activity.user_id || activity.user_email || activity.user_name || '__anon__'
      ) || [];

      // IP nyata dalam 24 jam terakhir
      const realIPs24h = new Set(
        userActs
          .filter((a: any) => new Date(a.created_at).getTime() > dayAgo)
          .map((a: any) => (isRealIP(a.ip_address) ? a.ip_address.trim() : null))
          .filter(Boolean)
      );

      // --- 1. Percobaan login gagal ---
      if (activity.activity_type === 'login' && activity.status === 'failure') {
        flags.push('Percobaan login gagal');
        riskLevel = raiseRisk(riskLevel, 'medium');
        suggestions.push('Pantau percobaan berikutnya; brute force biasanya datang beruntun');

        const recentFailures = userActs.filter(
          (a: any) =>
            a.activity_type === 'login' &&
            a.status === 'failure' &&
            new Date(a.created_at).getTime() > fifteenMinAgo
        ).length;
        if (recentFailures >= 4) {
          flags.push(`Login gagal berulang (${recentFailures}x dalam 15 menit)`);
          riskLevel = raiseRisk(riskLevel, 'high');
          suggestions.push('Kemungkinan brute force — pertimbangkan rate limit login / lock sementara');
        }
      }

      // --- 2. Banyak IP nyata dalam 24 jam ---
      if (realIPs24h.size >= 10) {
        flags.push(`${realIPs24h.size} IP berbeda dalam 24 jam`);
        riskLevel = raiseRisk(riskLevel, 'high');
        suggestions.push('Sangat tidak wajar — akun mungkin dibagikan atau dikompromikan');
      } else if (realIPs24h.size >= 6) {
        flags.push(`${realIPs24h.size} IP berbeda dalam 24 jam`);
        riskLevel = raiseRisk(riskLevel, 'medium');
        suggestions.push('Bisa VPN/pindah jaringan, tapi pantau bila berlanjut');
      }

      // --- 3. Aktivitas anonim hanya berisiko untuk aksi sensitif ---
      const sensitiveTypes = ['login', 'logout', 'admin_action', 'user_management'];
      if (
        sensitiveTypes.includes(activity.activity_type) &&
        (!activity.user_name || activity.user_name === 'Anonymous')
      ) {
        flags.push('Aksi sensitif tanpa identitas user');
        riskLevel = raiseRisk(riskLevel, 'medium');
        suggestions.push('Identifikasi user atau batasi aksi untuk sesi anonim');
      }

      // --- 4. Jam wajar (hanya sinyal lemah, sendirian tidak membuat medium) ---
      const hour = new Date(activity.created_at).getHours();
      if (hour >= 0 && hour < 5) {
        flags.push('Aktivitas di luar jam wajar (00:00–05:00)');
        riskLevel = raiseRisk(riskLevel, 'low');
        suggestions.push('Normal bila jarang; jadikan concern hanya bila sering + sinyal lain');
      }

      // --- 5. Frekuensi tinggi: >20 aktivitas user yang sama dalam 1 menit ---
      const oneMinAgo = now - 60000;
      const recentActs = userActs.filter(
        (a: any) => new Date(a.created_at).getTime() > oneMinAgo
      );
      if (recentActs.length > 20) {
        flags.push(`Frekuensi sangat tinggi (${recentActs.length} aktivitas/menit)`);
        riskLevel = raiseRisk(riskLevel, 'critical');
        suggestions.push('Kemungkinan bot atau request otomatis');
      }

      // --- 6. Impossible travel (butuh data lokasi) ---
      if (activity.location_data && activity.location_data.latitude) {
        const prev = userActs.find(
          (a: any) =>
            a.id !== activity.id &&
            a.location_data?.latitude &&
            new Date(a.created_at) < new Date(activity.created_at)
        );
        if (prev?.location_data) {
          const distance = calculateDistance(
            activity.location_data.latitude,
            activity.location_data.longitude,
            prev.location_data.latitude,
            prev.location_data.longitude
          );
          const timeDiffH =
            (new Date(activity.created_at).getTime() -
              new Date(prev.created_at).getTime()) /
            1000 /
            3600;
          if (distance > 100 && timeDiffH < 1) {
            flags.push(`Perpindahan tak mungkin: ${distance.toFixed(0)} km dalam ${timeDiffH.toFixed(1)} jam`);
            riskLevel = raiseRisk(riskLevel, 'critical');
            suggestions.push('Akun mungkin sedang dipakai pihak lain');
          }
        }
      }

      // --- 7. Banyak perangkat dalam 24 jam ---
      const devices24h = new Set(
        userActs
          .filter(
            (a: any) =>
              new Date(a.created_at).getTime() > dayAgo && a.device_info?.device_type
          )
          .map((a: any) => a.device_info.device_type)
      );
      if (devices24h.size > 3) {
        flags.push(`${devices24h.size} jenis perangkat berbeda dalam 24 jam`);
        riskLevel = raiseRisk(riskLevel, 'medium');
        suggestions.push('Pastikan semua perangkat milik user yang sama');
      }

      // --- 8. Status error ---
      if (activity.status === 'error') {
        flags.push('Aktivitas berakhir dengan error');
        riskLevel = raiseRisk(riskLevel, 'medium');
        if (
          activity.error_message?.includes('network') ||
          activity.error_message?.includes('timeout')
        ) {
          autoFixable = true;
          suggestions.push('Auto-fix: retry dengan exponential backoff');
        } else {
          suggestions.push('Cek detail error untuk investigasi manual');
        }
      }

      // Selalu simpan hasil (risiko default 'low', flags kosong = wajar)
      // supaya panel menampilkan badge konsisten, bukan hanya baris "bermasalah".
      if (flags.length > 0 && riskLevel !== 'low') {
        suspiciousCount++;
      }
      analysis[activity.id] = {
        risk_level: riskLevel,
        flags,
        suggestions,
        auto_fixable: autoFixable
      };
    });

    console.log(
      '[AI Analysis] Done —',
      suspiciousCount,
      'suspicious (medium+) dari',
      activities.length
    );

    return NextResponse.json({
      success: true,
      data: {
        analysis,
        summary: {
          total_analyzed: activities.length,
          suspicious_count: suspiciousCount,
          critical_count: Object.values(analysis).filter((a: any) => a.risk_level === 'critical').length,
          auto_fixable_count: Object.values(analysis).filter((a: any) => a.auto_fixable).length
        }
      }
    });

  } catch (error: any) {
    console.error('[AI Analysis] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'AI analysis failed'
    }, { status: 500 });
  }
}

// Haversine distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
