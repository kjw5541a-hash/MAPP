import { Play, Heart, GripVertical } from "lucide-react";
import type { Track } from "../types";
import { CoverArt } from "./CoverArt";
import { SwipeRow } from "./SwipeRow";
import { formatDuration } from "../lib/format";
import { useLibraryStore } from "../store/libraryStore";

interface ReorderableTrackRowProps {
  track: Track;
  isActive: boolean;
  deleteLabel: string;
  translateY: number;
  elevated: boolean;
  onTap: () => void;
  onDeleteRequest: () => void;
  onDragStart: () => void;
  onDragMove: (deltaY: number) => void;
  onDragEnd: () => void;
}

/** A track row that supports swipe-to-remove and long-press-drag reorder —
 *  shared by the playlist detail list and the liked-songs list. */
export function ReorderableTrackRow({
  track,
  isActive,
  deleteLabel,
  translateY,
  elevated,
  onTap,
  onDeleteRequest,
  onDragStart,
  onDragMove,
  onDragEnd,
}: ReorderableTrackRowProps) {
  const toggleLiked = useLibraryStore((s) => s.toggleLiked);

  return (
    <SwipeRow
      onTap={onTap}
      onDeleteRequest={onDeleteRequest}
      deleteLabel={deleteLabel}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      translateY={translateY}
      elevated={elevated}
    >
      <div
        className={`flex items-center gap-3 px-3 py-2 border-b border-am-separator transition-colors ${
          isActive ? "bg-am-fill" : ""
        }`}
      >
        {isActive && <Play className="w-3.5 h-3.5 shrink-0 fill-am-accent text-am-accent" />}
        <CoverArt artKey={track.artKey} alt={track.title} className="w-14 h-14 shrink-0" rounded="rounded-lg" />
        <div className="min-w-0 flex-1">
          <p className={`truncate text-[16px] ${isActive ? "text-am-accent font-medium" : "text-am-text"}`}>{track.title}</p>
          <p className="truncate text-[14px] text-am-muted">{track.artist}</p>
        </div>
        <button
          type="button"
          aria-label={track.liked ? "좋아요 취소" : "좋아요"}
          data-swipe-ignore
          onClick={(e) => {
            e.stopPropagation();
            toggleLiked(track.id);
          }}
          className="shrink-0 p-1 -m-1"
        >
          <Heart
            className={`w-4 h-4 ${track.liked ? "fill-am-accent text-am-accent" : "text-am-muted"}`}
          />
        </button>
        <span className="text-[13px] text-am-muted shrink-0 tabular-nums">
          {formatDuration(track.duration)}
        </span>
        <span className="text-am-muted shrink-0 touch-none" aria-hidden>
          <GripVertical className="w-4 h-4" />
        </span>
      </div>
    </SwipeRow>
  );
}
