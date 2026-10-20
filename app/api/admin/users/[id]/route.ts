import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/apiAuth';
import { ASSIGNABLE_USER_ROLES } from '@/lib/rbac';
import { validatePassword } from '@/lib/passwordPolicy';
export const runtime = 'nodejs';

const ALLOWED_ROLES = new Set<string>(ASSIGNABLE_USER_ROLES);

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    
    // Users can only view their own profile unless they have admin permission
    if (session.user.id !== id) {
      const authErr = await requirePermission('users:read');
      if (authErr) return authErr;
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, nickname, nisn, no_induk, nik, unit_sekolah, instagram_username, kelas, requested_role, role, photo_url, approved, email_verified, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[admin/users/[id] GET] Supabase error:', error);
      throw error;
    }
    if (!data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const result = {
      id: data.id,
      email: data.email,
      name: data.name,
      nickname: data.nickname,
      username: data.nickname,
      nisn: data.nisn,
      no_induk: data.no_induk,
      nik: data.nik,
      unit: data.unit_sekolah,
      kelas: data.kelas || '',
      instagram_username: data.instagram_username,
      requested_role: data.requested_role,
      role: data.role,
      is_active: !!data.approved,
      approved: !!data.approved,
      profile_image: data.photo_url ?? null,
      photo_url: data.photo_url ?? null,
      created_at: data.created_at,
      updated_at: data.updated_at,
      email_verified: !!data.email_verified,
    };

    return NextResponse.json({ success: true, data: result });
  } catch (e: any) {
    console.error('[admin/users/[id] GET] Exception:', e);
    return NextResponse.json({ error: e.message || 'Failed to fetch user', details: e.toString() }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, role, is_active, profile_image, password, username, nickname, nisn, no_induk, nik, unit, unit_sekolah, kelas, instagram_username } = body;
    if (is_active !== undefined && typeof is_active !== 'boolean') {
      return NextResponse.json({ error: 'Status aktif harus berupa boolean' }, { status: 400 });
    }

    // Check if user is editing their own profile
    const isOwnProfile = session.user.id === id;

    if (isOwnProfile && ['name', 'nickname', 'username', 'nisn', 'no_induk', 'nik', 'unit', 'unit_sekolah', 'kelas', 'instagram_username'].some((field) => body[field] !== undefined)) {
      const identityEditErr = await requirePermission('users:edit');
      if (identityEditErr) return identityEditErr;
    }
    
    // If not own profile, require admin permission
    if (!isOwnProfile) {
      const authErr = await requirePermission('users:edit');
      if (authErr) return authErr;
    }

    const update: any = {};
    if (name !== undefined) update.name = typeof name === 'string' ? name.trim() : name;
    const nextNickname = nickname ?? username;
    if (nextNickname !== undefined) update.nickname = typeof nextNickname === 'string' && nextNickname.trim() ? nextNickname.trim() : null;
    if (nisn !== undefined) update.nisn = nisn.trim() === '' ? null : nisn;
    if (no_induk !== undefined) update.no_induk = no_induk.trim() === '' ? null : no_induk.trim();
    if (nik !== undefined) update.nik = nik.trim() === '' ? null : nik;
    if (unit !== undefined || unit_sekolah !== undefined) update.unit_sekolah = unit ?? unit_sekolah;
    if (kelas !== undefined) update.kelas = kelas;
    if (instagram_username !== undefined) {
      const cleaned = instagram_username.trim().replace('@', '');
      update.instagram_username = cleaned === '' ? null : cleaned;
    }
    
    // Only administrators can change role and approval status.
    if (!isOwnProfile) {
      const { data: existingUser, error: existingUserError } = await supabaseAdmin
        .from('users')
        .select('id, role, requested_role, approved')
        .eq('id', id)
        .maybeSingle();

      if (existingUserError) throw existingUserError;
      if (!existingUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      if (role !== undefined) {
        if (typeof role !== 'string' || !ALLOWED_ROLES.has(role)) {
          console.error('[admin/users/[id] PUT] Invalid role:', role);
          return NextResponse.json({ error: `Invalid role: ${role}` }, { status: 400 });
        }
        const currentEffectiveRole = existingUser.role === 'pending'
          ? existingUser.requested_role || 'siswa'
          : existingUser.role;
        if (role !== currentEffectiveRole) {
          const roleErr = await requirePermission('users:role_assign');
          if (roleErr) return roleErr;

          // Preserve the pending approval state; update only the role they requested.
          if (existingUser.role === 'pending') update.requested_role = role;
          else update.role = role;
        }
      }
      if (is_active !== undefined) {
        if (is_active === true && existingUser.role === 'pending') {
          return NextResponse.json({ error: 'Akun pending harus disetujui melalui alur persetujuan user' }, { status: 409 });
        }
        if (!!is_active !== !!existingUser.approved) {
          const approvalErr = await requirePermission('users:approve');
          if (approvalErr) return approvalErr;
          update.approved = !!is_active;
        }
        // Clear rejection when approving AND ensure email is verified
        if (is_active) {
          update.rejected = false;
          update.rejection_reason = null;
        }
      }
    }
    if (profile_image !== undefined) update.photo_url = profile_image ?? null;
    
    // Hash new password if provided
    if (password !== undefined && password !== null && password !== '') {
      if (typeof password !== 'string') {
        return NextResponse.json({ error: 'Password harus berupa teks' }, { status: 400 });
      }
      const passwordError = validatePassword(password);
      if (passwordError) return NextResponse.json({ error: `Password tidak valid: ${passwordError}` }, { status: 400 });
      const bcrypt = (await import('bcryptjs')).default;
      const saltRoundsRaw = Number(process.env.PASSWORD_SALT_ROUNDS ?? 10);
      const saltRounds = Number.isInteger(saltRoundsRaw) && saltRoundsRaw >= 10 && saltRoundsRaw <= 14 ? saltRoundsRaw : 10;
      const hash = await bcrypt.hash(password, saltRounds);
      update.password_hash = hash;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'Tidak ada perubahan untuk disimpan' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(update)
      .eq('id', id)
      .select('id, email, name, nickname, nisn, no_induk, nik, unit_sekolah, instagram_username, kelas, requested_role, role, photo_url, approved, email_verified, created_at, updated_at')
      .single();

    if (error) {
      console.error('[admin/users/[id] PUT] Error:', error);
      throw error;
    }
    
    const result = {
      id: data.id,
      email: data.email,
      name: data.name,
      nickname: data.nickname,
      username: data.nickname,
      nisn: data.nisn,
      no_induk: data.no_induk,
      nik: data.nik,
      unit: data.unit_sekolah,
      kelas: data.kelas || '',
      instagram_username: data.instagram_username,
      requested_role: data.requested_role,
      role: data.role,
      is_active: !!data.approved,
      approved: !!data.approved,
      profile_image: data.photo_url ?? null,
      photo_url: data.photo_url ?? null,
      created_at: data.created_at,
      updated_at: data.updated_at,
      last_login: null as string | null,
      email_verified: !!data.email_verified,
    };

    return NextResponse.json({ success: true, data: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authErr = await requirePermission('users:delete');
    if (authErr) return authErr;

    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'User deleted' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to delete user' }, { status: 500 });
  }
}
