import { useRef } from "react";
import { ChevronDown, AlignLeft, Disc3, Heart } from "lucide-react";
import { usePlayerStore } from "../../store/playerStore";
import { useLibraryStore } from "../../store/libraryStore";
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
  const toggleLiked = useLibraryStore((s) => s.toggleLiked);
  // playerStore's queue holds a snapshot of the track taken when playback
  // started, so its `liked` field goes stale the moment it's toggled
  // elsewhere; look the live value up from the library instead.
  const liked = useLibraryStore((s) => (currentTrack ? s.tracks.find((t) => t.id === currentTrack.id)?.liked : undefined));

  const touchStartY = useRef<number | null>(null);
  const headerTouchStartY = useRef<number | null>(null);

  if (!showNowPlaying || !currentTrack) return null;

  const onHeaderTouchStart = (e: React.TouchEvent) => {
    headerTouchStartY.current = e.touches[0].clientY;
  };
  const onHeaderTouchEnd = (e: React.TouchEvent) => {
    if (headerTouchStartY.current === null) return;
    const delta = e.changedTouches[0].clientY - headerTouchStartY.current;
    if (delta >= 80) setShowNowPlaying(false);
    headerTouchStartY.current = null;
  };

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
    <div className="fixed inset-0 z-50 flex flex-col bg-am-bg safe-top safe-bottom">
      <div
        className="flex items-center justify-between px-4 pt-3 pb-1 shrink-0"
        onTouchStart={onHeaderTouchStart}
        onTouchEnd={onHeaderTouchEnd}
      >
        <button
          type="button"
          aria-label="닫기"
          onClick={() => setShowNowPlaying(false)}
          className="w-9 h-9 am-icon-btn flex items-center justify-center text-am-text"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
        <p className="text-xs text-am-muted truncate max-w-[50%]">{currentTrack.album}</p>
        <button
          type="button"
          aria-label={showLyrics ? "앨범 커버 보기" : "가사 보기"}
          onClick={() => setShowLyrics(!showLyrics)}
          className={`w-9 h-9 am-icon-btn flex items-center justify-center ${
            showLyrics ? "text-am-accent" : "text-am-text"
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
        {/* Cap cover size by dvh so the column fits short Safari viewports and the progress bar never overlaps the controls */}
        <div className="w-full max-w-[min(24rem,calc(100dvh-469px-env(safe-area-inset-bottom,0px)))] aspect-square shrink-0">
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
          <h2 className="text-xl font-bold text-am-text truncate">{currentTrack.title}</h2>
          <p className="text-am-muted truncate mt-1">{currentTrack.artist}</p>
        </div>

        <div className="w-full max-w-sm">
          <ProgressBar />
        </div>
      </div>

      <div className="w-full max-w-sm mx-auto px-4 pb-6 pt-2 shrink-0">
        <Controls />
        <div className="flex justify-end px-2 mt-3">
          <button
            type="button"
            aria-label={liked ? "좋아요 취소" : "좋아요"}
            onClick={() => toggleLiked(currentTrack.id)}
            className="w-11 h-11 am-icon-btn flex items-center justify-center"
          >
            <Heart className={`w-4.5 h-4.5 ${liked ? "fill-am-accent text-am-accent" : "text-am-muted"}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
