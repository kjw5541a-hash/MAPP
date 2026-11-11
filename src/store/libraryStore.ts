import { create } from "zustand";
import type { Track, Playlist, LibraryBackup, RestoreResult } from "../types";
import * as db from "../lib/db";
import { parseM4aFile, hashBuffer } from "../lib/metadata";
import { clearArtCache } from "../lib/artCache";
import { usePlayerStore } from "./playerStore";
import { requestStoragePersistence, isQuotaExceededError } from "../lib/storage";

interface ImportProgress {
  active: boolean;
  done: number;
  total: number;
}

export interface ImportResult {
  added: number;
  skipped: number;
  failed: number;
  failedReason?: string;
  quotaExceeded?: boolean;
}

interface LibraryState {
  ready: boolean;
  tracks: Track[];
  playlists: Playlist[];
  importProgress: ImportProgress;
  importResult: ImportResult | null;
  init: () => Promise<void>;
  importFiles: (files: FileList | File[]) => Promise<void>;
  dismissImportResult: () => void;
  deleteTrack: (id: string) => Promise<void>;
  clearLibrary: () => Promise<void>;
  toggleLiked: (id: string) => Promise<void>;
  reorderLiked: (trackIds: string[]) => Promise<void>;
  createPlaylist: (name: string) => Promise<Playlist>;
  renamePlaylist: (id: string, name: string) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  addToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  addTracksToPlaylist: (playlistId: string, trackIds: string[]) => Promise<void>;
  removeFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  reorderPlaylist: (playlistId: string, trackIds: string[]) => Promise<void>;
  reorderPlaylists: (playlistIds: string[]) => Promise<void>;
  restoreBackup: (backup: LibraryBackup) => Promise<RestoreResult>;
}

const FILE_IMPORT_TIMEOUT_MS = 60_000;

