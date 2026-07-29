import { create } from "zustand";

export type Tab = "playlists" | "collection" | "songs" | "search" | "ai";
export type CollectionMode = "albums" | "artists";

export type Detail =
  | { type: "album"; key: string }
  | { type: "artist"; key: string }
  | { type: "playlist"; id: string }
  | null;

interface UIState {
  tab: Tab;
  collectionMode: CollectionMode;
  detail: Detail;
  setTab: (tab: Tab) => void;
  setCollectionMode: (mode: CollectionMode) => void;
  openAlbum: (key: string) => void;
  openArtist: (key: string) => void;
  openPlaylist: (id: string) => void;
  closeDetail: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  tab: "songs",
  collectionMode: "albums",
  detail: null,
  setTab: (tab) => set({ tab, detail: null }),
  setCollectionMode: (collectionMode) => set({ collectionMode, detail: null }),
  openAlbum: (key) => set({ detail: { type: "album", key } }),
  openArtist: (key) => set({ detail: { type: "artist", key } }),
  openPlaylist: (id) => set({ detail: { type: "playlist", id } }),
  closeDetail: () => set({ detail: null }),
}));
