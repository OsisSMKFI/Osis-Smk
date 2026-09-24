import { supabaseAdmin } from '@/lib/supabase/server';
import { mapProkerList } from '@/lib/proker';

const DEPRECATED_MARKERS = [
  'sfo.supabase.co',
  'nrt.supabase.co',
  'fra.supabase.co',
];

function filterDeprecatedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  for (const marker of DEPRECATED_MARKERS) {
    if (url.includes(marker)) return null;
  }
  return url;
}

function fixGalleryUrl(url: string | null | undefined, folder = 'general'): string | null {
  if (!url) return null;
  const filtered = filterDeprecatedUrl(url);
  if (!filtered) return null;
  if (filtered.startsWith('http')) return filtered;

  const base =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    `https://${process.env.SUPABASE_URL?.replace('https://', '') || 'vyorjqbrugjjeioayscg'}.supabase.co`;
  const storage = `${base}/storage/v1/object/public/gallery`;
  if (filtered.startsWith('/')) return `${storage}${filtered}`;
  return `${storage}/${folder}/${filtered}`;
}

async function safeRows<T>(
  query: PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  try {
    const { data, error } = await query;
    if (error) return [];
    return (data || []) as T[];
  } catch {
    return [];
  }
}

function toPublicUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http')) {
    if (url.includes('/storage/v1/object/sign/')) {
      try {
        const u = new URL(url);
        const path = u.pathname.replace('/storage/v1/object/sign/', '');
        const rel = path.split('/').slice(1).join('/');
        if (rel) {
          const base =
            process.env.NEXT_PUBLIC_SUPABASE_URL ||
            'https://vyorjqbrugjjeioayscg.supabase.co';
          return `${base}/storage/v1/object/public/${rel}`;
        }
      } catch {
        return url;
      }
    }
    return url;
  }
  const base =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vyorjqbrugjjeioayscg.supabase.co';
  return `${base}/storage/v1/object/public/${url}`;
}

export async function getPublicGallery() {
  const rows = await safeRows<any>(
    supabaseAdmin
      .from('gallery')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
  );
  return rows.map((item, i) => {
    const folder = item.category || item.folder || 'general';
    let id = item.id;
    if (id === null || id === undefined || id === '') {
      id = `gal-${i}-${item.image_url || item.title || 'item'}`;
    }
    return {
      ...item,
      id,
      image_url: item.image_url
        ? toPublicUrl(fixGalleryUrl(item.image_url, folder)) || fixGalleryUrl(item.image_url, folder)
        : item.image_url,
      video_url: item.video_url
        ? toPublicUrl(fixGalleryUrl(item.video_url, folder)) || fixGalleryUrl(item.video_url, folder)
        : item.video_url,
      url:
        item.url && !item.image_url && !item.video_url
          ? toPublicUrl(fixGalleryUrl(item.url, folder)) || fixGalleryUrl(item.url, folder)
          : item.url,
    };
  });
}

export async function getPublicPosts(limit = 24, featuredOnly = false) {
  let query = supabaseAdmin
    .from('posts')
    .select(
      `*, author:users!author_id ( id, name, photo_url )`
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(Math.min(limit, 50));
  if (featuredOnly) query = query.eq('is_featured', true);

  const rows = await safeRows<any>(query);
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vyorjqbrugjjeioayscg.supabase.co';

  return rows.map((post) => {
    const next = { ...post };
    if (post.featured_image && !post.featured_image.startsWith('http')) {
      next.featured_image = `${base}/storage/v1/object/public/${post.featured_image}`;
    }
    if (post.author?.photo_url && !post.author.photo_url.startsWith('http')) {
      next.author = {
        ...post.author,
        photo_url: `${base}/storage/v1/object/public/${post.author.photo_url}`,
      };
    }
    return next;
  });
}

export async function getPublicSekbid() {
  return safeRows<any>(
    supabaseAdmin.from('sekbid').select('*').order('id', { ascending: true })
  );
}

export async function getPublicProker() {
  let data: any[] | null = null;
  try {
    const joined = await supabaseAdmin
      .from('program_kerja')
      .select(
        `*, sekbid:sekbid_id ( id, name, description, color, icon )`
      )
      .order('created_at', { ascending: false });
    if (!joined.error) data = joined.data;
  } catch {
    data = null;
  }
  if (!data) {
    data = await safeRows<any>(
      supabaseAdmin.from('program_kerja').select('*').order('created_at', { ascending: false })
    );
  }
  return mapProkerList(data || []);
}

export async function getPublicEvents(limit = 50) {
  const rows = await safeRows<any>(
    supabaseAdmin
      .from('events')
      .select('*')
      .order('event_date', { ascending: false })
      .limit(limit)
  );
  return rows.map((event) => ({
    ...event,
    image_url: filterDeprecatedUrl(event.image_url),
  }));
}

export async function getPublicAnnouncements(limit = 20) {
  const now = new Date().toISOString();
  return safeRows<any>(
    supabaseAdmin
      .from('announcements')
      .select('*')
      .or(`expires_at.is.null,expires_at.gte.${now}`)
      .order('created_at', { ascending: false })
      .limit(limit)
  );
}

export async function getPublicPolls(limit = 30) {
  const rows = await safeRows<any>(
    supabaseAdmin
      .from('polls')
      .select('*, poll_options(*)')
      .order('created_at', { ascending: false })
      .limit(limit)
  );
  const now = Date.now();
  return rows.filter((poll) => !poll.expires_at || new Date(poll.expires_at).getTime() > now);
}
