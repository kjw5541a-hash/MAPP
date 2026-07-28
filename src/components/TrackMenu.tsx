import { useState } from "react";
import { MoreHorizontal, ListPlus, Trash2, ListMinus } from "lucide-react";
import { useLibraryStore } from "../store/libraryStore";
import type { Track } from "../types";

interface TrackMenuProps {
  track: Track;
  playlistIdContext?: string;
}

export function TrackMenu({ track, playlistIdContext }: TrackMenuProps) {
  const [open, setOpen] = useState(false);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const playlists = useLibraryStore((s) => s.playlists);
  const addToPlaylist = useLibraryStore((s) => s.addToPlaylist);
  const removeFromPlaylist = useLibraryStore((s) => s.removeFromPlaylist);
  const deleteTrack = useLibraryStore((s) => s.deleteTrack);

  const close = () => {
    setOpen(false);
    setShowPlaylists(false);
  };

  return (
    <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label="더보기"
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 flex items-center justify-center rounded-full text-nm-text-muted"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} />
          <div className="absolute right-0 top-10 z-50 w-56 nm-raised rounded-2xl p-2 text-sm">
            {!showPlaylists ? (
              <>
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-nm-text/10 transition-colors text-left"
                  onClick={() => setShowPlaylists(true)}
                >
                  <ListPlus className="w-4 h-4" /> 재생목록에 추가
                </button>
                {playlistIdContext && (
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-nm-text/10 transition-colors text-left"
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
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-nm-text/10 transition-colors text-left text-red-500"
                  onClick={() => {
                    deleteTrack(track.id);
                    close();
                  }}
                >
                  <Trash2 className="w-4 h-4" /> 라이브러리에서 삭제
                </button>
              </>
            ) : playlists.length === 0 ? (
              <p className="px-3 py-2 text-nm-text-muted">재생목록이 없습니다</p>
            ) : (
              playlists.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-nm-text/10 transition-colors text-left truncate"
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
    </div>
  );
}
