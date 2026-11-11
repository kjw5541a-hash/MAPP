import { create } from "zustand";
import type { Track, RepeatMode, QueueSource } from "../types";

const SHUFFLE_STORAGE = "mapp-shuffle";
const REPEAT_STORAGE = "mapp-repeat";

function isRepeatMode(value: string | null): value is RepeatMode {
  return value === "off" || value === "all" || value === "one";
}

function initialShuffle(): boolean {
  return localStorage.getItem(SHUFFLE_STORAGE) === "true";
}

function initialRepeat(): RepeatMode {
  const saved = localStorage.getItem(REPEAT_STORAGE);
  return isRepeatMode(saved) ? saved : "off";
}

function shuffleIndices(indices: number[]): number[] {
  const out = [...indices];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Turning shuffle on mid-playback must not cut off the track being played, so
// it stays put and only what comes after it is reordered.
function shuffledOrder(length: number, pinnedFirst: number): number[] {
  const rest = Array.from({ length }, (_, i) => i).filter((i) => i !== pinnedFirst);
  return [pinnedFirst, ...shuffleIndices(rest)];
}

// Starting from the shuffle button has nothing to preserve, so the first track
// is randomised too.
function fullShuffledOrder(length: number): number[] {
  return shuffleIndices(Array.from({ length }, (_, i) => i));
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
  playbackError: string | null;

  currentTrack: () => Track | null;
  reset: () => void;
  playQueue: (tracks: Track[], startIndex: number, source: QueueSource) => void;
  playShuffled: (tracks: Track[], source: QueueSource) => void;
  togglePlay: () => void;
  setPlaying: (playing: boolean) => void;
  setPlaybackError: (error: string | null) => void;
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
  removeTrackFromQueue: (trackId: string) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  playOrder: [],
  orderPos: 0,
  isPlaying: false,
  shuffle: initialShuffle(),
  repeat: initialRepeat(),
  progress: 0,
  duration: 0,
  seekRequest: null,
  source: null,
  showNowPlaying: false,
  showLyrics: false,
  playbackError: null,

  currentTrack: () => {
    const { queue, playOrder, orderPos } = get();
    const queueIndex = playOrder[orderPos];
    return queueIndex === undefined ? null : (queue[queueIndex] ?? null);
  },

  reset: () =>
    set({
      queue: [],
      playOrder: [],
      orderPos: 0,
      isPlaying: false,
      progress: 0,
      duration: 0,
      source: null,
      showNowPlaying: false,
      showLyrics: false,
      playbackError: null,
    }),

  playQueue: (tracks, startIndex, source) => {
    const shuffleOn = get().shuffle;
    set({
      queue: tracks,
      playOrder: shuffleOn ? shuffledOrder(tracks.length, startIndex) : tracks.map((_, i) => i),
      orderPos: shuffleOn ? 0 : startIndex,
      source,
      isPlaying: true,
      progress: 0,
      playbackError: null,
    });
  },

  playShuffled: (tracks, source) => {
    localStorage.setItem(SHUFFLE_STORAGE, "true");
    set({
      queue: tracks,
      playOrder: fullShuffledOrder(tracks.length),
      orderPos: 0,
      source,
      shuffle: true,
      isPlaying: true,
      progress: 0,
      playbackError: null,
    });
  },

  togglePlay: () => set((s) => ({ isPlaying: s.queue.length > 0 && !s.isPlaying, playbackError: null })),
  setPlaying: (playing) => set({ isPlaying: playing, ...(playing ? { playbackError: null } : {}) }),
  setPlaybackError: (playbackError) => set({ playbackError }),

  next: () => {
    const { orderPos, playOrder, repeat } = get();
    if (orderPos + 1 < playOrder.length) {
      set({ orderPos: orderPos + 1, progress: 0, isPlaying: true, playbackError: null });
    } else if (repeat === "all") {
      set({ orderPos: 0, progress: 0, isPlaying: true, playbackError: null });
    } else {
      set({ isPlaying: false, progress: 0 });
    }
  },

  prev: () => {
    const { orderPos, progress } = get();
    if (progress > 3) {
      set({ progress: 0, seekRequest: 0, playbackError: null });
      return;
    }
    if (orderPos > 0) {
      set({ orderPos: orderPos - 1, progress: 0, playbackError: null });
    } else {
      set({ progress: 0, seekRequest: 0, playbackError: null });
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
      localStorage.setItem(SHUFFLE_STORAGE, "true");
      set({ shuffle: true, playOrder: newOrder, orderPos: 0 });
    } else {
      const newOrder = queue.map((_, i) => i);
      localStorage.setItem(SHUFFLE_STORAGE, "false");
      set({ shuffle: false, playOrder: newOrder, orderPos: currentQueueIndex ?? 0 });
    }
  },

  cycleRepeat: () => {
    const order: RepeatMode[] = ["off", "all", "one"];
    const next = order[(order.indexOf(get().repeat) + 1) % order.length];
    localStorage.setItem(REPEAT_STORAGE, next);
    set({ repeat: next });
  },

  seek: (time) => set({ progress: time, seekRequest: time }),
  clearSeekRequest: () => set({ seekRequest: null }),
  setProgress: (time) => set({ progress: time }),
  setDuration: (time) => set({ duration: time }),
  setShowNowPlaying: (show) => set({ showNowPlaying: show }),
  setShowLyrics: (show) => set({ showLyrics: show }),

  removeTrackFromQueue: (trackId) => {
    const { queue, playOrder, orderPos, isPlaying, progress } = get();
    const queueIndex = queue.findIndex((t) => t.id === trackId);
    if (queueIndex === -1) return;

    const removedOrderPos = playOrder.indexOf(queueIndex);
    if (removedOrderPos === -1) return;

    const newQueue = queue.filter((_, i) => i !== queueIndex);
    if (newQueue.length === 0) {
      get().reset();
      return;
    }

    const newPlayOrder = playOrder
      .filter((_, i) => i !== removedOrderPos)
      .map((idx) => (idx > queueIndex ? idx - 1 : idx));

    const isCurrent = removedOrderPos === orderPos;
    const isLast = removedOrderPos === playOrder.length - 1;

    let newOrderPos = orderPos;
    let newIsPlaying = isPlaying;
    let newProgress = progress;

    if (removedOrderPos < orderPos) {
      newOrderPos = orderPos - 1;
    } else if (isCurrent) {
      newProgress = 0;
      if (isLast) {
        newIsPlaying = false;
        newOrderPos = 0;
      }
    }

    set({
      queue: newQueue,
      playOrder: newPlayOrder,
      orderPos: newOrderPos,
      isPlaying: newIsPlaying,
      progress: newProgress,
      playbackError: null,
    });
  },
}));
