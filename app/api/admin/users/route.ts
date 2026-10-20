import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/apiAuth';
import { createClient } from '@supabase/supabase-js';
import { ASSIGNABLE_USER_ROLES } from '@/lib/rbac';
import { validatePassword } from '@/lib/passwordPolicy';
export const runtime = 'nodejs';

const ALLOWED_ROLES = new Set<string>(ASSIGNABLE_USER_ROLES);

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // If service role missing, try anon fallback (read-only). Avoid hard 500 so admin UI still shows something.
    let client: any = supabaseAdmin;
    let usingFallback = false;
    if (!serviceRole) {
      if (supabaseUrl && anonKey) {
        console.warn('[admin/users GET] Service role missing, using anon fallback');
        client = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
        usingFallback = true;
      } else {
        console.error('[admin/users GET] Missing Supabase env vars (service + anon)');
        return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
      }
    }
    const authErr = await requirePermission('users:read');
    if (authErr) return authErr;

    const { data, error } = await client
      .from('users')
      .select('id, email, name, nickname, unit_sekolah, kelas, nik, nisn, no_induk, requested_role, role, photo_url, approved, rejected, rejection_reason, email_verified, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[admin/users GET] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const users = (data || [])
      .filter((u: any) => u.id && u.email)
      .map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.name ?? null,
        nickname: u.nickname ?? null,
        unit_sekolah: u.unit_sekolah ?? null,
        kelas: u.kelas ?? null,
        nik: u.nik ?? null,
        nisn: u.nisn ?? null,
        no_induk: u.no_induk ?? null,
        requested_role: u.requested_role ?? null,
        role: (u.role || 'osis'),
        is_active: !!u.approved,
        rejected: !!u.rejected,
        rejection_reason: u.rejection_reason ?? null,
        email_verified: !!u.email_verified,
        profile_image: u.photo_url ?? null,
        created_at: u.created_at,
        updated_at: u.updated_at,
        last_login: null as string | null,
      }));

    console.log(`[admin/users GET] Returning ${users.length} users${usingFallback ? ' (anon fallback)' : ''}`);
    // Return array directly for backward compatibility
    return NextResponse.json(users);
  } catch (e: any) {
    console.error('[admin/users GET] Unexpected error', e);
    return NextResponse.json({ error: e.message || 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('[admin/users POST] Missing Supabase env vars');
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }
    const authErr = await requirePermission('users:create');
    if (authErr) return authErr;

    const body = await request.json();
    const { email, name, role, password, is_active, profile_image, reject, rejection_reason, nickname, unit_sekolah, kelas, nik, nisn, no_induk, instagram_username } = body;
    if (is_active !== undefined && typeof is_active !== 'boolean') {
      return NextResponse.json({ error: 'Status aktif harus berupa boolean' }, { status: 400 });
    }
    if (reject !== undefined && typeof reject !== 'boolean') {
      return NextResponse.json({ error: 'Status penolakan tidak valid' }, { status: 400 });
    }

    if (typeof email !== 'string' || typeof name !== 'string' || !email.trim() || !name.trim()) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254) {
      return NextResponse.json({ error: 'Format email tidak valid' }, { status: 400 });
    }
    if (normalizedName.length < 3 || normalizedName.length > 120) {
      return NextResponse.json({ error: 'Nama harus terdiri dari 3 sampai 120 karakter' }, { status: 400 });
    }
    if (typeof password !== 'string') {
      return NextResponse.json({ error: 'Password wajib diisi' }, { status: 400 });
    }
    const passwordError = validatePassword(password);
    if (passwordError) return NextResponse.json({ error: `Password tidak valid: ${passwordError}` }, { status: 400 });

    const dbRole = role === undefined ? 'siswa' : role;
    if (typeof dbRole !== 'string' || !ALLOWED_ROLES.has(dbRole)) {
      return NextResponse.json({ error: `Invalid role: ${String(dbRole)}` }, { status: 400 });
    }
    if (dbRole !== 'siswa') {
      const roleErr = await requirePermission('users:role_assign');
      if (roleErr) return roleErr;
    }

    const bcrypt = (await import('bcryptjs')).default;
    const saltRoundsRaw = Number(process.env.PASSWORD_SALT_ROUNDS ?? 10);
    const saltRounds = Number.isInteger(saltRoundsRaw) && saltRoundsRaw >= 10 && saltRoundsRaw <= 14 ? saltRoundsRaw : 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        email: normalizedEmail,
        name: normalizedName,
        nickname: nickname || null,
        unit_sekolah: unit_sekolah || null,
        kelas: kelas || null,
        nik: nik || null,
        nisn: nisn || null,
        no_induk: no_induk || null,
        instagram_username: instagram_username || null,
        role: dbRole,
        password_hash: passwordHash,
        email_verified: true,
        approved: reject ? false : (is_active ?? true),
        rejected: !!reject,
        rejection_reason: reject ? (rejection_reason || 'Ditolak tanpa alasan tertulis') : null,
        photo_url: profile_image ?? null,
      })
      .select('id, email, name, nickname, unit_sekolah, kelas, nik, nisn, no_induk, role, photo_url, approved, rejected, rejection_reason, created_at')
      .single();

    if (error) throw error;

    const result = {
      id: data.id,
      email: data.email,
      name: data.name,
      nickname: data.nickname,
      unit_sekolah: data.unit_sekolah,
      kelas: data.kelas,
      nik: data.nik,
      nisn: data.nisn,
      no_induk: data.no_induk,
      role: data.role,
      is_active: !!data.approved,
      email_verified: true,
      rejected: !!data.rejected,
      rejection_reason: data.rejection_reason ?? null,
      profile_image: data.photo_url ?? null,
      created_at: data.created_at,
      last_login: null as string | null,
    };

    return NextResponse.json({ success: true, data: result });
  } catch (e: any) {
    console.error('[admin/users POST] Unexpected error', e);
    return NextResponse.json({ error: e.message || 'Failed to create user' }, { status: 500 });
  }
}