export const useLibraryStore = create<LibraryState>((set, get) => ({
  ready: false,
  tracks: [],
  playlists: [],
  importProgress: { active: false, done: 0, total: 0 },
  importResult: null,

  init: async () => {
    void requestStoragePersistence();
    const [tracks, playlists] = await Promise.all([db.getAllTracks(), db.getAllPlaylists()]);
    tracks.sort((a, b) => a.title.localeCompare(b.title));
    // Playlists saved before manual ordering existed have no `order` — fall
    // back to creation time so they still come out in a stable sequence.
    playlists.sort((a, b) => (a.order ?? a.dateCreated) - (b.order ?? b.dateCreated));
    set({ tracks, playlists, ready: true });
    usePlayerStore.getState().restorePlayback(tracks);
  },

  importFiles: async (files) => {
    const list = Array.from(files);
    // Seeded from the library so re-picking a whole folder only brings in what
    // is new, and grows as we go so one selection cannot add the same file twice.
    const seen = new Set(get().tracks.map((t) => t.hash).filter(Boolean) as string[]);
    const newTracks: Track[] = [];
    let added = 0;
    let skipped = 0;
    let failed = 0;
    let failedReason: string | undefined;
    let quotaExceeded = false;

    set({ importProgress: { active: true, done: 0, total: list.length }, importResult: null });

    for (const file of list) {
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      try {
        let timedOut = false;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            timedOut = true;
            reject(new Error("파일 읽기 시간 초과"));
          }, FILE_IMPORT_TIMEOUT_MS);
        });

        const processPromise = (async () => {
          const buffer = await file.arrayBuffer();
          if (timedOut) return;
          const hash = await hashBuffer(buffer);
          if (timedOut) return;
          if (seen.has(hash)) {
            skipped++;
          } else {
            seen.add(hash);
            const fileBlob = new Blob([buffer], { type: file.type });
            const { track, artBlob } = await parseM4aFile(fileBlob, file.name, hash);
            if (timedOut) {
              // Never added to the library: drop the hash so a later
              // re-import retries this file instead of skipping it as a duplicate.
              seen.delete(hash);
              return;
            }
            await db.addTrack(track, fileBlob, artBlob);
            if (timedOut) return;
            added++;
            newTracks.push(track);
          }
        })();
        processPromise.catch(() => {});

        await Promise.race([processPromise, timeoutPromise]);
      } catch (err) {
        console.error("Failed to import", file.name, err);
        failed++;
        if (isQuotaExceededError(err)) {
          quotaExceeded = true;
          failedReason = "저장 공간 부족";
          break;
        }
        if (!failedReason) {
          failedReason = err instanceof Error && err.message ? err.message : "가져오기 실패";
        }
      } finally {
        clearTimeout(timeoutId);
      }
      set((state) => ({
        importProgress: { ...state.importProgress, done: state.importProgress.done + 1 },
      }));
    }

    if (newTracks.length > 0) {
      set((state) => ({
        tracks: [...state.tracks, ...newTracks].sort((a, b) => a.title.localeCompare(b.title)),
      }));
    }

    set({
      importProgress: { active: false, done: 0, total: 0 },
      importResult: {
        added,
        skipped,
        failed,
        failedReason,
        quotaExceeded,
      },
    });
  },

  dismissImportResult: () => set({ importResult: null }),

  deleteTrack: async (id) => {
    const track = get().tracks.find((t) => t.id === id);
    if (!track) return;
    await db.deleteTrack(track);
    const playlists = get().playlists.map((p) => ({
      ...p,
      trackIds: p.trackIds.filter((tid) => tid !== id),
    }));
    await Promise.all(playlists.map((p) => db.savePlaylist(p)));
    set((state) => ({ tracks: state.tracks.filter((t) => t.id !== id), playlists }));
    usePlayerStore.getState().removeTrackFromQueue(id);
  },

  clearLibrary: async () => {
    await db.clearAll();
    clearArtCache();
    set({ tracks: [], playlists: [], importResult: null });
  },

  toggleLiked: async (id) => {
    const track = get().tracks.find((t) => t.id === id);
    if (!track) return;
    const liked = !track.liked;
    const updated: Track = { ...track, liked, likeOrder: liked ? Date.now() : track.likeOrder };
    await db.updateTrackMeta(updated);
    set((state) => ({ tracks: state.tracks.map((t) => (t.id === id ? updated : t)) }));
  },

  reorderLiked: async (trackIds) => {
    const updates: Track[] = [];
    trackIds.forEach((id, i) => {
      const track = get().tracks.find((t) => t.id === id);
      if (track) updates.push({ ...track, likeOrder: i });
    });
    await Promise.all(updates.map((t) => db.updateTrackMeta(t)));
    set((state) => ({
      tracks: state.tracks.map((t) => updates.find((u) => u.id === t.id) ?? t),
    }));
  },

  createPlaylist: async (name) => {
    const playlist: Playlist = {
      id: crypto.randomUUID(),
      name,
      trackIds: [],
      dateCreated: Date.now(),
      order: Date.now(),
    };
    await db.savePlaylist(playlist);
    set((state) => ({ playlists: [...state.playlists, playlist] }));
    return playlist;
  },

  renamePlaylist: async (id, name) => {
    const playlist = get().playlists.find((p) => p.id === id);
    if (!playlist) return;
    const updated = { ...playlist, name };
    await db.savePlaylist(updated);
    set((state) => ({ playlists: state.playlists.map((p) => (p.id === id ? updated : p)) }));
  },

  deletePlaylist: async (id) => {
    await db.deletePlaylist(id);
    set((state) => ({ playlists: state.playlists.filter((p) => p.id !== id) }));
  },

  addToPlaylist: async (playlistId, trackId) => {
    const playlist = get().playlists.find((p) => p.id === playlistId);
    if (!playlist || playlist.trackIds.includes(trackId)) return;
    const updated = { ...playlist, trackIds: [...playlist.trackIds, trackId] };
    await db.savePlaylist(updated);
    set((state) => ({
      playlists: state.playlists.map((p) => (p.id === playlistId ? updated : p)),
    }));
  },

  addTracksToPlaylist: async (playlistId, trackIds) => {
    const playlist = get().playlists.find((p) => p.id === playlistId);
    if (!playlist) return;
    const additions = trackIds.filter((id) => !playlist.trackIds.includes(id));
    if (additions.length === 0) return;
    const updated = { ...playlist, trackIds: [...playlist.trackIds, ...additions] };
    await db.savePlaylist(updated);
    set((state) => ({
      playlists: state.playlists.map((p) => (p.id === playlistId ? updated : p)),
    }));
  },

  removeFromPlaylist: async (playlistId, trackId) => {
    const playlist = get().playlists.find((p) => p.id === playlistId);
    if (!playlist) return;
    const updated = { ...playlist, trackIds: playlist.trackIds.filter((id) => id !== trackId) };
    await db.savePlaylist(updated);
    set((state) => ({
      playlists: state.playlists.map((p) => (p.id === playlistId ? updated : p)),
    }));
  },

  reorderPlaylist: async (playlistId, trackIds) => {
    const playlist = get().playlists.find((p) => p.id === playlistId);
    if (!playlist) return;
    const updated = { ...playlist, trackIds };
    await db.savePlaylist(updated);
    set((state) => ({
      playlists: state.playlists.map((p) => (p.id === playlistId ? updated : p)),
    }));
  },

  reorderPlaylists: async (playlistIds) => {
    const byId = new Map(get().playlists.map((p) => [p.id, p]));
    const updated = playlistIds
      .map((id, order) => {
        const playlist = byId.get(id);
        return playlist ? { ...playlist, order } : null;
      })
      .filter((p): p is Playlist => p !== null);
    await Promise.all(updated.map((p) => db.savePlaylist(p)));
    set({ playlists: updated });
  },

  restoreBackup: async (backup) => {
    const currentTracks = get().tracks;
    const byHash = new Map<string, Track>();
    const byId = new Map<string, Track>();
    for (const track of currentTracks) {
      if (track.hash) {
        byHash.set(track.hash, track);
      }
      byId.set(track.id, track);
    }

    const backupIdToCurrentId = new Map<string, string>();
    const restoredLikeTrackIds = new Set<string>();
    const updatedTracksMap = new Map<string, Track>(currentTracks.map((t) => [t.id, t]));
    const tracksToUpdate: Track[] = [];

    for (const bt of backup.tracks ?? []) {
      const matched = (bt.hash ? byHash.get(bt.hash) : undefined) ?? byId.get(bt.id);
      if (!matched) continue;
      backupIdToCurrentId.set(bt.id, matched.id);

      if (bt.liked && !restoredLikeTrackIds.has(matched.id)) {
        restoredLikeTrackIds.add(matched.id);
        const current = updatedTracksMap.get(matched.id) ?? matched;
        const updated: Track = {
          ...current,
          liked: true,
          likeOrder: bt.likeOrder ?? current.likeOrder ?? Date.now(),
        };
        updatedTracksMap.set(matched.id, updated);
        tracksToUpdate.push(updated);
      }
    }

    await Promise.all(tracksToUpdate.map((t) => db.updateTrackMeta(t)));

    const savedPlaylists: Playlist[] = [];
    for (const bp of backup.playlists ?? []) {
      if (!Array.isArray(bp.trackIds)) continue;
      const validTrackIds = bp.trackIds
        .map((tid) => backupIdToCurrentId.get(tid) ?? (byId.has(tid) ? tid : undefined))
        .filter((id): id is string => Boolean(id));

      if (validTrackIds.length === 0) continue;

      const restoredPlaylist: Playlist = {
        id: bp.id || crypto.randomUUID(),
        name: bp.name,
        trackIds: validTrackIds,
        dateCreated: bp.dateCreated ?? Date.now(),
        order: bp.order ?? Date.now(),
      };
      savedPlaylists.push(restoredPlaylist);
    }

    await Promise.all(savedPlaylists.map((p) => db.savePlaylist(p)));

    const playlistMap = new Map(get().playlists.map((p) => [p.id, p]));
    for (const p of savedPlaylists) {
      playlistMap.set(p.id, p);
    }
    const newPlaylists = Array.from(playlistMap.values()).sort(
      (a, b) => (a.order ?? a.dateCreated) - (b.order ?? b.dateCreated)
    );

    const newTracks = currentTracks.map((t) => updatedTracksMap.get(t.id) ?? t);
    set({ tracks: newTracks, playlists: newPlaylists });

    return {
      restoredLikes: restoredLikeTrackIds.size,
      restoredPlaylists: savedPlaylists.length,
    };
  },
}));
