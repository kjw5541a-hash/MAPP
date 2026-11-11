import type { Track, Playlist, LibraryBackup } from "../types";

/**
 * Exports library metadata (tracks with like status, and playlists) as a JSON file download.
 * Audio and artwork blob payloads are excluded to avoid excessive file size.
 */
export function exportLibraryBackup(tracks: Track[], playlists: Playlist[]): void {
  const backup: LibraryBackup = {
    version: 1,
    exportDate: Date.now(),
    tracks: tracks.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      album: t.album,
      duration: t.duration,
      lyrics: t.lyrics,
      dateAdded: t.dateAdded,
      hash: t.hash,
      liked: t.liked,
      likeOrder: t.likeOrder,
    })),
    playlists: playlists.map((p) => ({
      id: p.id,
      name: p.name,
      trackIds: p.trackIds,
      dateCreated: p.dateCreated,
      order: p.order,
    })),
  };

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `mapp-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
