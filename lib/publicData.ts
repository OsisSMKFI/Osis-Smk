import { supabaseAdmin } from '@/lib/supabase/server';
import { mapProkerList } from '@/lib/proker';
import { resolveStorageUrl, dedupeByMedia } from '@/lib/mediaUrls';

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

export async function getPublicGallery() {
  const rows = await safeRows<any>(
    supabaseAdmin
      .from('gallery')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
  );
  return dedupeByMedia(
    rows.map((item, i) => {
      const folder = item.category || item.folder || 'general';
      let id = item.id;
      if (id === null || id === undefined || id === '') {
        id = `gal-${i}-${item.image_url || item.video_url || item.url || item.title || 'item'}`;
      }
      const fixedImage = resolveStorageUrl(item.image_url, folder);
      const fixedVideo = resolveStorageUrl(item.video_url, folder);
      const fixedUrl = resolveStorageUrl(item.url, folder);
      return {
        ...item,
        id,
        image_url: fixedImage || fixedVideo || fixedUrl,
        video_url: fixedVideo,
        url: fixedUrl,
      };
    })
  );
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

  return rows.map((post) => {
    const next = { ...post };
    next.featured_image = resolveStorageUrl(post.featured_image, 'posts');
    if (post.author) {
      next.author = {
        ...post.author,
        photo_url: resolveStorageUrl(post.author.photo_url, 'profiles'),
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
    image_url: resolveStorageUrl(event.image_url, 'events'),
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

/** All published page_content keys as a flat map (one server query). */
export async function getPublicPageContent(keys?: string[]): Promise<Record<string, string>> {
  const rows = await safeRows<any>(
    supabaseAdmin
      .from('page_content')
      .select('page_key, content')
      .eq('published', true)
  );
  const map: Record<string, string> = {};
  for (const row of rows) {
    if (row.page_key && row.content) map[row.page_key] = row.content;
  }
  if (!keys) return map;
  const out: Record<string, string> = {};
  for (const key of keys) {
    if (map[key]) out[key] = map[key];
  }
  return out;
}
