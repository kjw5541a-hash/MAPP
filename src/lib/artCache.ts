import { getTrackArt } from "./db";

const MAX_ENTRIES = 100;

interface CacheEntry {
  promise: Promise<string | undefined>;
  url?: string;
  refs: number;
  evicted?: boolean;
}

const cache = new Map<string, CacheEntry>();

function trimCache(): void {
  if (cache.size <= MAX_ENTRIES) return;
  for (const [key, entry] of cache.entries()) {
    if (cache.size <= MAX_ENTRIES) break;
    if (entry.refs <= 0) {
      if (entry.url) {
        URL.revokeObjectURL(entry.url);
      }
      entry.evicted = true;
      cache.delete(key);
    }
  }
}

export function getArtUrl(artKey: string | undefined): Promise<string | undefined> {
  if (!artKey) return Promise.resolve(undefined);

  const existing = cache.get(artKey);
  if (existing) {
    existing.refs++;
    cache.delete(artKey);
    cache.set(artKey, existing);
    return existing.promise;
  }

  const newEntry: CacheEntry = {
    refs: 1,
    promise: Promise.resolve(undefined),
  };

  newEntry.promise = getTrackArt(artKey)
    .then((blob) => {
      if (newEntry.evicted || !blob) {
        return undefined;
      }
      const url = URL.createObjectURL(blob);
      newEntry.url = url;
      return url;
    })
    .catch(() => {
      if (cache.get(artKey) === newEntry) {
        cache.delete(artKey);
      }
      return undefined;
    });

  cache.set(artKey, newEntry);
  trimCache();
  return newEntry.promise;
}

export function releaseArtUrl(artKey: string | undefined): void {
  if (!artKey) return;
  const entry = cache.get(artKey);
  if (!entry) return;
  entry.refs = Math.max(0, entry.refs - 1);
  trimCache();
}

export function clearArtCache(): void {
  for (const entry of cache.values()) {
    if (entry.url) {
      URL.revokeObjectURL(entry.url);
    }
    entry.evicted = true;
  }
  cache.clear();
}
