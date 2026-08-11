import { Play, Heart, GripVertical } from "lucide-react";
import type { Track } from "../../types";
import { CoverArt } from "../CoverArt";
import { SwipeRow } from "../SwipeRow";
import { formatDuration } from "../../lib/format";
import { useLibraryStore } from "../../store/libraryStore";

interface PlaylistTrackRowProps {
  track: Track;
  isActive: boolean;
  translateY: number;
  elevated: boolean;
  onTap: () => void;
  onDeleteRequest: () => void;
  onDragStart: () => void;
  onDragMove: (deltaY: number) => void;
  onDragEnd: () => void;
}

export function PlaylistTrackRow({
  track,
  isActive,
  translateY,
  elevated,
  onTap,
  onDeleteRequest,
  onDragStart,
  onDragMove,
  onDragEnd,
}: PlaylistTrackRowProps) {
  const toggleLiked = useLibraryStore((s) => s.toggleLiked);

  return (
    <SwipeRow
      onTap={onTap}
      onDeleteRequest={onDeleteRequest}
      deleteLabel="재생목록에서 삭제"
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      translateY={translateY}
      elevated={elevated}
    >
      <div
        className={`flex items-center gap-2 px-3 py-2 transition-colors ${
          isActive ? "nm-inset-sm rounded-2xl" : ""
        }`}
      >
        {isActive && <Play className="w-3.5 h-3.5 shrink-0 fill-nm-accent text-nm-accent" />}
        <CoverArt artKey={track.artKey} alt={track.title} className="w-11 h-11" />
        <div className="min-w-0 flex-1">
          <p className={`truncate text-[15px] ${isActive ? "text-nm-accent" : ""}`}>{track.title}</p>
          <p className="truncate text-[13px] text-nm-text-muted">{track.artist}</p>
        </div>
        <span className="text-[13px] text-nm-text-muted shrink-0 tabular-nums">
          {formatDuration(track.duration)}
        </span>
        <button
          type="button"
          aria-label={track.liked ? "좋아요 취소" : "좋아요"}
          onClick={(e) => {
            e.stopPropagation();
            toggleLiked(track.id);
          }}
          className="shrink-0 p-1 -m-1"
        >
          <Heart
            className={`w-4 h-4 ${track.liked ? "fill-nm-accent text-nm-accent" : "text-nm-text-muted"}`}
          />
        </button>
        <span className="text-nm-text-muted shrink-0 touch-none" aria-hidden>
          <GripVertical className="w-4 h-4" />
        </span>
      </div>
    </SwipeRow>
  );
}
