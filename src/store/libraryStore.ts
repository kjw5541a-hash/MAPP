import { create } from "zustand";
import type { Track, Playlist } from "../types";
import * as db from "../lib/db";
import { parseM4aFile } from "../lib/metadata";

interface ImportProgress {
  active: boolean;
  done: number;
  total: number;
}

interface LibraryState {
  ready: boolean;
  tracks: Track[];
  playlists: Playlist[];
  importProgress: ImportProgress;
  init: () => Promise<void>;
  importFiles: (files: FileList | File[]) => Promise<void>;
  deleteTrack: (id: string) => Promise<void>;
  createPlaylist: (name: string) => Promise<Playlist>;
  renamePlaylist: (id: string, name: string) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  addToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  removeFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  reorderPlaylist: (playlistId: string, trackIds: string[]) => Promise<void>;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  ready: false,
  tracks: [],
  playlists: [],
  importProgress: { active: false, done: 0, total: 0 },

  init: async () => {
    const [tracks, playlists] = await Promise.all([db.getAllTracks(), db.getAllPlaylists()]);
    tracks.sort((a, b) => a.title.localeCompare(b.title));
    set({ tracks, playlists, ready: true });
  },

  importFiles: async (files) => {
    const list = Array.from(files);
    set({ importProgress: { active: true, done: 0, total: list.length } });
    for (const file of list) {
      try {
        const { track, fileBlob, artBlob } = await parseM4aFile(file);
        await db.addTrack(track, fileBlob, artBlob);
        set((state) => ({
          tracks: [...state.tracks, track].sort((a, b) => a.title.localeCompare(b.title)),
          importProgress: { ...state.importProgress, done: state.importProgress.done + 1 },
        }));
      } catch (err) {
        console.error("Failed to import", file.name, err);
        set((state) => ({
          importProgress: { ...state.importProgress, done: state.importProgress.done + 1 },
        }));
      }
    }
    set({ importProgress: { active: false, done: 0, total: 0 } });
  },

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

  createPlaylist: async (name) => {
    const playlist: Playlist = {
      id: crypto.randomUUID(),
      name,
      trackIds: [],
      dateCreated: Date.now(),
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
}));
