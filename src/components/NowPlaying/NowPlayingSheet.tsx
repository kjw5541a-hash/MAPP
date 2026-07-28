import { useRef } from "react";
import { ChevronDown, AlignLeft, Disc3 } from "lucide-react";
import { usePlayerStore } from "../../store/playerStore";
import { CoverArt } from "../CoverArt";
import { ProgressBar } from "./ProgressBar";
import { Controls } from "./Controls";
import { LyricsView } from "./LyricsView";

export function NowPlayingSheet() {
  const currentTrack = usePlayerStore((s) => s.currentTrack());
  const showNowPlaying = usePlayerStore((s) => s.showNowPlaying);
  const showLyrics = usePlayerStore((s) => s.showLyrics);
  const setShowNowPlaying = usePlayerStore((s) => s.setShowNowPlaying);
  const setShowLyrics = usePlayerStore((s) => s.setShowLyrics);

  const touchStartY = useRef<number | null>(null);

  if (!showNowPlaying || !currentTrack) return null;

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const delta = e.changedTouches[0].clientY - touchStartY.current;
    if (delta < -60) setShowLyrics(true);
    if (delta > 60) setShowLyrics(false);
    touchStartY.current = null;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-nm-bg safe-top safe-bottom">
      <div className="flex items-center justify-between px-4 pt-3 pb-1 shrink-0">
        <button
          type="button"
          aria-label="닫기"
          onClick={() => setShowNowPlaying(false)}
          className="w-9 h-9 rounded-full nm-flat flex items-center justify-center"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
        <p className="text-xs text-nm-text-muted truncate max-w-[50%]">{currentTrack.album}</p>
        <button
          type="button"
          aria-label={showLyrics ? "앨범 커버 보기" : "가사 보기"}
          onClick={() => setShowLyrics(!showLyrics)}
          className={`w-9 h-9 rounded-full nm-flat flex items-center justify-center ${
            showLyrics ? "text-nm-accent" : ""
          }`}
        >
          {showLyrics ? <Disc3 className="w-5 h-5" /> : <AlignLeft className="w-5 h-5" />}
        </button>
      </div>

      <div
        className="flex-1 min-h-0 flex flex-col items-center px-8 pt-4 pb-2 gap-6"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="w-full max-w-sm aspect-square shrink-0">
          {showLyrics ? (
            <LyricsView track={currentTrack} />
          ) : (
            <CoverArt
              artKey={currentTrack.artKey}
              alt={currentTrack.title}
              className="w-full h-full"
              rounded="rounded-3xl"
            />
          )}
        </div>

        <div className="w-full max-w-sm text-center">
          <h2 className="text-xl font-semibold truncate">{currentTrack.title}</h2>
          <p className="text-nm-text-muted truncate mt-1">{currentTrack.artist}</p>
        </div>

        <div className="w-full max-w-sm">
          <ProgressBar />
        </div>
      </div>

      <div className="w-full max-w-sm mx-auto px-4 pb-6 pt-2 shrink-0">
        <Controls />
      </div>
    </div>
  );
}
