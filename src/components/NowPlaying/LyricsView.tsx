import type { Track } from "../../types";

export function LyricsView({ track }: { track: Track }) {
  return (
    <div className="w-full h-full overflow-y-auto overscroll-contain no-scrollbar rounded-3xl px-6 py-6 bg-am-bg">
      {track.lyrics ? (
        <p className="whitespace-pre-wrap leading-relaxed text-[15px] text-am-text">{track.lyrics}</p>
      ) : (
        <p className="text-center text-am-muted text-sm mt-10">이 곡에는 가사가 없습니다.</p>
      )}
    </div>
  );
}
