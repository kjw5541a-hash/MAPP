import { useMemo } from "react";
import { useLibraryStore } from "../../store/libraryStore";
import { useUIStore } from "../../store/uiStore";
import { groupByAlbum } from "../../lib/derive";
import { CoverArt } from "../CoverArt";
import { EmptyLibrary } from "./EmptyLibrary";

export function AlbumsGrid() {
  const tracks = useLibraryStore((s) => s.tracks);
  const openAlbum = useUIStore((s) => s.openAlbum);
  const albums = useMemo(() => groupByAlbum(tracks), [tracks]);

  if (tracks.length === 0) return <EmptyLibrary />;

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-5 px-4 py-3">
      {albums.map((group) => (
        <button
          key={group.key}
          type="button"
          onClick={() => openAlbum(group.key)}
          className="flex flex-col gap-2 text-left"
        >
          <CoverArt
            artKey={group.tracks[0].artKey}
            alt={group.album}
            className="w-full aspect-square"
            rounded="rounded-2xl"
          />
          <div className="min-w-0">
            <p className="truncate text-[14px] font-medium">{group.album}</p>
            <p className="truncate text-[12px] text-nm-text-muted">{group.artist}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
