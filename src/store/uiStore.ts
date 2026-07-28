import { create } from "zustand";

export type Tab = "playlists" | "artists" | "albums" | "songs" | "search";

export type Detail =
  | { type: "album"; key: string }
  | { type: "artist"; key: string }
  | { type: "playlist"; id: string }
  | null;

interface UIState {
  tab: Tab;
  detail: Detail;
  setTab: (tab: Tab) => void;
  openAlbum: (key: string) => void;
  openArtist: (key: string) => void;
  openPlaylist: (id: string) => void;
  closeDetail: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  tab: "songs",
  detail: null,
  setTab: (tab) => set({ tab, detail: null }),
  openAlbum: (key) => set({ detail: { type: "album", key } }),
  openArtist: (key) => set({ detail: { type: "artist", key } }),
  openPlaylist: (id) => set({ detail: { type: "playlist", id } }),
  closeDetail: () => set({ detail: null }),
}));
