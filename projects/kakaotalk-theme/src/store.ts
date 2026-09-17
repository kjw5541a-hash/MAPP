import { openDB } from "idb";
import { create } from "zustand";
import {
  newTheme,
  sanitize,
  type BackgroundKey,
  type KakaoTheme,
  type ThemeImage,
} from "./theme";

// Background images are easily a few megabytes, which localStorage cannot hold,
// so the whole draft lives in IndexedDB under a single key.
const DB_NAME = "kakao-theme-maker";
const STORE = "draft";
const KEY = "current";

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    db.createObjectStore(STORE);
  },
});

async function saveDraft(theme: KakaoTheme) {
  (await dbPromise).put(STORE, theme, KEY);
}

interface EditorState {
  theme: KakaoTheme;
  screen: "chatroom" | "friends";
  setScreen: (screen: EditorState["screen"]) => void;
  setName: (name: string) => void;
  setAuthor: (author: string) => void;
  setColor: (key: string, value: string) => void;
  setImage: (key: BackgroundKey, image: ThemeImage | null) => void;
  /** Replaces every color at once — presets and imported files both land here. */
  replace: (theme: KakaoTheme) => void;
}

export const useEditor = create<EditorState>((set, get) => {
  function update(patch: (theme: KakaoTheme) => KakaoTheme) {
    const theme = patch(get().theme);
    set({ theme });
    saveDraft(theme);
  }

  return {
    theme: newTheme(),
    screen: "chatroom",
    setScreen: (screen) => set({ screen }),
    setName: (name) => update((t) => ({ ...t, name })),
    setAuthor: (author) => update((t) => ({ ...t, author })),
    setColor: (key, value) => update((t) => ({ ...t, colors: { ...t.colors, [key]: value } })),
    setImage: (key, image) =>
      update((t) => {
        const images = { ...t.images };
        if (image) images[key] = image;
        else delete images[key];
        return { ...t, images };
      }),
    replace: (theme) => update(() => theme),
  };
});

/** Restores the previous session's draft, if there is one. */
export async function loadDraft() {
  const saved = sanitize(await (await dbPromise).get(STORE, KEY));
  if (saved) useEditor.setState({ theme: saved });
}
