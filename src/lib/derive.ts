import type { Track } from "../types";

export interface AlbumGroup {
  key: string;
  album: string;
  artist: string;
  tracks: Track[];
}

export interface ArtistGroup {
  key: string;
  artist: string;
  tracks: Track[];
  albumCount: number;
}

export function compareAlbumTracks(a: Track, b: Track): number {
  const aDisk = a.diskNumber;
  const bDisk = b.diskNumber;
  if (typeof aDisk === "number" && typeof bDisk === "number") {
    if (aDisk !== bDisk) return aDisk - bDisk;
  } else if (typeof aDisk === "number") {
    return -1;
  } else if (typeof bDisk === "number") {
    return 1;
  }

  const aTrack = a.trackNumber;
  const bTrack = b.trackNumber;
  if (typeof aTrack === "number" && typeof bTrack === "number") {
    if (aTrack !== bTrack) return aTrack - bTrack;
  } else if (typeof aTrack === "number") {
    return -1;
  } else if (typeof bTrack === "number") {
    return 1;
  }

  return a.title.localeCompare(b.title);
}

export function groupByAlbum(tracks: Track[]): AlbumGroup[] {
  const map = new Map<string, AlbumGroup>();
  for (const track of tracks) {
    const artist = track.albumArtist?.trim() || track.artist;
    const key = `${track.album}\0${artist}`;
    let group = map.get(key);
    if (!group) {
      group = { key, album: track.album, artist, tracks: [] };
      map.set(key, group);
    }
    group.tracks.push(track);
  }
  for (const group of map.values()) {
    group.tracks.sort(compareAlbumTracks);
  }
  return Array.from(map.values()).sort((a, b) => a.album.localeCompare(b.album));
}

export function groupByArtist(tracks: Track[]): ArtistGroup[] {
  const map = new Map<string, ArtistGroup>();
  for (const track of tracks) {
    let group = map.get(track.artist);
    if (!group) {
      group = { key: track.artist, artist: track.artist, tracks: [], albumCount: 0 };
      map.set(track.artist, group);
    }
    group.tracks.push(track);
  }
  for (const group of map.values()) {
    group.albumCount = new Set(group.tracks.map((t) => t.album)).size;
  }
  return Array.from(map.values()).sort((a, b) => a.artist.localeCompare(b.artist));
}

export type SongSort = "title" | "artist";

export function sortTracks(tracks: Track[], sort: SongSort): Track[] {
  return [...tracks].sort((a, b) => a[sort].localeCompare(b[sort]));
}

export function searchTracks(tracks: Track[], query: string): Track[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return tracks.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.album.toLowerCase().includes(q),
  );
}
