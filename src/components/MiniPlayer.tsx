import { Play, Pause, SkipForward } from "lucide-react";
import { usePlayerStore } from "../store/playerStore";
import { CoverArt } from "./CoverArt";

export function MiniPlayer() {
  const currentTrack = usePlayerStore((s) => s.currentTrack());
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);
  const setShowNowPlaying = usePlayerStore((s) => s.setShowNowPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);

  if (!currentTrack) return null;

  const pct = duration ? Math.min((progress / duration) * 100, 100) : 0;

  return (
    <div className="px-3 pb-1">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setShowNowPlaying(true)}
        onKeyDown={(e) => e.key === "Enter" && setShowNowPlaying(true)}
        className="w-full flex items-center gap-3 nm-raised rounded-2xl px-3 py-2 relative overflow-hidden text-left cursor-pointer"
      >
        <CoverArt artKey={currentTrack.artKey} alt={currentTrack.title} className="w-10 h-10" rounded="rounded-lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium">{currentTrack.title}</p>
          <p className="truncate text-[12px] text-nm-text-muted">{currentTrack.artist}</p>
        </div>
        <button
          type="button"
          aria-label={isPlaying ? "일시정지" : "재생"}
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className="w-9 h-9 flex items-center justify-center shrink-0"
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>
        <button
          type="button"
          aria-label="다음 곡"
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          className="w-9 h-9 flex items-center justify-center shrink-0"
        >
          <SkipForward className="w-5 h-5 fill-current" />
        </button>
        <div className="absolute left-0 bottom-0 h-0.5 bg-nm-accent transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
