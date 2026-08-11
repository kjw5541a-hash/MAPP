import { useRef, useState } from "react";
import { Play, Shuffle, Trash2, Plus } from "lucide-react";
import { useLibraryStore } from "../../store/libraryStore";
import { useUIStore } from "../../store/uiStore";
import { usePlayerStore } from "../../store/playerStore";
import { BackHeader } from "../BackHeader";
import { CoverArt } from "../CoverArt";
import { ConfirmDialog } from "../ConfirmDialog";
import { PlaylistTrackRow } from "./PlaylistTrackRow";
import { TrackPickerModal } from "./TrackPickerModal";
import type { Track } from "../../types";

const ROW_GAP = 4; // px — matches the list's gap-1

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function PlaylistDetail({ playlistId }: { playlistId: string }) {
  const playlist = useLibraryStore((s) => s.playlists.find((p) => p.id === playlistId));
  const allTracks = useLibraryStore((s) => s.tracks);
  const deletePlaylist = useLibraryStore((s) => s.deletePlaylist);
  const removeFromPlaylist = useLibraryStore((s) => s.removeFromPlaylist);
  const reorderPlaylist = useLibraryStore((s) => s.reorderPlaylist);
  const closeDetail = useUIStore((s) => s.closeDetail);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const playShuffled = usePlayerStore((s) => s.playShuffled);
  const currentTrackId = usePlayerStore((s) => s.currentTrack()?.id);

  const [confirmDeletePlaylist, setConfirmDeletePlaylist] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<Track | null>(null);
  const [showTrackPicker, setShowTrackPicker] = useState(false);

  // Live-reordered copy of the id list while a drag is in progress; the
  // playlist's own order is only touched once, on release.
  const [workingIds, setWorkingIds] = useState<string[] | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState(0);

  const rowHeight = useRef(0);
  const originalIndex = useRef(0);
  const currentIndex = useRef(0);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  if (!playlist) return null;

  const orderedIds = workingIds ?? playlist.trackIds;
  const tracks = orderedIds
    .map((id) => allTracks.find((t) => t.id === id))
    .filter((t): t is Track => Boolean(t));

  const startDrag = (trackId: string, index: number) => {
    const el = rowRefs.current[trackId];
    rowHeight.current = (el?.getBoundingClientRect().height ?? 60) + ROW_GAP;
    originalIndex.current = index;
    currentIndex.current = index;
    setWorkingIds(playlist.trackIds);
    setDraggingId(trackId);
  };

  const moveDrag = (trackId: string, deltaY: number) => {
    const step = rowHeight.current || 60;
    const rawSteps = Math.round(deltaY / step);
    const len = playlist.trackIds.length;
    const targetIndex = Math.max(0, Math.min(len - 1, originalIndex.current + rawSteps));
    const appliedSteps = targetIndex - originalIndex.current;
    setDragOffsetY(deltaY - appliedSteps * step);

    if (targetIndex !== currentIndex.current) {
      setWorkingIds((prev) => {
        if (!prev) return prev;
        const from = prev.indexOf(trackId);
        return arrayMove(prev, from, targetIndex);
      });
      currentIndex.current = targetIndex;
    }
  };

  const endDrag = () => {
    if (workingIds) reorderPlaylist(playlistId, workingIds);
    setWorkingIds(null);
    setDraggingId(null);
    setDragOffsetY(0);
  };

  const confirmDeletePlaylistNow = () => {
    deletePlaylist(playlistId);
    closeDetail();
  };

  return (
    <div className="flex flex-col h-full">
      <BackHeader title={playlist.name} onBack={closeDetail} />
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain nm-scrollbar-none px-4 pb-4">
        <div className="flex flex-col items-center text-center py-4 gap-3">
          <CoverArt
            artKey={tracks[0]?.artKey}
            alt={playlist.name}
            className="w-44 h-44"
            rounded="rounded-2xl"
          />
          <div>
            <h2 className="text-xl font-semibold">{playlist.name}</h2>
            <p className="text-xs text-nm-text-muted mt-1">{tracks.length}곡</p>
          </div>
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              disabled={tracks.length === 0}
              onClick={() => playQueue(tracks, 0, { type: "playlist", playlistId })}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full nm-raised text-nm-accent font-medium disabled:opacity-40"
            >
              <Play className="w-4 h-4 fill-current" /> 재생
            </button>
            <button
              type="button"
              disabled={tracks.length === 0}
              onClick={() => playShuffled(tracks, { type: "playlist", playlistId })}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full nm-raised text-nm-accent font-medium disabled:opacity-40"
            >
              <Shuffle className="w-4 h-4" /> 셔플
            </button>
            <button
              type="button"
              onClick={() => setShowTrackPicker(true)}
              aria-label="곡 추가"
              className="flex items-center justify-center w-11 h-11 rounded-full nm-raised text-nm-accent"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setConfirmDeletePlaylist(true)}
              aria-label="재생목록 삭제"
              className="flex items-center justify-center w-11 h-11 rounded-full nm-raised text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {tracks.length === 0 ? (
          <p className="text-center text-sm text-nm-text-muted py-10">
            아직 이 재생목록에 곡이 없습니다.
            <br />+ 버튼으로 곡을 추가해보세요.
          </p>
        ) : (
          <div className="flex flex-col gap-1 mt-2">
            {tracks.map((track, i) => (
              <div key={track.id} ref={(el) => { rowRefs.current[track.id] = el; }}>
                <PlaylistTrackRow
                  track={track}
                  isActive={track.id === currentTrackId}
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
    </div>
  );
}
