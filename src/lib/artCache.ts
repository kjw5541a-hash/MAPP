import { getTrackArt } from "./db";

const cache = new Map<string, Promise<string | undefined>>();

export function getArtUrl(artKey: string | undefined): Promise<string | undefined> {
  if (!artKey) return Promise.resolve(undefined);
  let entry = cache.get(artKey);
  if (!entry) {
    entry = getTrackArt(artKey).then((blob) => (blob ? URL.createObjectURL(blob) : undefined));
    cache.set(artKey, entry);
  }
  return entry;
}
