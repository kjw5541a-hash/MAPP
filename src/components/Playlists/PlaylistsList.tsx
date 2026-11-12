import { useState } from "react";
import { ListMusic, Plus } from "lucide-react";
import { useLibraryStore } from "../../store/libraryStore";
import { useUIStore } from "../../store/uiStore";
import { useDragReorder } from "../../hooks/useDragReorder";
import { useRowGesture } from "../../hooks/useRowGesture";
import { CoverArt } from "../CoverArt";
import { NewPlaylistModal } from "./NewPlaylistModal";
import type { Playlist, Track } from "../../types";

function PlaylistRow({
  playlist,
  firstTrack,
  translateY,
  elevated,
  onTap,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  playlist: Playlist;
  firstTrack: Track | undefined;
  translateY: number;
  elevated: boolean;
  onTap: () => void;
  onDragStart: () => void;
  onDragMove: (deltaY: number) => void;
  onDragEnd: () => void;
}) {
  const { ref, dragging } = useRowGesture({
    onTap,
    onDragStart,
    onDragMove,
    onDragEnd,
    swipeEnabled: false,
  });
  const active = dragging || elevated;

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className="touch-row rounded-2xl bg-am-bg"
      style={{
        transform: translateY ? `translateY(${translateY}px)` : undefined,
        transition: dragging ? "none" : "transform 150ms ease",
        zIndex: active ? 10 : undefined,
        position: "relative",
      }}
    >
      <div className="flex items-center gap-3 px-2 py-2.5 rounded-2xl hover:bg-am-fill transition-colors text-left">
        {firstTrack ? (
          <CoverArt artKey={firstTrack.artKey} alt={playlist.name} className="w-11 h-11" rounded="rounded-lg" />
        ) : (
          <div className="w-11 h-11 rounded-xl bg-am-fill flex items-center justify-center text-am-muted shrink-0">
            <ListMusic className="w-5 h-5" />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-[15px] text-am-text font-medium">{playlist.name}</p>
          <p className="truncate text-[13px] text-am-muted">{playlist.trackIds.length}곡</p>
        </div>
      </div>
    </div>
  );
}

export function PlaylistsList() {
  const playlists = useLibraryStore((s) => s.playlists);
  const tracks = useLibraryStore((s) => s.tracks);
  const reorderPlaylists = useLibraryStore((s) => s.reorderPlaylists);
  const openPlaylist = useUIStore((s) => s.openPlaylist);
  const [showNew, setShowNew] = useState(false);

  const { orderedIds, draggingId, dragOffsetY, rowRefs, startDrag, moveDrag, endDrag } =
    useDragReorder(
      playlists.map((p) => p.id),
      reorderPlaylists,
    );
  const orderedPlaylists = orderedIds
    .map((id) => playlists.find((p) => p.id === id))
    .filter((p): p is Playlist => Boolean(p));

  return (
    <div className="flex flex-col gap-1 px-4 py-2">
      <button
        type="button"
        onClick={() => setShowNew(true)}
        className="flex items-center gap-3 px-2 py-2.5 rounded-2xl hover:bg-am-fill transition-colors text-left"
      >
        <div className="w-11 h-11 rounded-xl bg-am-fill flex items-center justify-center text-am-accent shrink-0">
          <Plus className="w-5 h-5" />
        </div>
        <p className="text-[15px] text-am-accent font-medium">새로운 재생목록</p>
      </button>

      {orderedPlaylists.map((playlist, i) => (
        <div key={playlist.id} ref={(el) => { rowRefs.current[playlist.id] = el; }}>
          <PlaylistRow
            playlist={playlist}
            firstTrack={tracks.find((t) => t.id === playlist.trackIds[0])}
            translateY={draggingId === playlist.id ? dragOffsetY : 0}
            elevated={draggingId === playlist.id}
            onTap={() => openPlaylist(playlist.id)}
            onDragStart={() => startDrag(playlist.id, i)}
            onDragMove={(deltaY) => moveDrag(playlist.id, deltaY)}
            onDragEnd={endDrag}
          />
        </div>
      ))}

      {showNew && <NewPlaylistModal onClose={() => setShowNew(false)} />}
    </div>
  );
}
