import { create } from "zustand";

/** The songs tab's multi-select state lives outside the component so the
 *  shared header (in App.tsx) can swap its title for "N개 선택됨 · 취소"
 *  without the title row and the list needing to be the same component. */
interface SongSelectionState {
  active: boolean;
  selected: Set<string>;
  enter: (firstId: string) => void;
  enterEmpty: () => void;
  toggle: (id: string) => void;
  clear: () => void;
}

export const useSongSelectionStore = create<SongSelectionState>((set) => ({
  active: false,
  selected: new Set(),

  enter: (firstId) => set({ active: true, selected: new Set([firstId]) }),
  enterEmpty: () => set({ active: true, selected: new Set() }),

  toggle: (id) =>
    set((state) => {
      const next = new Set(state.selected);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selected: next };
    }),

  clear: () => set({ active: false, selected: new Set() }),
}));
