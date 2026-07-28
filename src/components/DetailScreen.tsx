import { Play, Shuffle } from "lucide-react";
import type { Track } from "../types";
import { CoverArt } from "./CoverArt";
import { TrackRow } from "./TrackRow";
import { BackHeader } from "./BackHeader";
import { usePlayerStore } from "../store/playerStore";
import type { QueueSource } from "../types";

interface DetailScreenProps {
  title: string;
  subtitle?: string;
  coverArtKey?: string;
  tracks: Track[];
  onBack: () => void;
  source: QueueSource;
  playlistIdContext?: string;
  headerExtra?: React.ReactNode;
}

export function DetailScreen({
  title,
  subtitle,
  coverArtKey,
  tracks,
  onBack,
  source,
  playlistIdContext,
  headerExtra,
}: DetailScreenProps) {
  const playQueue = usePlayerStore((s) => s.playQueue);
  const currentTrackId = usePlayerStore((s) => s.currentTrack()?.id);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);

  const playAll = (startIndex = 0) => {
    playQueue(tracks, startIndex, source);
  };

  const playShuffled = () => {
    if (!shuffle) toggleShuffle();
    playQueue(tracks, 0, source);
  };

  return (
    <div className="flex flex-col h-full">
      <BackHeader title={title} onBack={onBack} />
      <div className="flex-1 overflow-y-auto nm-scrollbar-none px-4 pb-4">
        <div className="flex flex-col items-center text-center py-4 gap-3">
          <CoverArt artKey={coverArtKey} alt={title} className="w-44 h-44" rounded="rounded-2xl" />
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            {subtitle && <p className="text-sm text-nm-text-muted mt-1">{subtitle}</p>}
            <p className="text-xs text-nm-text-muted mt-1">{tracks.length}곡</p>
          </div>
          {headerExtra}
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={() => playAll(0)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full nm-raised text-nm-accent font-medium"
            >
              <Play className="w-4 h-4 fill-current" /> 재생
            </button>
            <button
              type="button"
              onClick={playShuffled}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full nm-raised text-nm-accent font-medium"
            >
              <Shuffle className="w-4 h-4" /> 셔플
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1 mt-2">
          {tracks.map((track, i) => (
            <TrackRow
              key={track.id}
              track={track}
              index={i + 1}
              isActive={track.id === currentTrackId}
              onPlay={() => playAll(i)}
              playlistIdContext={playlistIdContext}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
