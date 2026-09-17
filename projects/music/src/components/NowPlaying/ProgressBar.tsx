import { useState } from "react";
import { usePlayerStore } from "../../store/playerStore";
import { formatDuration } from "../../lib/format";

export function ProgressBar() {
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);
  const seek = usePlayerStore((s) => s.seek);
  const [dragValue, setDragValue] = useState<number | null>(null);

  const max = duration || 0;
  const value = dragValue ?? Math.min(progress, max);

  const commit = () => {
    if (dragValue !== null) {
      seek(dragValue);
      setDragValue(null);
    }
  };

  return (
    <div className="w-full">
      <input
        type="range"
        min={0}
        max={max}
        step={0.1}
        value={value}
        onChange={(e) => setDragValue(Number(e.target.value))}
        onMouseUp={commit}
        onTouchEnd={commit}
        disabled={max === 0}
        className="nm-progress w-full"
        style={{ ["--progress-pct" as string]: `${max ? (value / max) * 100 : 0}%` }}
      />
      <div className="flex justify-between text-[12px] text-nm-text-muted tabular-nums mt-1">
        <span>{formatDuration(value)}</span>
        <span>-{formatDuration(Math.max(max - value, 0))}</span>
      </div>
    </div>
  );
}
