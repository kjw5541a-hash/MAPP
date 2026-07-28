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
    <div className="flex flex-col gap-1 px-4 py-2">
      {artists.map((group) => (
        <button
          key={group.key}
          type="button"
          onClick={() => openArtist(group.key)}
          className="flex items-center gap-3 px-2 py-2.5 rounded-2xl hover:bg-nm-text/5 text-left"
        >
          <div className="w-11 h-11 rounded-full nm-inset-sm flex items-center justify-center text-nm-text-muted shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[15px]">{group.artist}</p>
            <p className="truncate text-[13px] text-nm-text-muted">
              앨범 {group.albumCount}개 · 곡 {group.tracks.length}개
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
