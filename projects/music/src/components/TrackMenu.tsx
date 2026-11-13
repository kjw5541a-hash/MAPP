import { useState } from "react";
import { MoreHorizontal, ListPlus, Trash2, ListMinus } from "lucide-react";
import { useLibraryStore } from "../store/libraryStore";
import type { Track } from "../types";
import { ConfirmDialog } from "./ConfirmDialog";

interface TrackMenuProps {
  track: Track;
  playlistIdContext?: string;
}

export function TrackMenu({ track, playlistIdContext }: TrackMenuProps) {
  const [open, setOpen] = useState(false);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const playlists = useLibraryStore((s) => s.playlists);
  const addToPlaylist = useLibraryStore((s) => s.addToPlaylist);
  const removeFromPlaylist = useLibraryStore((s) => s.removeFromPlaylist);
  const deleteTrack = useLibraryStore((s) => s.deleteTrack);

  const close = () => {
    setOpen(false);
    setShowPlaylists(false);
    setShowConfirmDelete(false);
  };

  return (
    <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label="더보기"
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 am-icon-btn flex items-center justify-center shrink-0 text-am-muted hover:text-am-text"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} />
          <div className="absolute right-0 top-10 z-50 w-56 bg-white border border-am-separator rounded-2xl p-1.5 text-sm">
            {!showPlaylists ? (
              <>
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-am-fill transition-colors text-left text-am-text"
                  onClick={() => setShowPlaylists(true)}
                >
                  <ListPlus className="w-4 h-4" /> 재생목록에 추가
                </button>
                {playlistIdContext && (
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-am-fill transition-colors text-left text-am-text"
                    onClick={() => {
                      removeFromPlaylist(playlistIdContext, track.id);
                      close();
                    }}
                  >
                    <ListMinus className="w-4 h-4" /> 이 재생목록에서 삭제
                  </button>
                )}
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-am-fill transition-colors text-left text-am-accent"
                  onClick={() => setShowConfirmDelete(true)}
                >
                  <Trash2 className="w-4 h-4" /> 라이브러리에서 삭제
                </button>
              </>
            ) : playlists.length === 0 ? (
              <p className="px-3 py-2 text-am-muted">재생목록이 없습니다</p>
            ) : (
              playlists.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-am-fill transition-colors text-left truncate text-am-text"
                  onClick={() => {
                    addToPlaylist(p.id, track.id);
                    close();
                  }}
                >
                  {p.name}
                </button>
              ))
            )}
          </div>
        </>
      )}

      {showConfirmDelete && (
        <ConfirmDialog
          title="라이브러리에서 삭제할까요?"
          description={`"${track.title}"이(가) 모든 재생목록에서도 함께 삭제됩니다.`}
          confirmLabel="삭제"
          onCancel={() => setShowConfirmDelete(false)}
          onConfirm={() => {
            deleteTrack(track.id);
            close();
          }}
        />
      )}
    </div>
  );
}
