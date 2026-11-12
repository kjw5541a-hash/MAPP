import { Play, Heart, Check } from "lucide-react";
import type { Track } from "../../types";
import { CoverArt } from "../CoverArt";
import { SwipeRow } from "../SwipeRow";
import { formatDuration } from "../../lib/format";
import { useLibraryStore } from "../../store/libraryStore";

interface SongRowProps {
  track: Track;
  isActive: boolean;
  selectMode: boolean;
  selected: boolean;
  onPlay: () => void;
  onLongPress: () => void;
  onToggleSelect: () => void;
  onDeleteRequest: () => void;
}

export function SongRow({
  track,
  isActive,
  selectMode,
  selected,
  onPlay,
  onLongPress,
  onToggleSelect,
  onDeleteRequest,
}: SongRowProps) {
  const toggleLiked = useLibraryStore((s) => s.toggleLiked);

  const content = (
    <div
      className={`flex items-center gap-3 px-3 py-2 border-b border-am-separator transition-colors ${
        isActive ? "bg-am-fill" : ""
      }`}
    >
      {selectMode ? (
        <span
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
            selected ? "bg-am-accent border-am-accent" : "border-am-muted"
          }`}
        >
          {selected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
        </span>
      ) : (
        isActive && <Play className="w-3.5 h-3.5 shrink-0 fill-am-accent text-am-accent" />
      )}
      <CoverArt artKey={track.artKey} alt={track.title} className="w-14 h-14 shrink-0" rounded="rounded-lg" />
      <div className="min-w-0 flex-1">
        <p className={`truncate text-[16px] ${isActive ? "text-am-accent font-medium" : "text-am-text"}`}>{track.title}</p>
        <p className="truncate text-[14px] text-am-muted">{track.artist}</p>
      </div>
      {!selectMode && (
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
      )}
      <span className="text-[13px] text-am-muted shrink-0 tabular-nums">
        {formatDuration(track.duration)}
      </span>
    </div>
  );

  return (
    <SwipeRow
      onTap={selectMode ? onToggleSelect : onPlay}
      onLongPress={onLongPress}
      onDeleteRequest={onDeleteRequest}
      swipeEnabled={!selectMode}
      deleteLabel="라이브러리에서 삭제"
    >
      {content}
    </SwipeRow>
  );
}
