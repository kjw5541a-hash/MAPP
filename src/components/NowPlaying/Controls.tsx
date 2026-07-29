import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1 } from "lucide-react";
import { usePlayerStore } from "../../store/playerStore";

export function Controls() {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const repeat = usePlayerStore((s) => s.repeat);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);

  return (
    <div className="flex items-center justify-between w-full px-2">
      <button
        type="button"
        aria-label="셔플"
        aria-pressed={shuffle}
        onClick={toggleShuffle}
        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
          shuffle ? "nm-pressed text-nm-accent" : "text-nm-text-muted"
        }`}
      >
        <Shuffle className="w-4.5 h-4.5" />
      </button>

      <button
        type="button"
        aria-label="이전 곡"
        onClick={prev}
        className="w-12 h-12 flex items-center justify-center"
      >
        <SkipBack className="w-7 h-7 fill-current" />
      </button>

      <button
        type="button"
        aria-label={isPlaying ? "일시정지" : "재생"}
        onClick={togglePlay}
        className="w-16 h-16 rounded-full nm-raised flex items-center justify-center text-nm-accent"
      >
        {isPlaying ? (
          <Pause className="w-7 h-7 fill-current" />
        ) : (
          <Play className="w-7 h-7 fill-current ml-0.5" />
        )}
      </button>

      <button
        type="button"
        aria-label="다음 곡"
        onClick={next}
        className="w-12 h-12 flex items-center justify-center"
      >
        <SkipForward className="w-7 h-7 fill-current" />
      </button>

      <button
        type="button"
        aria-label="반복"
        aria-pressed={repeat !== "off"}
        onClick={cycleRepeat}
        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
          repeat !== "off" ? "nm-pressed text-nm-accent" : "text-nm-text-muted"
        }`}
      >
        {repeat === "one" ? <Repeat1 className="w-4.5 h-4.5" /> : <Repeat className="w-4.5 h-4.5" />}
      </button>
    </div>
  );
}
