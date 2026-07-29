import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useLibraryStore } from "../../store/libraryStore";
import { usePlayerStore } from "../../store/playerStore";
import { searchTracks } from "../../lib/derive";
import { TrackRow } from "../TrackRow";

export function SearchView() {
  const [query, setQuery] = useState("");
  const tracks = useLibraryStore((s) => s.tracks);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const currentTrackId = usePlayerStore((s) => s.currentTrack()?.id);
  const results = useMemo(() => searchTracks(tracks, query), [tracks, query]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pb-2 shrink-0 safe-top">
        <div className="flex items-center gap-2 nm-inset-sm rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-nm-text-muted shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="제목, 아티스트, 앨범 검색"
            className="flex-1 bg-transparent outline-none placeholder:text-nm-text-muted text-[15px]"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="지우기">
              <X className="w-4 h-4 text-nm-text-muted" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain nm-scrollbar-none px-4 pb-4">
        {query.trim() === "" ? (
          <p className="text-center text-sm text-nm-text-muted py-10">
            찾고 싶은 곡, 아티스트, 앨범을 입력하세요.
          </p>
        ) : results.length === 0 ? (
          <p className="text-center text-sm text-nm-text-muted py-10">검색 결과가 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {results.map((track, i) => (
              <TrackRow
                key={track.id}
                track={track}
                showAlbum
                isActive={track.id === currentTrackId}
                onPlay={() => playQueue(results, i, { type: "search" })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
