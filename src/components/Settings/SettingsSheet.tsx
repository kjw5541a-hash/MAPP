import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { useVisualViewportRect } from "../../hooks/useViewport";
import { useSettingsStore } from "../../store/settingsStore";
import { useLibraryStore } from "../../store/libraryStore";
import { usePlayerStore } from "../../store/playerStore";
import { listModels, type GeminiModel } from "../../lib/recommend";
import { getStorageInfo, type StorageInfo } from "../../lib/storage";
import { formatBytes } from "../../lib/format";
import { exportLibraryBackup } from "../../lib/backup";
import type { LibraryBackup } from "../../types";

export function SettingsSheet({ onClose }: { onClose: () => void }) {
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
  const restoreBackup = useLibraryStore((s) => s.restoreBackup);
  const resetPlayer = usePlayerStore((s) => s.reset);
  const [confirmClear, setConfirmClear] = useState(false);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [restoreStatus, setRestoreStatus] = useState<{ message: string; isError?: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // See NewPlaylistModal: size from the visual viewport so the sheet
  // shrinks to the area above the virtual keyboard instead of extending
  // behind it (the Gemini API key input stays reachable).
  const vv = useVisualViewportRect();

  useEffect(() => {
    void getStorageInfo().then(setStorageInfo);
  }, []);

  return (
    <div
      className="fixed z-50 flex flex-col bg-am-bg"
      style={{ top: vv.top, left: vv.left, width: vv.width, height: vv.height }}
    >
      <div className="flex items-center gap-3 px-4 pb-2 shrink-0 safe-top">
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="w-9 h-9 am-icon-btn flex items-center justify-center text-am-text"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-am-text">설정</h1>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain no-scrollbar px-4 pb-6">
        <h2 className="text-[13px] text-am-muted px-2 pt-8 pb-2">AI 추천</h2>
        <div className="bg-am-fill rounded-2xl px-4 py-3">
          <label className="text-[14px] text-am-text" htmlFor="gemini-key">
            Gemini API 키
          </label>
          <input
            id="gemini-key"
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIza…"
            className="w-full bg-white border border-am-separator rounded-xl px-3 py-2.5 mt-2 outline-none text-[14px] text-am-text placeholder:text-am-muted"
          />
          <p className="text-[12px] text-am-muted mt-2 leading-relaxed">
            이 기기에만 저장되며 앱 코드에는 포함되지 않습니다. Google AI Studio에서 무료로 발급받을
            수 있습니다.
          </p>

          <div className="border-t border-am-separator mt-4 pt-3">
            <p className="text-[14px] text-am-text">모델</p>
            <p className="text-[12px] text-am-muted mt-1 break-all">현재: {model}</p>

            {models.length > 0 ? (
              <select
                value={models.some((m) => m.id === model) ? model : ""}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-white border border-am-separator rounded-xl px-3 py-2.5 mt-2 outline-none text-[14px] text-am-text"
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
                className="w-full py-2.5 rounded-xl bg-white border border-am-separator text-[13px] text-am-accent mt-2 font-medium disabled:opacity-40 hover:bg-white/80 transition-colors"
              >
                {loadingModels ? "불러오는 중…" : "사용 가능한 모델 불러오기"}
              </button>
            )}

            {modelError && (
              <p className="text-[12px] text-am-accent mt-2 whitespace-pre-line break-words leading-relaxed">
                {modelError}
              </p>
            )}
          </div>
        </div>

        <h2 className="text-[13px] text-am-muted px-2 pt-8 pb-2">라이브러리</h2>
        <div className="bg-am-fill rounded-2xl px-4 py-3">
          <p className="text-[14px] text-am-text">
            곡 {tracks.length}개 · 재생목록 {playlists.length}개
          </p>
          {confirmClear ? (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-[13px] text-am-muted flex-1">전부 지울까요?</span>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="px-3 py-1.5 rounded-full bg-white border border-am-separator text-[13px] text-am-text font-medium"
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
                className="px-3 py-1.5 rounded-full bg-white border border-am-separator text-[13px] text-am-accent font-medium"
              >
                지우기
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={tracks.length === 0 && playlists.length === 0}
              onClick={() => setConfirmClear(true)}
              className="text-[13px] text-am-accent mt-2 disabled:opacity-40 font-medium"
            >
              라이브러리 전체 비우기
            </button>
          )}
        </div>

        <h2 className="text-[13px] text-am-muted px-2 pt-8 pb-2">백업</h2>
        <div className="bg-am-fill rounded-2xl px-4 py-3">
          {storageInfo && (
            <div className="text-[13px] text-am-muted space-y-1 pb-3 border-b border-am-separator">
              <p>
                저장 공간: {formatBytes(storageInfo.usage)} / {formatBytes(storageInfo.quota)}
              </p>
              <p>
                영속성: {storageInfo.persisted ? "유지됨" : "기본"}
              </p>
            </div>
          )}

          <p className="text-[12px] text-am-muted mt-3 leading-relaxed">
            오디오 원본은 내보내지지 않으며, 좋아요와 재생목록 정보만 백업됩니다.
          </p>

          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => void exportLibraryBackup(tracks, playlists)}
              className="flex-1 py-2.5 rounded-xl bg-white border border-am-separator text-[13px] text-am-accent font-medium hover:bg-white/80 transition-colors"
            >
              백업 내보내기
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2.5 rounded-xl bg-white border border-am-separator text-[13px] text-am-accent font-medium hover:bg-white/80 transition-colors"
            >
              백업 가져오기
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                e.target.value = "";
                try {
                  const text = await file.text();
                  const data = JSON.parse(text) as LibraryBackup;
                  if (!data || typeof data !== "object" || typeof data.version !== "number" || data.version !== 1) {
                    setRestoreStatus({ message: "지원하지 않는 백업 파일 버전입니다.", isError: true });
                    return;
                  }
                  const result = await restoreBackup(data);
                  setRestoreStatus({
                    message: `복원 완료: 좋아요 ${result.restoredLikes}개, 재생목록 ${result.restoredPlaylists}개`,
                    isError: false,
                  });
                  void getStorageInfo().then(setStorageInfo);
                } catch {
                  setRestoreStatus({ message: "백업 파일을 읽는 중 오류가 발생했습니다.", isError: true });
                }
              }}
              className="hidden"
            />
          </div>

          {restoreStatus && (
            <p className={`text-[12px] mt-2 ${restoreStatus.isError ? "text-am-accent" : "text-am-accent"}`}>
              {restoreStatus.message}
            </p>
          )}
        </div>

        <p className="text-center text-[11px] text-am-muted/70 tabular-nums pt-8">
          {__BUILD_ID__}
        </p>
      </div>
    </div>
  );
}
