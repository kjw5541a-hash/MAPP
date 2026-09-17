import { create } from "zustand";
import type { Track, Playlist } from "../types";
import * as db from "../lib/db";
import { parseM4aFile, hashFile } from "../lib/metadata";

interface ImportProgress {
  active: boolean;
  done: number;
  total: number;
}

export interface ImportResult {
  added: number;
  skipped: number;
  failed: number;
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
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  ready: false,
  tracks: [],
  playlists: [],
  importProgress: { active: false, done: 0, total: 0 },
  importResult: null,

  init: async () => {
    const [tracks, playlists] = await Promise.all([db.getAllTracks(), db.getAllPlaylists()]);
    tracks.sort((a, b) => a.title.localeCompare(b.title));
    // Playlists saved before manual ordering existed have no `order` — fall
    // back to creation time so they still come out in a stable sequence.
    playlists.sort((a, b) => (a.order ?? a.dateCreated) - (b.order ?? b.dateCreated));
    set({ tracks, playlists, ready: true });
  },

  importFiles: async (files) => {
    const list = Array.from(files);
    // Seeded from the library so re-picking a whole folder only brings in what
    // is new, and grows as we go so one selection cannot add the same file twice.
    const seen = new Set(get().tracks.map((t) => t.hash).filter(Boolean) as string[]);
    let added = 0;
    let skipped = 0;
    let failed = 0;

    set({ importProgress: { active: true, done: 0, total: list.length }, importResult: null });

    for (const file of list) {
      try {
        const hash = await hashFile(file);
        if (seen.has(hash)) {
          skipped++;
        } else {
          seen.add(hash);
          const { track, fileBlob, artBlob } = await parseM4aFile(file, hash);
          await db.addTrack(track, fileBlob, artBlob);
          added++;
          set((state) => ({
            tracks: [...state.tracks, track].sort((a, b) => a.title.localeCompare(b.title)),
          }));
        }
      } catch (err) {
        console.error("Failed to import", file.name, err);
        failed++;
      }
      set((state) => ({
        importProgress: { ...state.importProgress, done: state.importProgress.done + 1 },
      }));
    }

    set({
      importProgress: { active: false, done: 0, total: 0 },
      importResult: { added, skipped, failed },
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
  },

  clearLibrary: async () => {
    await db.clearAll();
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
}));
