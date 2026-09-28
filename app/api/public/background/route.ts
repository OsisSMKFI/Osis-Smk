import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { BackgroundResponseSchema, buildError, buildSuccess } from '@/lib/validation';
import crypto from 'crypto';

// Public read-only endpoint: GLOBAL_BG_* settings, or single page_content key via ?key=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key) {
      const { data, error } = await supabaseAdmin
        .from('page_content')
        .select('*')
        .eq('page_key', key)
        .maybeSingle();

      if (error) {
        // Key design override opsional — query error juga tidak boleh spam 404
        if (key.startsWith('design_override_')) {
          return NextResponse.json(
            buildSuccess('OK', { page_key: key, content: '', content_value: '', category: 'design', content_type: 'css', published: true })
          );
        }
        // Optional design key / missing table — treat as not found, not 500
        return NextResponse.json(buildError('CONTENT_NOT_FOUND', error.message), { status: 404 });
      }

      if (!data) {
        // Key design override bersifat opsional (belum pernah dibuat di
        // Design Studio) → balas 200 kosong supaya tidak spam 404 di console.
        if (key.startsWith('design_override_')) {
          return NextResponse.json(
            buildSuccess('OK', {
              page_key: key,
              content: '',
              content_value: '',
              category: 'design',
              content_type: 'css',
              published: true,
            })
          );
        }
        return NextResponse.json(buildError('CONTENT_NOT_FOUND', `No content for key: ${key}`), { status: 404 });
      }

      const res = NextResponse.json(
        buildSuccess('OK', {
          page_key: data.page_key,
          content: data.content || '',
          content_value: data.content || '',
          category: data.category || 'general',
          content_type: data.content_type || 'text',
          published: data.published !== false,
        })
      );
      res.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
      return res;
    }

    const { data, error } = await supabaseAdmin
      .from('admin_settings')
      .select('key,value,is_secret')
      .like('key', 'GLOBAL_BG_%');

    if (error) {
      return NextResponse.json(buildError('BG_FETCH_ERROR', error.message), { status: 500 });
    }

    const settings: Record<string, string> = {};
    (data || []).forEach((row) => {
      if (row.is_secret) return;
      settings[row.key] = row.value || '';
    });

    // Validation (non-fatal; if fails send error)
    try {
      BackgroundResponseSchema.parse({ success: true, code: 'OK', settings });
    } catch (schemaErr: any) {
      return NextResponse.json(buildError('BG_SCHEMA_INVALID', 'Invalid background schema', schemaErr.errors), { status: 500 });
    }

    const payload = buildSuccess('OK', { settings });
    const etag = crypto.createHash('sha1').update(JSON.stringify(payload)).digest('hex');
    const res = NextResponse.json(payload, { status: 200 });
    res.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.headers.set('ETag', etag);
    return res;
  } catch (e: any) {
    return NextResponse.json(buildError('BG_UNEXPECTED', e.message || 'Failed'), { status: 500 });
  }
}
