import { useCallback, useLayoutEffect, useRef, useState } from "react";
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

/** Cover size in the expanded header (w-44) and in the pinned row (w-12). */
const COVER_MAX_PX = 176;
const COVER_MIN_PX = 48;
/** Scroll distance (px) over which the header fully collapses. */
const COLLAPSE_PX = 140;

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
  /** Layout switch only: false = expanded column header, true = pinned row
   *  (small cover left, buttons beside it). Flips once at the end of the
   *  collapse; the continuous values are applied imperatively (see
   *  applyProgress) so scrolling never re-renders the track list. */
  const [collapsed, setCollapsed] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const coverRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLDivElement | null>(null);

  /** Drive the collapse from the list's scroll position. Cover size, title
   *  fade/collapse, header padding and gaps interpolate smoothly with
   *  scrollTop; the layout only flips to the pinned row at progress 1. */
  const applyProgress = useCallback((scrollTop: number) => {
    const progress = Math.min(Math.max(scrollTop / COLLAPSE_PX, 0), 1);
    const coverSize = COVER_MAX_PX - (COVER_MAX_PX - COVER_MIN_PX) * progress;
    if (coverRef.current) {
      coverRef.current.style.width = `${coverSize}px`;
      coverRef.current.style.height = `${coverSize}px`;
    }
    const title = titleRef.current;
    if (title) {
      const natural = title.scrollHeight || 56;
      title.style.height = `${natural * (1 - progress)}px`;
      title.style.opacity = `${1 - progress}`;
    }
    const inner = innerRef.current;
    if (inner) {
      inner.style.paddingTop = `${16 - 8 * progress}px`;
      inner.style.paddingBottom = `${16 - 8 * progress}px`;
      inner.style.gap = `${progress >= 1 ? 8 : 12 * (1 - progress)}px`;
    }
    setCollapsed(progress >= 1);
  }, []);

  const handleScroll = useCallback(() => {
    applyProgress(scrollRef.current?.scrollTop ?? 0);
  }, [applyProgress]);

  // Re-apply after mount, after the layout flip (the title block remounts
  // and loses its imperative styles) and after a rename (the title's
  // natural height may change). Layout effect, so the styles land before
  // paint and the remounted title never flashes at full size.
  useLayoutEffect(() => {
    applyProgress(scrollRef.current?.scrollTop ?? 0);
  }, [applyProgress, collapsed, playlist?.name]);

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
    <div key="buttons" className={collapsed ? "flex gap-2 shrink-0" : "flex gap-3"}>
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
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain no-scrollbar px-4 pb-4"
      >
        <div
          className={
            collapsed
              ? "sticky top-0 z-20 bg-am-bg border-b border-am-separator"
              : "sticky top-0 z-20 bg-am-bg"
          }
        >
          {collapsed ? (
            <div ref={innerRef} className="flex items-center gap-2 py-2">
              <div key="cover" ref={coverRef} className="w-12 h-12 shrink-0">
                <CoverArt
                  artKey={tracks[0]?.artKey}
                  alt={playlist.name}
                  className="w-full h-full"
                  rounded="rounded-lg"
                />
              </div>
              {buttons}
            </div>
          ) : (
            <div ref={innerRef} className="flex flex-col items-center text-center py-4 gap-3">
              <div key="cover" ref={coverRef} className="w-44 h-44 shrink-0">
                <CoverArt
                  artKey={tracks[0]?.artKey}
                  alt={playlist.name}
                  className="w-full h-full"
                  rounded="rounded-lg"
                />
              </div>
              <div key="title" ref={titleRef} className="overflow-hidden">
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
              {buttons}
            </div>
          )}
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
