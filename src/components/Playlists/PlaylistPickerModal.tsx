import { useState } from "react";
import { Plus, ListMusic, X } from "lucide-react";
import { useLibraryStore } from "../../store/libraryStore";
import { NewPlaylistModal } from "./NewPlaylistModal";

interface PlaylistPickerModalProps {
  trackIds: string[];
  onClose: () => void;
  onAdded?: () => void;
}

/** Floating picker for "send these already-selected tracks to a playlist" —
 *  used by the songs tab's multi-select add button. */
export function PlaylistPickerModal({ trackIds, onClose, onAdded }: PlaylistPickerModalProps) {
  const playlists = useLibraryStore((s) => s.playlists);
  const addTracksToPlaylist = useLibraryStore((s) => s.addTracksToPlaylist);
  const [showNew, setShowNew] = useState(false);

  const sendTo = async (playlistId: string) => {
    await addTracksToPlaylist(playlistId, trackIds);
    onAdded?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-sm max-h-[70vh] nm-raised rounded-3xl p-5 flex flex-col">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h2 className="text-lg font-semibold">
            재생목록에 추가 <span className="text-nm-text-muted text-sm">· {trackIds.length}곡</span>
          </h2>
          <button type="button" aria-label="닫기" onClick={onClose}>
            <X className="w-5 h-5 text-nm-text-muted" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto nm-scrollbar-none flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setShowNew(true)}
            className="flex items-center gap-3 px-2 py-2.5 rounded-2xl hover:bg-nm-text/5 text-left shrink-0"
          >
            <div className="w-10 h-10 rounded-xl nm-flat flex items-center justify-center text-nm-accent shrink-0">
              <Plus className="w-5 h-5" />
            </div>
            <p className="text-[15px] text-nm-accent font-medium">새로운 재생목록</p>
          </button>

          {playlists.length === 0 ? (
            <p className="text-center text-sm text-nm-text-muted py-6">재생목록이 없습니다</p>
          ) : (
            playlists.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => sendTo(p.id)}
                className="flex items-center gap-3 px-2 py-2.5 rounded-2xl hover:bg-nm-text/5 text-left"
              >
                <div className="w-10 h-10 rounded-xl nm-inset-sm flex items-center justify-center text-nm-text-muted shrink-0">
                  <ListMusic className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[15px]">{p.name}</p>
                  <p className="truncate text-[12px] text-nm-text-muted">{p.trackIds.length}곡</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {showNew && (
        <NewPlaylistModal
          onClose={() => setShowNew(false)}
          onCreated={(playlistId) => sendTo(playlistId)}
        />
      )}
    </div>
  );
}
