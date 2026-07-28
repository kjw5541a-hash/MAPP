import type { Track } from "../../types";

export function LyricsView({ track }: { track: Track }) {
  return (
    <div className="w-full h-full overflow-y-auto nm-scrollbar-none nm-inset-sm rounded-3xl px-6 py-6">
      {track.lyrics ? (
        <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{track.lyrics}</p>
      ) : (
        <p className="text-center text-nm-text-muted text-sm mt-10">이 곡에는 가사가 없습니다.</p>
      )}
    </div>
  );
}
