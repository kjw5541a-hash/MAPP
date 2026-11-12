import { useMemo } from "react";
import { User } from "lucide-react";
import { useLibraryStore } from "../../store/libraryStore";
import { useUIStore } from "../../store/uiStore";
import { groupByArtist } from "../../lib/derive";
import { EmptyLibrary } from "./EmptyLibrary";

export function ArtistsList() {
  const tracks = useLibraryStore((s) => s.tracks);
  const openArtist = useUIStore((s) => s.openArtist);
  const artists = useMemo(() => groupByArtist(tracks), [tracks]);

  if (tracks.length === 0) return <EmptyLibrary />;

  return (
    <div className="flex flex-col px-4">
      {artists.map((group) => (
        <button
          key={group.key}
          type="button"
          onClick={() => openArtist(group.key)}
          className="flex items-center gap-3 py-2.5 border-b border-am-separator hover:bg-am-fill/50 text-left transition-colors"
        >
          <div className="w-11 h-11 rounded-full bg-am-fill flex items-center justify-center text-am-muted shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] text-am-text">{group.artist}</p>
            <p className="truncate text-[13px] text-am-muted">
              앨범 {group.albumCount}개 · 곡 {group.tracks.length}개
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
