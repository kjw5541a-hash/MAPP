import { create } from "zustand";
import { DEFAULT_MODEL } from "../lib/recommend";

export const THEMES = [
  { id: "soft", label: "소프트", description: "부드러운 회색 뉴모피즘" },
  { id: "dark", label: "다크", description: "어두운 뉴모피즘" },
  { id: "blue", label: "블루 글로우", description: "깊게 파인 입체감에 파란 발광" },
  { id: "clay", label: "클레이", description: "흰 배경에 도톰하게 떠 있는 3D" },
  { id: "cream", label: "크림 민트", description: "따뜻한 아이보리에 민트 포인트" },
  { id: "sticker", label: "스티커", description: "굵은 검정 테두리에 파스텔" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

const STORAGE_KEY = "mapp-theme";
const API_KEY_STORAGE = "mapp-gemini-key";
const MODEL_STORAGE = "mapp-gemini-model";

function isThemeId(value: string | null): value is ThemeId {
  return THEMES.some((t) => t.id === value);
}

function initialTheme(): ThemeId {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (isThemeId(saved)) return saved;
  // Only the very first launch follows the device; after that the choice is
  // the user's, since themes carry their own brightness.
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "soft";
}

function apply(theme: ThemeId) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  // Keeps the iOS status bar and any area outside the viewport matching.
  const bg = getComputedStyle(root).getPropertyValue("--nm-bg").trim();
  if (bg) document.querySelector('meta[name="theme-color"]')?.setAttribute("content", bg);
}

interface SettingsState {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  /** Kept in device storage only — never bundled, never sent anywhere but Google. */
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  geminiModel: string;
  setGeminiModel: (model: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => {
  const theme = initialTheme();
  apply(theme);

  return {
    theme,
    setTheme: (next) => {
      localStorage.setItem(STORAGE_KEY, next);
      apply(next);
      set({ theme: next });
    },

    geminiApiKey: localStorage.getItem(API_KEY_STORAGE) ?? "",
    setGeminiApiKey: (key) => {
      const trimmed = key.trim();
      if (trimmed) localStorage.setItem(API_KEY_STORAGE, trimmed);
      else localStorage.removeItem(API_KEY_STORAGE);
      set({ geminiApiKey: trimmed });
    },

    geminiModel: localStorage.getItem(MODEL_STORAGE) ?? DEFAULT_MODEL,
    setGeminiModel: (model) => {
      localStorage.setItem(MODEL_STORAGE, model);
      set({ geminiModel: model });
    },
  };
});
