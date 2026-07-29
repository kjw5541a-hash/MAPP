import { create } from "zustand";

export const THEMES = [
  { id: "soft", label: "소프트", description: "부드러운 회색 뉴모피즘" },
  { id: "dark", label: "다크", description: "어두운 뉴모피즘" },
  { id: "blue", label: "블루 글로우", description: "조작 요소에 파란 발광" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

const STORAGE_KEY = "mapp-theme";

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
  };
});