// Approve or reject existing user (sets approved=true or rejected=true) - requires users:approve permission
export async function PUT(request: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('[admin/users PUT] Missing Supabase env vars');
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }
    const authErr = await requirePermission('users:approve');
    if (authErr) return authErr;
    const body = await request.json().catch(() => ({}));
    const id = body.id as string | undefined;
    const reject = body.reject;
    const rejection_reason = body.rejection_reason;
    const restore = body.restore;
    if (!id) {
      return NextResponse.json({ error: 'User id diperlukan' }, { status: 400 });
    }
    if ((reject !== undefined && typeof reject !== 'boolean') || (restore !== undefined && typeof restore !== 'boolean')) {
      return NextResponse.json({ error: 'Aksi persetujuan tidak valid' }, { status: 400 });
    }
    if (reject === true && restore === true) {
      return NextResponse.json({ error: 'Pilih satu aksi: tolak atau pulihkan' }, { status: 400 });
    }
    if (rejection_reason !== undefined && (typeof rejection_reason !== 'string' || rejection_reason.length > 1000)) {
      return NextResponse.json({ error: 'Alasan penolakan tidak valid (maksimal 1000 karakter)' }, { status: 400 });
    }

    const { data: target, error: targetError } = await supabaseAdmin
      .from('users')
      .select('id, role, requested_role, approved, rejected')
      .eq('id', id)
      .maybeSingle();
    if (targetError) throw targetError;
    if (!target) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    if (restore === true && !target.rejected) {
      return NextResponse.json({ error: 'Hanya akun yang ditolak yang dapat dipulihkan' }, { status: 409 });
    }
    if (reject === true && target.approved) {
      return NextResponse.json({ error: 'Akun aktif harus dinonaktifkan sebelum ditolak' }, { status: 409 });
    }
    if (restore !== true && reject !== true && (target.approved || target.rejected)) {
      return NextResponse.json({ error: 'Status akun sudah diproses; muat ulang daftar user' }, { status: 409 });
    }

    // Only pending accounts transition from requested_role into an active role.
    let newRole: string | undefined;
    if (!reject && !restore && target.role === 'pending') {
      const requestedRole = typeof target.requested_role === 'string' && target.requested_role
        ? target.requested_role
        : 'siswa';
      const publicRegistrationRoles = new Set(['osis', 'siswa', 'guru']);
      if (!publicRegistrationRoles.has(requestedRole)) {
        return NextResponse.json({ error: 'Role yang diajukan tidak valid; user belum disetujui' }, { status: 409 });
      }
      if (requestedRole !== 'siswa') {
        const roleErr = await requirePermission('users:role_assign');
        if (roleErr) return roleErr;
      }
      newRole = requestedRole;
    }

    const updateObj: any = {};
    if (restore) {
      // Move rejected user back to pending (approved=false, rejected=false)
      updateObj.rejected = false;
      updateObj.rejection_reason = null;
      updateObj.approved = false;
    } else if (reject) {
      updateObj.rejected = true;
      updateObj.rejection_reason = (rejection_reason as string | undefined)?.trim() || 'Ditolak';
      updateObj.approved = false;
    } else {
      updateObj.approved = true;
      updateObj.rejected = false;
      updateObj.rejection_reason = null;
    }
    if (newRole) updateObj.role = newRole;
    
    // Update user approval status without restrictive conditions
    // This ensures approval works even if user was previously approved/rejected
    let updateQuery = supabaseAdmin
      .from('users')
      .update(updateObj)
      .eq('id', id)
      .eq('approved', !!target.approved)
      .eq('rejected', !!target.rejected);
    if (target.role === 'pending') updateQuery = updateQuery.eq('role', 'pending');
    const { data: updatedUser, error: updErr } = await updateQuery
      .select('id, email, approved, rejected, role')
      .maybeSingle();
    
    if (updErr) {
      console.error('[admin/users PUT approve] Error:', updErr);
      return NextResponse.json({ error: 'Gagal menyetujui user' }, { status: 500 });
    }
    if (!updatedUser) {
      return NextResponse.json({ error: 'Status user sudah berubah. Muat ulang daftar lalu coba lagi.' }, { status: 409 });
    }
    
    return NextResponse.json({ 
      ok: true, 
      restored: !!restore, 
      rejected: !!reject, 
      approved: !restore && !reject,
      user: updatedUser 
    });
  } catch (e: any) {
    console.error('[admin/users PUT] Unexpected error', e);
    return NextResponse.json({ error: e.message || 'Failed to approve user' }, { status: 500 });
  }
}
