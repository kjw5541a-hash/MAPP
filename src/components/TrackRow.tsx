import { Play, Heart } from "lucide-react";
import type { Track } from "../types";
import { CoverArt } from "./CoverArt";
import { TrackMenu } from "./TrackMenu";
import { formatDuration } from "../lib/format";
import { useLibraryStore } from "../store/libraryStore";

interface TrackRowProps {
  track: Track;
  onPlay: () => void;
  isActive?: boolean;
  showAlbum?: boolean;
  index?: number;
  playlistIdContext?: string;
  showLike?: boolean;
}

export function TrackRow({
  track,
  onPlay,
  isActive,
  showAlbum,
  index,
  playlistIdContext,
  showLike,
}: TrackRowProps) {
  const toggleLiked = useLibraryStore((s) => s.toggleLiked);
  return (
    <div
      role="button"
      onClick={onPlay}
      className={`flex items-center gap-3 px-3 py-2 rounded-2xl cursor-pointer transition-colors ${
        isActive ? "nm-inset-sm" : "hover:bg-nm-text/5"
      }`}
    >
      {index !== undefined && (
        <span className="w-5 text-center text-sm text-nm-text-muted shrink-0">
          {isActive ? <Play className="w-3.5 h-3.5 mx-auto fill-nm-accent text-nm-accent" /> : index}
        </span>
      )}
      <CoverArt artKey={track.artKey} alt={track.title} className="w-11 h-11" />
      <div className="min-w-0 flex-1">
        <p className={`truncate text-[15px] ${isActive ? "text-nm-accent" : ""}`}>{track.title}</p>
        <p className="truncate text-[13px] text-nm-text-muted">
          {track.artist}
          {showAlbum ? ` · ${track.album}` : ""}
        </p>
      </div>
      {showLike && (
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
      )}
      <span className="text-[13px] text-nm-text-muted shrink-0 tabular-nums">
        {formatDuration(track.duration)}
      </span>
      <TrackMenu track={track} playlistIdContext={playlistIdContext} />
    </div>
  );
}
