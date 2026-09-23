/**
 * Client-side GET cache for public APIs.
 * Survives soft navigations within a session; optional sessionStorage persist.
 * Goal: first click on a page can paint from cache instead of waiting network.
 */

type Entry<T> = { data: T; at: number };

const memory = new Map<string, Entry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

const SS_PREFIX = 'osis:api:';
const DEFAULT_TTL_MS = 90_000;

function ssKey(url: string) {
  return SS_PREFIX + url;
}

export function cacheGet<T>(url: string, ttlMs = DEFAULT_TTL_MS): T | null {
  const hit = memory.get(url);
  if (hit && Date.now() - hit.at < ttlMs) return hit.data as T;

  try {
    const raw = sessionStorage.getItem(ssKey(url));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Entry<T>;
    if (parsed && typeof parsed.at === 'number' && Date.now() - parsed.at < ttlMs) {
      memory.set(url, parsed);
      return parsed.data;
    }
    sessionStorage.removeItem(ssKey(url));
  } catch {
    // ignore
  }
  return null;
}

export function cacheSet<T>(url: string, data: T, persist = true) {
  const entry: Entry<T> = { data, at: Date.now() };
  memory.set(url, entry);
  if (persist) {
    try {
      const size = JSON.stringify(entry).length;
      if (size < 400_000) {
        sessionStorage.setItem(ssKey(url), JSON.stringify(entry));
      }
    } catch {
      // quota / private mode
    }
  }
}

export function cacheInvalidate(prefix?: string) {
  if (!prefix) {
    memory.clear();
    try {
      Object.keys(sessionStorage)
        .filter((k) => k.startsWith(SS_PREFIX))
        .forEach((k) => sessionStorage.removeItem(k));
    } catch {
      // ignore
    }
    return;
  }
  for (const key of [...memory.keys()]) {
    if (key.startsWith(prefix)) memory.delete(key);
  }
  try {
    Object.keys(sessionStorage)
      .filter((k) => k.startsWith(SS_PREFIX + prefix))
      .forEach((k) => sessionStorage.removeItem(k));
  } catch {
    // ignore
  }
}

/** Deduped GET with cache-first read. */
export async function cachedGetJson<T = unknown>(
  url: string,
  options?: { ttlMs?: number; force?: boolean; persist?: boolean }
): Promise<T> {
  const ttl = options?.ttlMs ?? DEFAULT_TTL_MS;
  if (!options?.force) {
    const hit = cacheGet<T>(url, ttl);
    if (hit !== null) return hit;
  }

  const existing = inFlight.get(url);
  if (existing) return existing as Promise<T>;

  const p = (async () => {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as T;
      cacheSet(url, data, options?.persist !== false);
      return data;
    } finally {
      inFlight.delete(url);
    }
  })();

  inFlight.set(url, p);
  return p;
}
