import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Simple in-memory rate limit per IP: 10 attempts / minute
const RATE_LIMIT = 10;
const WINDOW_MS = 60_000;

function getAttempts(): Map<string, { n: number; t: number }> {
  const g = globalThis as any;
  if (!g.__diagnoseAttempts) g.__diagnoseAttempts = new Map<string, { n: number; t: number }>();
  return g.__diagnoseAttempts;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const attempts = getAttempts();
    const now = Date.now();
    const entry = attempts.get(ip);
    if (entry && now - entry.t < WINDOW_MS) {
      if (entry.n >= RATE_LIMIT) {
        return NextResponse.json(
          { ok: false, message: 'Terlalu banyak percobaan. Coba lagi beberapa saat lagi.' },
          { status: 429 }
        );
      }
      entry.n++;
    } else {
      attempts.set(ip, { n: 1, t: now });
    }

    const { email: rawEmail, password } = await req.json();
    const email = (rawEmail || '').trim().toLowerCase();

    if (!email || !password) {
      return NextResponse.json({ ok: false, message: 'Email dan password harus diisi' }, { status: 400 });
    }

    const { supabaseAdmin } = await import('@/lib/supabase/server');
    const bcrypt = (await import('bcryptjs')).default;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, password_hash, email_verified, approved, role')
      .ilike('email', email)
      .single();

    // Same message for unknown email / no password / wrong password
    // so attackers cannot enumerate registered accounts.
    const INVALID = 'Email atau password salah. Periksa kembali atau minta admin untuk reset password.';

    if (error || !user || !user.password_hash) {
      return NextResponse.json({ ok: false, message: INVALID }, { status: 200 });
    }

    const valid = await bcrypt.compare(password, user.password_hash as string);
    if (!valid) {
      return NextResponse.json({ ok: false, message: INVALID }, { status: 200 });
    }

    if (!user.email_verified) {
      return NextResponse.json({ ok: false, message: `Email "${user.email}" belum diverifikasi. Silakan cek inbox email Anda dan klik link verifikasi. Jika tidak menemukan email, cek folder spam.` }, { status: 200 });
    }

    if (!user.approved) {
      return NextResponse.json({ ok: false, message: `Akun Anda (${user.email}) sudah terdaftar dan email terverifikasi, tetapi belum disetujui oleh admin. Role Anda saat ini: ${user.role || 'belum ditentukan'}. Silakan tunggu approval dari Super Admin.` }, { status: 200 });
    }

    return NextResponse.json({ ok: true, message: 'OK', role: user.role || null }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e.message || 'Diagnosa login gagal' }, { status: 500 });
  }
}
