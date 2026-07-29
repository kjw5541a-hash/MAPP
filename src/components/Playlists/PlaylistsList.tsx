import { useState } from "react";
import { ListMusic, Plus } from "lucide-react";
import { useLibraryStore } from "../../store/libraryStore";
import { useUIStore } from "../../store/uiStore";
import { CoverArt } from "../CoverArt";
import { NewPlaylistModal } from "./NewPlaylistModal";

export function PlaylistsList() {
  const playlists = useLibraryStore((s) => s.playlists);
  const tracks = useLibraryStore((s) => s.tracks);
  const openPlaylist = useUIStore((s) => s.openPlaylist);
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="flex flex-col gap-1 px-4 py-2">
      <button
        type="button"
        onClick={() => setShowNew(true)}
        className="flex items-center gap-3 px-2 py-2.5 rounded-2xl hover:bg-nm-text/5 text-left"
      >
        <div className="w-11 h-11 rounded-xl nm-flat flex items-center justify-center text-nm-accent shrink-0">
          <Plus className="w-5 h-5" />
        </div>
        <p className="text-[15px] text-nm-accent font-medium">새로운 재생목록</p>
      </button>

      {playlists.map((playlist) => {
        const firstTrack = tracks.find((t) => t.id === playlist.trackIds[0]);
        return (
          <button
            key={playlist.id}
            type="button"
            onClick={() => openPlaylist(playlist.id)}
            className="flex items-center gap-3 px-2 py-2.5 rounded-2xl hover:bg-nm-text/5 text-left"
          >
            {firstTrack ? (
              <CoverArt artKey={firstTrack.artKey} alt={playlist.name} className="w-11 h-11" />
            ) : (
              <div className="w-11 h-11 rounded-xl nm-inset-sm flex items-center justify-center text-nm-text-muted shrink-0">
                <ListMusic className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-[15px]">{playlist.name}</p>
              <p className="truncate text-[13px] text-nm-text-muted">{playlist.trackIds.length}곡</p>
            </div>
          </button>
        );
      })}

      {showNew && <NewPlaylistModal onClose={() => setShowNew(false)} />}
    </div>
  );
}
