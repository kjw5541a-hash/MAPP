import { create } from "zustand";
import type { Track, RepeatMode, QueueSource } from "../types";

function shuffledOrder(length: number, pinnedFirst: number): number[] {
  const rest = Array.from({ length }, (_, i) => i).filter((i) => i !== pinnedFirst);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [pinnedFirst, ...rest];
}

interface PlayerState {
  queue: Track[];
  playOrder: number[];
  orderPos: number;
  isPlaying: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  progress: number;
  duration: number;
  seekRequest: number | null;
  source: QueueSource | null;
  showNowPlaying: boolean;
  showLyrics: boolean;

  currentTrack: () => Track | null;
  playQueue: (tracks: Track[], startIndex: number, source: QueueSource) => void;
  togglePlay: () => void;
  setPlaying: (playing: boolean) => void;
  next: () => void;
  prev: () => void;
  onTrackEnded: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  seek: (time: number) => void;
  clearSeekRequest: () => void;
  setProgress: (time: number) => void;
  setDuration: (time: number) => void;
  setShowNowPlaying: (show: boolean) => void;
  setShowLyrics: (show: boolean) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  playOrder: [],
  orderPos: 0,
  isPlaying: false,
  shuffle: false,
  repeat: "off",
  progress: 0,
  duration: 0,
  seekRequest: null,
  source: null,
  showNowPlaying: false,
  showLyrics: false,

  currentTrack: () => {
    const { queue, playOrder, orderPos } = get();
    const queueIndex = playOrder[orderPos];
    return queueIndex === undefined ? null : (queue[queueIndex] ?? null);
  },

  playQueue: (tracks, startIndex, source) => {
    const { shuffle } = get();
    const playOrder = shuffle
      ? shuffledOrder(tracks.length, startIndex)
      : tracks.map((_, i) => i);
    const orderPos = shuffle ? 0 : startIndex;
    set({
      queue: tracks,
      playOrder,
      orderPos,
      source,
      isPlaying: true,
      progress: 0,
    });
  },

  togglePlay: () => set((s) => ({ isPlaying: s.queue.length > 0 && !s.isPlaying })),
  setPlaying: (playing) => set({ isPlaying: playing }),

  next: () => {
    const { orderPos, playOrder, repeat } = get();
    if (orderPos + 1 < playOrder.length) {
      set({ orderPos: orderPos + 1, progress: 0, isPlaying: true });
    } else if (repeat === "all") {
      set({ orderPos: 0, progress: 0, isPlaying: true });
    } else {
      set({ isPlaying: false, progress: 0 });
    }
  },

  prev: () => {
    const { orderPos, progress } = get();
    if (progress > 3) {
      set({ progress: 0, seekRequest: 0 });
      return;
    }
    if (orderPos > 0) {
      set({ orderPos: orderPos - 1, progress: 0 });
    } else {
      set({ progress: 0, seekRequest: 0 });
    }
  },

  onTrackEnded: () => {
    const { repeat, next } = get();
    if (repeat === "one") {
      set({ progress: 0, seekRequest: 0, isPlaying: true });
      return;
    }
    next();
  },

  toggleShuffle: () => {
    const { shuffle, queue, playOrder, orderPos } = get();
    const currentQueueIndex = playOrder[orderPos];
    if (!shuffle) {
      const newOrder = shuffledOrder(queue.length, currentQueueIndex ?? 0);
      set({ shuffle: true, playOrder: newOrder, orderPos: 0 });
    } else {
      const newOrder = queue.map((_, i) => i);
      set({ shuffle: false, playOrder: newOrder, orderPos: currentQueueIndex ?? 0 });
    }
  },

  cycleRepeat: () => {
    const order: RepeatMode[] = ["off", "all", "one"];
    const next = order[(order.indexOf(get().repeat) + 1) % order.length];
    set({ repeat: next });
  },

  seek: (time) => set({ progress: time, seekRequest: time }),
  clearSeekRequest: () => set({ seekRequest: null }),
  setProgress: (time) => set({ progress: time }),
  setDuration: (time) => set({ duration: time }),
  setShowNowPlaying: (show) => set({ showNowPlaying: show }),
  setShowLyrics: (show) => set({ showLyrics: show }),
}));
