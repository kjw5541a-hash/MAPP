import { useState } from "react";
import { ListMusic, Plus } from "lucide-react";
import { useLibraryStore } from "../../store/libraryStore";
import { useUIStore } from "../../store/uiStore";
import { usePlayerStore } from "../../store/playerStore";
import { useViewportDiagnostics } from "../../hooks/useViewportDiagnostics";
import { CoverArt } from "../CoverArt";
import { NewPlaylistModal } from "./NewPlaylistModal";

export function PlaylistsList() {
  const playlists = useLibraryStore((s) => s.playlists);
  const tracks = useLibraryStore((s) => s.tracks);
  const clearLibrary = useLibraryStore((s) => s.clearLibrary);
  const resetPlayer = usePlayerStore((s) => s.reset);
  const openPlaylist = useUIStore((s) => s.openPlaylist);
  const [showNew, setShowNew] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const diagnostics = useViewportDiagnostics();

  return (
    <div className="flex flex-col gap-1 px-4 py-2">
      <button
        type="button"
        onClick={() => setShowNew(true)}
        className="flex items-center gap-3 px-2 py-2.5 rounded-2xl hover:bg-nm-text/5 text-left"
      >
        <div className="w-11 h-11 rounded-xl nm-flat flex items-center justify-center text-nm-accent shrink-0">
          <Plus className="w-5 h-5" />
        </div>
        <p className="text-[15px] text-nm-accent font-medium">새로운 재생목록</p>
      </button>

      {playlists.map((playlist) => {
        const firstTrack = tracks.find((t) => t.id === playlist.trackIds[0]);
        return (
          <button
            key={playlist.id}
            type="button"
            onClick={() => openPlaylist(playlist.id)}
            className="flex items-center gap-3 px-2 py-2.5 rounded-2xl hover:bg-nm-text/5 text-left"
          >
            {firstTrack ? (
              <CoverArt artKey={firstTrack.artKey} alt={playlist.name} className="w-11 h-11" />
            ) : (
              <div className="w-11 h-11 rounded-xl nm-inset-sm flex items-center justify-center text-nm-text-muted shrink-0">
                <ListMusic className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-[15px]">{playlist.name}</p>
              <p className="truncate text-[13px] text-nm-text-muted">{playlist.trackIds.length}곡</p>
            </div>
          </button>
        );
      })}

      <div className="pt-10 pb-2 flex flex-col items-center gap-2">
        {confirmClear ? (
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-nm-text-muted">전체 {tracks.length}곡을 지울까요?</span>
            <button
              type="button"
              onClick={() => setConfirmClear(false)}
              className="px-3 py-1.5 rounded-full nm-flat"
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
              className="px-3 py-1.5 rounded-full nm-flat text-red-500"
            >
              지우기
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={tracks.length === 0 && playlists.length === 0}
            onClick={() => setConfirmClear(true)}
            className="text-[12px] text-nm-text-muted/80 disabled:opacity-40"
          >
            라이브러리 전체 비우기
          </button>
        )}

        <p className="text-center text-[11px] text-nm-text-muted/70 tabular-nums">{__BUILD_ID__}</p>
        {diagnostics && (
          <p className="text-center text-[10px] text-nm-text-muted/50 tabular-nums whitespace-pre-line leading-relaxed">
            {diagnostics}
          </p>
        )}
      </div>

      {showNew && <NewPlaylistModal onClose={() => setShowNew(false)} />}
    </div>
  );
}
