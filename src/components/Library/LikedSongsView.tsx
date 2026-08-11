import { useMemo } from "react";
import { Heart } from "lucide-react";
import { useLibraryStore } from "../../store/libraryStore";
import { usePlayerStore } from "../../store/playerStore";
import { TrackRow } from "../TrackRow";

export function LikedSongsView() {
  const tracks = useLibraryStore((s) => s.tracks);
  const liked = useMemo(() => tracks.filter((t) => t.liked), [tracks]);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const currentTrackId = usePlayerStore((s) => s.currentTrack()?.id);

  if (liked.length === 0) {
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
      {liked.map((track, i) => (
        <TrackRow
          key={track.id}
          track={track}
          isActive={track.id === currentTrackId}
          showLike
          onPlay={() => playQueue(liked, i, { type: "songs" })}
        />
      ))}
    </div>
  );
}
