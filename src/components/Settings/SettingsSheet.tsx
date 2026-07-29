import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useSettingsStore, THEMES } from "../../store/settingsStore";
import { useLibraryStore } from "../../store/libraryStore";
import { usePlayerStore } from "../../store/playerStore";

export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const tracks = useLibraryStore((s) => s.tracks);
  const playlists = useLibraryStore((s) => s.playlists);
  const clearLibrary = useLibraryStore((s) => s.clearLibrary);
  const resetPlayer = usePlayerStore((s) => s.reset);
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-nm-bg">
      <div className="flex items-center gap-3 px-4 pb-2 shrink-0 safe-top">
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="w-9 h-9 rounded-full nm-flat flex items-center justify-center"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold">설정</h1>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain nm-scrollbar-none px-4 pb-6">
        <h2 className="text-[13px] text-nm-text-muted px-2 pt-4 pb-2">테마</h2>
        <div className="flex flex-col gap-2">
          {THEMES.map((t) => {
            const active = t.id === theme;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all ${
                  active ? "nm-pressed" : "nm-flat"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className={`text-[15px] ${active ? "text-nm-accent" : ""}`}>{t.label}</p>
                  <p className="text-[12px] text-nm-text-muted">{t.description}</p>
                </div>
                {active && <Check className="w-5 h-5 text-nm-accent shrink-0" />}
              </button>
            );
          })}
        </div>

        <h2 className="text-[13px] text-nm-text-muted px-2 pt-8 pb-2">라이브러리</h2>
        <div className="nm-flat rounded-2xl px-4 py-3">
          <p className="text-[14px]">
            곡 {tracks.length}개 · 재생목록 {playlists.length}개
          </p>
          {confirmClear ? (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-[13px] text-nm-text-muted flex-1">전부 지울까요?</span>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="px-3 py-1.5 rounded-full nm-flat text-[13px]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={async () => {
                  resetPlayer();
                  await clearLibrary();
                  setConfirmClear(false);
                }}
                className="px-3 py-1.5 rounded-full nm-flat text-[13px] text-red-500"
              >
                지우기
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={tracks.length === 0 && playlists.length === 0}
              onClick={() => setConfirmClear(true)}
              className="text-[13px] text-red-500 mt-2 disabled:opacity-40"
            >
              라이브러리 전체 비우기
            </button>
          )}
        </div>

        <p className="text-center text-[11px] text-nm-text-muted/70 tabular-nums pt-8">
          {__BUILD_ID__}
        </p>
      </div>
    </div>
  );
}
