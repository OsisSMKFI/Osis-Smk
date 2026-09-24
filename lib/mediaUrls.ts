import { CURRENT_SUPABASE_PROJECT, DEPRECATED_PROJECTS } from '@/lib/supabase/storage';

/**
 * SINGLE SOURCE OF TRUTH untuk resolve URL media publik.
 *
 * Kebijakan smart save storage:
 * - Supabase Storage = PRIMARY (semua upload admin lewat sini).
 * - Vercel Blob = FALLBACK otomatis bila Supabase gagal (/api/upload).
 * - URL apapun yang tersimpan (supabase public, signed, relative path,
 *   blob.vercel-storage.com) harus bisa di-resolve ke URL publik yang hidup.
 */

const BLOB_HOST_MARKER = '.blob.vercel-storage.com';

/** Bucket yang dikenal di Supabase Storage proyek ini. */
const KNOWN_BUCKETS = [
  'gallery',
  'media',
  'videos',
  'user-photos',
  'biometric-data',
  'backgrounds',
  'attachments',
  'passkeys',
];

/** Domain proyek Supabase lama / regional yang sudah mati. */
const DEAD_URL_MARKERS = [
  ...DEPRECATED_PROJECTS.map((p) => `${p}.supabase.co`),
  'sfo.supabase.co',
  'nrt.supabase.co',
  'fra.supabase.co',
];

/** URL yang tidak bisa ditampilkan publik (proyek lama / runtime lokal). */
export function isDeadStorageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.startsWith('blob:') || url.startsWith('data:')) return true;
  return DEAD_URL_MARKERS.some((marker) => url.includes(marker));
}

function supabaseOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    `https://${CURRENT_SUPABASE_PROJECT}.supabase.co`
  ).replace(/\/$/, '');
}

/**
 * Resolve nilai URL tersimpan menjadi URL publik yang valid.
 *
 * Input yang ditangani:
 * - Full public URL (supabase/blob) → dipertahankan
 * - Full signed URL supabase → dikonversi ke public (tidak kedaluwarsa)
 * - Path relatif "gallery/general/x.jpg" → + origin storage
 * - Path relatif "general/x.jpg" (tanpa bucket) → bucket gallery
 * - Filename saja "x.jpg" → gallery/<folder>/x.jpg
 * - URL mati / blob: / data: → null (jangan dirender)
 */
export function resolveStorageUrl(
  raw: string | null | undefined,
  folder = 'general'
): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;
  if (isDeadStorageUrl(value)) return null;

  // Full URL
  if (value.startsWith('http://') || value.startsWith('https://')) {
    if (value.includes('/storage/v1/object/sign/')) {
      try {
        const u = new URL(value);
        // pathAfterSign = "<bucket>/<folder>/file" — bucket ikut dipertahankan
        const pathWithBucket = u.pathname.replace(
          '/storage/v1/object/sign/',
          ''
        );
        if (pathWithBucket) {
          return `${supabaseOrigin()}/storage/v1/object/public/${pathWithBucket}`;
        }
      } catch {
        return value;
      }
    }
    // Termasuk URL Vercel Blob → tampil apa adanya
    return value;
  }

  const origin = supabaseOrigin();
  const storage = `${origin}/storage/v1/object/public`;
  const path = value.startsWith('/') ? value.slice(1) : value;
  const firstSegment = path.split('/')[0];

  // Sudah menyertakan nama bucket
  if (KNOWN_BUCKETS.includes(firstSegment)) {
    return `${storage}/${path}`;
  }
  // Path berfolder tapi tanpa bucket → asumsikan bucket gallery
  if (path.includes('/')) {
    return `${storage}/gallery/${path}`;
  }
  // Filename saja → folder logis item
  return `${storage}/gallery/${folder}/${path}`;
}

/**
 * Buang baris duplikat (judul + URL media sama persis),
 * pertahankan yang terbaru (asumsi rows sudah urut created_at desc).
 */
export function dedupeByMedia<T extends { title?: string | null; image_url?: string | null }>(
  rows: T[]
): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const row of rows) {
    const media = row.image_url || '';
    if (!media) {
      out.push(row);
      continue;
    }
    const key = `${(row.title || '').trim().toLowerCase()}::${media}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

/** Khusus kasus URL blob Vercel — pengecekan eksplisit bila diperlukan. */
export function isVercelBlobUrl(url: string | null | undefined): boolean {
  return !!url && url.includes(BLOB_HOST_MARKER);
}
