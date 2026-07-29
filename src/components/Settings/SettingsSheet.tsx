import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useSettingsStore, THEMES } from "../../store/settingsStore";
import { useLibraryStore } from "../../store/libraryStore";
import { usePlayerStore } from "../../store/playerStore";
import { listModels, type GeminiModel } from "../../lib/recommend";

export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const apiKey = useSettingsStore((s) => s.geminiApiKey);
  const setApiKey = useSettingsStore((s) => s.setGeminiApiKey);
  const model = useSettingsStore((s) => s.geminiModel);
  const setModel = useSettingsStore((s) => s.setGeminiModel);
  const [models, setModels] = useState<GeminiModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
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

        <h2 className="text-[13px] text-nm-text-muted px-2 pt-8 pb-2">AI 추천</h2>
        <div className="nm-flat rounded-2xl px-4 py-3">
          <label className="text-[14px]" htmlFor="gemini-key">
            Gemini API 키
          </label>
          <input
            id="gemini-key"
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIza…"
            className="w-full nm-inset-sm rounded-xl px-3 py-2.5 mt-2 outline-none text-[14px] placeholder:text-nm-text-muted"
          />
          <p className="text-[12px] text-nm-text-muted mt-2 leading-relaxed">
            이 기기에만 저장되며 앱 코드에는 포함되지 않습니다. Google AI Studio에서 무료로 발급받을
            수 있습니다.
          </p>

          <div className="border-t border-nm-text/10 mt-4 pt-3">
            <p className="text-[14px]">모델</p>
            <p className="text-[12px] text-nm-text-muted mt-1 break-all">현재: {model}</p>

            {models.length > 0 ? (
              <select
                value={models.some((m) => m.id === model) ? model : ""}
                onChange={(e) => setModel(e.target.value)}
                className="w-full nm-inset-sm rounded-xl px-3 py-2.5 mt-2 outline-none text-[14px]"
              >
                <option value="" disabled>
                  모델 선택
                </option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id}
                  </option>
                ))}
              </select>
            ) : (
              <button
                type="button"
                disabled={!apiKey || loadingModels}
                onClick={async () => {
                  setLoadingModels(true);
                  setModelError(null);
                  try {
                    setModels(await listModels(apiKey));
                  } catch (err) {
                    setModelError(err instanceof Error ? err.message : "불러오지 못했습니다.");
                  } finally {
                    setLoadingModels(false);
                  }
                }}
                className="w-full py-2.5 rounded-xl nm-flat text-[13px] text-nm-accent mt-2 disabled:opacity-40"
              >
                {loadingModels ? "불러오는 중…" : "사용 가능한 모델 불러오기"}
              </button>
            )}

            {modelError && (
              <p className="text-[12px] text-red-500 mt-2 whitespace-pre-line break-words leading-relaxed">
                {modelError}
              </p>
            )}
          </div>
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
