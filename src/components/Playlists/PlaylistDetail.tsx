import { useState } from "react";
import { Play, Shuffle, Trash2, Plus, Pencil } from "lucide-react";
import { useLibraryStore } from "../../store/libraryStore";
import { useUIStore } from "../../store/uiStore";
import { usePlayerStore } from "../../store/playerStore";
import { useDragReorder } from "../../hooks/useDragReorder";
import { BackHeader } from "../BackHeader";
import { CoverArt } from "../CoverArt";
import { ConfirmDialog } from "../ConfirmDialog";
import { ReorderableTrackRow } from "../ReorderableTrackRow";
import { TrackPickerModal } from "./TrackPickerModal";
import { RenamePlaylistModal } from "./RenamePlaylistModal";
import type { Track } from "../../types";

export function PlaylistDetail({ playlistId }: { playlistId: string }) {
  const playlist = useLibraryStore((s) => s.playlists.find((p) => p.id === playlistId));
  const allTracks = useLibraryStore((s) => s.tracks);
  const deletePlaylist = useLibraryStore((s) => s.deletePlaylist);
  const removeFromPlaylist = useLibraryStore((s) => s.removeFromPlaylist);
  const reorderPlaylist = useLibraryStore((s) => s.reorderPlaylist);
  const renamePlaylist = useLibraryStore((s) => s.renamePlaylist);
  const closeDetail = useUIStore((s) => s.closeDetail);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const playShuffled = usePlayerStore((s) => s.playShuffled);
  const currentTrackId = usePlayerStore((s) => s.currentTrack()?.id);

  const [confirmDeletePlaylist, setConfirmDeletePlaylist] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<Track | null>(null);
  const [showTrackPicker, setShowTrackPicker] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);

  const { orderedIds, draggingId, dragOffsetY, rowRefs, startDrag, moveDrag, endDrag } =
    useDragReorder(playlist?.trackIds ?? [], (ids) => reorderPlaylist(playlistId, ids));

  if (!playlist) return null;

  const tracks = orderedIds
    .map((id) => allTracks.find((t) => t.id === id))
    .filter((t): t is Track => Boolean(t));

  const confirmDeletePlaylistNow = () => {
    deletePlaylist(playlistId);
    closeDetail();
  };

  const buttons = (
    <div className="flex gap-3">
      <button
        type="button"
        disabled={tracks.length === 0}
        onClick={() => playQueue(tracks, 0, { type: "playlist", playlistId })}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-am-fill text-am-accent font-semibold hover:bg-am-fill/80 transition-colors disabled:opacity-40"
      >
        <Play className="w-4 h-4 fill-current" /> 재생
      </button>
      <button
        type="button"
        disabled={tracks.length === 0}
        onClick={() => playShuffled(tracks, { type: "playlist", playlistId })}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-am-fill text-am-accent font-semibold hover:bg-am-fill/80 transition-colors disabled:opacity-40"
      >
        <Shuffle className="w-4 h-4" /> 셔플
      </button>
      <button
        type="button"
        onClick={() => setShowTrackPicker(true)}
        aria-label="곡 추가"
        className="flex items-center justify-center w-11 h-11 rounded-full bg-am-fill text-am-accent hover:bg-am-fill/80 transition-colors"
      >
        <Plus className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => setConfirmDeletePlaylist(true)}
        aria-label="재생목록 삭제"
        className="flex items-center justify-center w-11 h-11 rounded-full bg-am-fill text-am-accent hover:bg-am-fill/80 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <BackHeader title={playlist.name} onBack={closeDetail} />
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain no-scrollbar px-4 pb-4">
        {/* Cover, title and track count scroll away with the list — no
          animation, no scroll handler. Only the button row below is sticky,
          with a fixed height that never changes, so scrolling stays 100%
          native (no layout work during scroll, nothing jumps). */}
        <div className="flex flex-col items-center text-center py-4 gap-3">
          <CoverArt
            artKey={tracks[0]?.artKey}
            alt={playlist.name}
            className="w-44 h-44"
            rounded="rounded-lg"
          />
          <div>
            <h2 className="text-xl font-bold text-am-text flex items-center justify-center">
              <button
                type="button"
                onClick={() => setShowRenameModal(true)}
                aria-label={`재생목록 이름 수정: ${playlist.name}`}
                className="inline-flex items-center justify-center gap-1.5 max-w-full min-w-0 px-2 py-0.5 -my-0.5 rounded-xl hover:bg-am-fill active:bg-am-fill/80 transition-colors group"
              >
                <span className="truncate">{playlist.name}</span>
                <Pencil className="w-4 h-4 text-am-muted shrink-0 group-hover:text-am-accent transition-colors" />
              </button>
            </h2>
            <p className="text-xs text-am-muted mt-1">{tracks.length}곡</p>
          </div>
        </div>

        {/* Sticky button row: fixed height (tallest button 44px + py-2),
          opaque background so list rows never show through, z-index above
          the list. Occupies flow space, so the first track row is never
          covered when the buttons stick. */}
        <div className="sticky top-0 z-20 bg-am-bg -mx-4 px-4 py-2 flex justify-center border-b border-am-separator">
          {buttons}
        </div>

        {tracks.length === 0 ? (
          <p className="text-center text-sm text-am-muted py-10">
            아직 이 재생목록에 곡이 없습니다.
            <br />+ 버튼으로 곡을 추가해보세요.
          </p>
        ) : (
          <div className="flex flex-col gap-1 mt-2">
            {tracks.map((track, i) => (
              <div key={track.id} ref={(el) => { rowRefs.current[track.id] = el; }}>
                <ReorderableTrackRow
                  track={track}
                  isActive={track.id === currentTrackId}
                  deleteLabel="재생목록에서 삭제"
                  translateY={draggingId === track.id ? dragOffsetY : 0}
                  elevated={draggingId === track.id}
                  onTap={() => playQueue(tracks, i, { type: "playlist", playlistId })}
                  onDeleteRequest={() => setPendingRemove(track)}
                  onDragStart={() => startDrag(track.id, i)}
                  onDragMove={(deltaY) => moveDrag(track.id, deltaY)}
                  onDragEnd={endDrag}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmDeletePlaylist && (
        <ConfirmDialog
          title="재생목록을 삭제할까요?"
          description={`"${playlist.name}"이(가) 삭제됩니다. 곡 자체는 라이브러리에 남습니다.`}
          onCancel={() => setConfirmDeletePlaylist(false)}
          onConfirm={confirmDeletePlaylistNow}
        />
      )}

      {pendingRemove && (
        <ConfirmDialog
          title="재생목록에서 삭제할까요?"
          description={`"${pendingRemove.title}"이(가) 이 재생목록에서만 제외됩니다.`}
          onCancel={() => setPendingRemove(null)}
          onConfirm={() => {
            removeFromPlaylist(playlistId, pendingRemove.id);
            setPendingRemove(null);
          }}
        />
      )}

      {showTrackPicker && (
        <TrackPickerModal
          playlistId={playlistId}
          existingTrackIds={playlist.trackIds}
          onClose={() => setShowTrackPicker(false)}
        />
      )}

      {showRenameModal && (
        <RenamePlaylistModal
          initialName={playlist.name}
          onClose={() => setShowRenameModal(false)}
          onRename={(newName) => {
            if (newName !== playlist.name) {
              renamePlaylist(playlistId, newName);
            }
          }}
        />
      )}
    </div>
  );
}
