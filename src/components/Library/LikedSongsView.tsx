import { useMemo } from "react";
import { Heart } from "lucide-react";
import { useLibraryStore } from "../../store/libraryStore";
import { usePlayerStore } from "../../store/playerStore";
import { useDragReorder } from "../../hooks/useDragReorder";
import { ReorderableTrackRow } from "../ReorderableTrackRow";
import type { Track } from "../../types";

export function LikedSongsView() {
  const allTracks = useLibraryStore((s) => s.tracks);
  const toggleLiked = useLibraryStore((s) => s.toggleLiked);
  const reorderLiked = useLibraryStore((s) => s.reorderLiked);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const currentTrackId = usePlayerStore((s) => s.currentTrack()?.id);

  const likedIds = useMemo(
    () =>
      allTracks
        .filter((t) => t.liked)
        .sort((a, b) => (a.likeOrder ?? a.dateAdded) - (b.likeOrder ?? b.dateAdded))
        .map((t) => t.id),
    [allTracks],
  );

  const { orderedIds, draggingId, dragOffsetY, rowRefs, startDrag, moveDrag, endDrag } =
    useDragReorder(likedIds, reorderLiked);

  const tracks = orderedIds
    .map((id) => allTracks.find((t) => t.id === id))
    .filter((t): t is Track => Boolean(t));

  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 h-full px-8 text-center">
        <div className="w-16 h-16 rounded-3xl nm-raised flex items-center justify-center text-nm-text-muted">
          <Heart className="w-7 h-7" />
        </div>
        <p className="text-nm-text-muted text-sm">
          곡의 하트 아이콘을 눌러 좋아요를 표시하면
          <br />
          여기에 모입니다.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-2 flex flex-col gap-1">
      {tracks.map((track, i) => (
        <div key={track.id} ref={(el) => { rowRefs.current[track.id] = el; }}>
          <ReorderableTrackRow
            track={track}
            isActive={track.id === currentTrackId}
            deleteLabel="좋아요 취소"
            translateY={draggingId === track.id ? dragOffsetY : 0}
            elevated={draggingId === track.id}
            onTap={() => playQueue(tracks, i, { type: "songs" })}
            onDeleteRequest={() => toggleLiked(track.id)}
            onDragStart={() => startDrag(track.id, i)}
            onDragMove={(deltaY) => moveDrag(track.id, deltaY)}
            onDragEnd={endDrag}
          />
        </div>
      ))}
    </div>
  );
}
