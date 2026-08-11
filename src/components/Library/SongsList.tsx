import { useMemo, useState } from "react";
import { Search, ListPlus, X } from "lucide-react";
import { useLibraryStore } from "../../store/libraryStore";
import { usePlayerStore } from "../../store/playerStore";
import { useSongSelectionStore } from "../../store/songSelectionStore";
import { searchTracks } from "../../lib/derive";
import { SongRow } from "./SongRow";
import { EmptyLibrary } from "./EmptyLibrary";
import { ConfirmDialog } from "../ConfirmDialog";
import { PlaylistPickerModal } from "../Playlists/PlaylistPickerModal";
import type { Track } from "../../types";

export function SongsList() {
  const tracks = useLibraryStore((s) => s.tracks);
  const deleteTrack = useLibraryStore((s) => s.deleteTrack);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const currentTrackId = usePlayerStore((s) => s.currentTrack()?.id);

  const selectMode = useSongSelectionStore((s) => s.active);
  const selected = useSongSelectionStore((s) => s.selected);
  const enterSelect = useSongSelectionStore((s) => s.enter);
  const toggleSelect = useSongSelectionStore((s) => s.toggle);

  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Track | null>(null);
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);

  const filtered = useMemo(
    () => (query.trim() ? searchTracks(tracks, query) : tracks),
    [tracks, query],
  );

  if (tracks.length === 0) return <EmptyLibrary />;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pb-2 shrink-0 flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 nm-inset-sm rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-nm-text-muted shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="제목, 아티스트, 앨범 검색"
            className="flex-1 bg-transparent outline-none placeholder:text-nm-text-muted text-[15px] min-w-0"
          />
          {query && (
            <button
              type="button"
              aria-label="검색어 지우기"
              onClick={() => setQuery("")}
              className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-nm-text-muted"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          aria-label="재생목록에 추가"
          disabled={selected.size === 0}
          onClick={() => setShowPlaylistPicker(true)}
          className="w-10 h-10 rounded-full nm-flat flex items-center justify-center shrink-0 text-nm-accent disabled:text-nm-text-muted disabled:opacity-40"
        >
          <ListPlus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain nm-scrollbar-none px-4 pb-4 flex flex-col gap-1">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-nm-text-muted py-10">검색 결과가 없습니다.</p>
        ) : (
          filtered.map((track, i) => (
            <SongRow
              key={track.id}
              track={track}
              isActive={track.id === currentTrackId}
              selectMode={selectMode}
              selected={selected.has(track.id)}
              onPlay={() => playQueue(filtered, i, { type: "songs" })}
              onLongPress={() => !selectMode && enterSelect(track.id)}
              onToggleSelect={() => toggleSelect(track.id)}
              onDeleteRequest={() => setPendingDelete(track)}
            />
          ))
        )}
      </div>

      {pendingDelete && (
        <ConfirmDialog
          title="라이브러리에서 삭제할까요?"
          description={`"${pendingDelete.title}"이(가) 모든 재생목록에서도 함께 삭제됩니다.`}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            deleteTrack(pendingDelete.id);
            setPendingDelete(null);
          }}
        />
      )}

      {showPlaylistPicker && (
        <PlaylistPickerModal
          trackIds={[...selected]}
          onClose={() => setShowPlaylistPicker(false)}
        />
      )}
    </div>
  );
}
