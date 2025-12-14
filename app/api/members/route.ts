import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { MembersResponseSchema, buildError, buildSuccess, MemberSchema } from '@/lib/validation';
import crypto from 'crypto';

// Supabase storage base URL for members photos
const SUPABASE_STORAGE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL 
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/gallery/members`
  : 'https://mhefqwregrldvxtqqxbb.supabase.co/storage/v1/object/public/gallery/members';

/**
 * Fix incomplete URLs that only contain filename
 */
function fixPhotoUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // Already a full URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Already a path starting with /
  if (url.startsWith('/')) {
    // Local path - keep as is
    if (url.startsWith('/images/')) return url;
    return `${SUPABASE_STORAGE_URL}${url}`;
  }
  
  // Just a filename - construct full URL
  return `${SUPABASE_STORAGE_URL}/${url}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false'; // default true

    let query = supabaseAdmin
      .from('members')
      .select('*, sekbid:sekbid_id(id, name, color, icon)');

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    // Only get members with sekbid 1-6 OR null (tim inti: Ketua, Wakil, etc)
    // Filter out invalid sekbid (19-24, etc)
    const { data: allMembers, error } = await query.order('display_order', { ascending: true });
    
    if (error) {
      return NextResponse.json(buildError('MEMBERS_FETCH_ERROR', error.message), { status: 500 });
    }

    // Filter: only sekbid_id null (tim inti) or 1-6 (valid sekbid)
    const filteredMembers = (allMembers || []).filter((m: any) => {
      const sekbidId = m.sekbid_id;
      return sekbidId === null || (sekbidId >= 1 && sekbidId <= 6);
    });

    // Fix photo URLs for each member
    const membersWithFixedUrls = filteredMembers.map((m: any) => ({
      ...m,
      photo_url: fixPhotoUrl(m.photo_url),
    }));

    // Validate each member schema (non-fatal collect errors)
    const invalid: any[] = [];
    const safeMembers = membersWithFixedUrls.filter((m: any) => {
      const parsed = MemberSchema.safeParse(m);
      if (!parsed.success) {
        invalid.push({ id: m.id, issues: parsed.error.issues });
        return false;
      }
      return true;
    });

    const payload = buildSuccess('OK', { members: safeMembers });
    try {
      MembersResponseSchema.parse(payload);
    } catch (schemaErr: any) {
      return NextResponse.json(buildError('MEMBERS_SCHEMA_INVALID', 'Invalid members schema', schemaErr.issues), { status: 500 });
    }

    const etag = crypto.createHash('sha1').update(JSON.stringify(payload)).digest('hex');
    const res = NextResponse.json(payload, { status: 200 });
    res.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.headers.set('ETag', etag);
    if (invalid.length) {
      res.headers.set('X-Invalid-Members', String(invalid.length));
    }
    return res;
  } catch (error: any) {
    return NextResponse.json(buildError('MEMBERS_UNEXPECTED', error.message), { status: 500 });
  }
}
