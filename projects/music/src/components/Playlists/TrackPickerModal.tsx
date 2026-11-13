import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { useVisualViewportRect } from "../../hooks/useViewport";
import { useLibraryStore } from "../../store/libraryStore";
import { searchTracks } from "../../lib/derive";
import { CoverArt } from "../CoverArt";
import { formatDuration } from "../../lib/format";

interface TrackPickerModalProps {
  playlistId: string;
  existingTrackIds: string[];
  onClose: () => void;
}

/** Full-screen "pick songs to add to this playlist" — the songs tab's own
 *  multi-select is a separate, simpler flow (pick tracks first, playlist
 *  second); this one starts from a specific playlist already open. */
export function TrackPickerModal({ playlistId, existingTrackIds, onClose }: TrackPickerModalProps) {
  const tracks = useLibraryStore((s) => s.tracks);
  const addTracksToPlaylist = useLibraryStore((s) => s.addTracksToPlaylist);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // See NewPlaylistModal: size from the visual viewport so the sheet (and
  // its scrollable list) shrinks to the area above the virtual keyboard.
  const vv = useVisualViewportRect();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(timer);
  }, [query]);

  const existing = useMemo(() => new Set(existingTrackIds), [existingTrackIds]);
  const list = useMemo(
    () => (debouncedQuery.trim() ? searchTracks(tracks, debouncedQuery) : tracks),
    [tracks, debouncedQuery],
  );

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const confirm = async () => {
    if (selected.size > 0) await addTracksToPlaylist(playlistId, [...selected]);
    onClose();
  };

  return (
    <div
      className="fixed z-[60] flex flex-col bg-am-bg"
      style={{ top: vv.top, left: vv.left, width: vv.width, height: vv.height }}
    >
      <div className="flex items-center gap-3 px-4 pb-2 shrink-0 safe-top">
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="w-9 h-9 am-icon-btn flex items-center justify-center text-am-text"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-am-text flex-1">곡 추가</h1>
        <button
          type="button"
          disabled={selected.size === 0}
          onClick={confirm}
          className="px-4 py-2 am-chip text-am-accent font-medium disabled:opacity-40"
        >
          추가{selected.size > 0 ? ` (${selected.size})` : ""}
        </button>
      </div>

      <div className="px-4 pb-2 shrink-0">
        <div className="flex items-center gap-2 am-search px-3 py-2.5">
          <Search className="w-4 h-4 text-am-muted shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="제목, 아티스트, 앨범 검색"
            className="flex-1 bg-transparent outline-none placeholder:text-am-muted text-[15px] text-am-text"
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain no-scrollbar px-4 pb-4 flex flex-col gap-1">
        {list.length === 0 ? (
          <p className="text-center text-sm text-am-muted py-10">곡이 없습니다.</p>
        ) : (
          list.map((track) => {
            const already = existing.has(track.id);
            const checked = already || selected.has(track.id);
            return (
              <button
                key={track.id}
                type="button"
                disabled={already}
                onClick={() => toggle(track.id)}
                className="flex items-center gap-3 px-3 py-2 rounded-2xl text-left disabled:opacity-40 hover:bg-am-fill transition-colors"
              >
                <span
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    checked ? "bg-am-accent border-am-accent" : "border-am-muted"
                  }`}
                >
                  {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                </span>
                <CoverArt artKey={track.artKey} alt={track.title} className="w-11 h-11" rounded="rounded-lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] text-am-text font-medium">{track.title}</p>
                  <p className="truncate text-[13px] text-am-muted">{track.artist}</p>
                </div>
                <span className="text-[13px] text-am-muted shrink-0 tabular-nums">
                  {formatDuration(track.duration)}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
