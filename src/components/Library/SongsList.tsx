import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Search, ListPlus, ArrowUpDown, X } from "lucide-react";
import { useLibraryStore } from "../../store/libraryStore";
import { usePlayerStore } from "../../store/playerStore";
import { useSongSelectionStore } from "../../store/songSelectionStore";
import { searchTracks, sortTracks, type SongSort } from "../../lib/derive";
import { SongRow } from "./SongRow";
import { EmptyLibrary } from "./EmptyLibrary";
import { ConfirmDialog } from "../ConfirmDialog";
import { PlaylistPickerModal } from "../Playlists/PlaylistPickerModal";
import { NewPlaylistModal } from "../Playlists/NewPlaylistModal";
import type { Track } from "../../types";

const ROW_GAP = 4; // px — matches the previous list's gap-1
const ROW_ESTIMATE = 64; // fallback row step (content + gap) before the first row is measured
const OVERSCAN = 8; // extra rows kept mounted above/below the viewport

const SORT_CYCLE: SongSort[] = ["title", "artist", "album"];
const SORT_LABEL: Record<SongSort, string> = {
  title: "제목순",
  artist: "가수순",
  album: "앨범순",
};
const STORAGE_KEY = "mapp-songs-sort";

function isSongSort(value: string | null): value is SongSort {
  return SORT_CYCLE.some((s) => s === value);
}

function initialSort(): SongSort {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (isSongSort(saved)) return saved;
  return "title";
}

export function SongsList() {
  const tracks = useLibraryStore((s) => s.tracks);
  const deleteTrack = useLibraryStore((s) => s.deleteTrack);
  const addTracksToPlaylist = useLibraryStore((s) => s.addTracksToPlaylist);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const currentTrackId = usePlayerStore((s) => s.currentTrack()?.id);

  const selectMode = useSongSelectionStore((s) => s.active);
  const selected = useSongSelectionStore((s) => s.selected);
  const enterSelect = useSongSelectionStore((s) => s.enter);
  const enterSelectEmpty = useSongSelectionStore((s) => s.enterEmpty);
  const toggleSelect = useSongSelectionStore((s) => s.toggle);
  const clearSelection = useSongSelectionStore((s) => s.clear);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sort, setSort] = useState<SongSort>(initialSort);
  const [pendingDelete, setPendingDelete] = useState<Track | null>(null);
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const [showNewPlaylist, setShowNewPlaylist] = useState(false);
  const [newPlaylistTarget, setNewPlaylistTarget] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(timer);
  }, [query]);

  const filtered = useMemo(
    () => sortTracks(debouncedQuery.trim() ? searchTracks(tracks, debouncedQuery) : tracks, sort),
    [tracks, debouncedQuery, sort],
  );

  // Cancelling selection (e.g. the shared header's "취소" button) clears the
  // store's active flag directly, so this local target needs to follow it.
  useEffect(() => {
    if (!selectMode) setNewPlaylistTarget(null);
  }, [selectMode]);

  // Only the rows near the viewport are mounted, so a large library doesn't
  // keep hundreds of swipe-gesture touch listeners live at once — that was
  // what made scrolling this specific list feel janky.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [rowStep, setRowStep] = useState(ROW_ESTIMATE);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(0);
  const rafId = useRef<number | null>(null);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    setViewportH(el.clientHeight);
    const ro = new ResizeObserver(() => setViewportH(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const measureRow = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const h = Math.round(el.getBoundingClientRect().height) + ROW_GAP;
    setRowStep((prev) => (prev === h ? prev : h));
  }, []);

  const handleScroll = useCallback(() => {
    if (rafId.current !== null) return;
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;
      if (scrollRef.current) setScrollTop(scrollRef.current.scrollTop);
    });
  }, []);

  const total = filtered.length;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowStep) - OVERSCAN);
  const endIndex = Math.min(total, Math.ceil((scrollTop + viewportH) / rowStep) + OVERSCAN);
  const visible = filtered.slice(startIndex, endIndex);

  if (tracks.length === 0) return <EmptyLibrary />;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pb-2 shrink-0 flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 am-search px-3 py-2.5">
          <Search className="w-4 h-4 text-am-muted shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="제목, 아티스트, 앨범 검색"
            className="flex-1 bg-transparent outline-none placeholder:text-am-muted text-[15px] min-w-0 text-am-text"
          />
          {query && (
            <button
              type="button"
              aria-label="검색어 지우기"
              onClick={() => setQuery("")}
              className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-am-muted"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          aria-label={`정렬: ${SORT_LABEL[sort]}`}
          onClick={() => {
            const next = SORT_CYCLE[(SORT_CYCLE.indexOf(sort) + 1) % SORT_CYCLE.length];
            setSort(next);
            localStorage.setItem(STORAGE_KEY, next);
          }}
          className="h-10 px-3 am-chip flex items-center gap-1 shrink-0 text-am-accent text-xs whitespace-nowrap"
        >
          <ArrowUpDown className="w-4 h-4" />
          {SORT_LABEL[sort]}
        </button>
        <button
          type="button"
          aria-label={newPlaylistTarget ? "선택한 곡 추가 완료" : "재생목록에 추가"}
          disabled={selectMode && selected.size === 0}
          onClick={() => {
            if (newPlaylistTarget) {
              addTracksToPlaylist(newPlaylistTarget, [...selected]);
              clearSelection();
            } else if (selectMode) {
              setShowPlaylistPicker(true);
            } else {
              setShowNewPlaylist(true);
            }
          }}
          className="w-10 h-10 am-icon-btn flex items-center justify-center shrink-0 text-am-accent disabled:text-am-muted disabled:opacity-40"
        >
          <ListPlus className="w-5 h-5" />
        </button>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain no-scrollbar px-4 pb-4"
      >
        {total === 0 ? (
          <p className="text-center text-sm text-am-muted py-10">검색 결과가 없습니다.</p>
        ) : (
          <div style={{ position: "relative", height: total * rowStep - ROW_GAP }}>
            {visible.map((track, i) => {
              const index = startIndex + i;
              return (
                <div
                  key={track.id}
                  ref={index === startIndex ? measureRow : undefined}
                  style={{ position: "absolute", top: index * rowStep, left: 0, right: 0 }}
                >
                  <SongRow
                    track={track}
                    isActive={track.id === currentTrackId}
                    selectMode={selectMode}
                    selected={selected.has(track.id)}
                    onPlay={() => playQueue(filtered, index, { type: "songs" })}
                    onLongPress={() => !selectMode && enterSelect(track.id)}
                    onToggleSelect={() => toggleSelect(track.id)}
                    onDeleteRequest={() => setPendingDelete(track)}
                  />
                </div>
              );
            })}
          </div>
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

      {showNewPlaylist && (
        <NewPlaylistModal
          onClose={() => setShowNewPlaylist(false)}
          onCreated={(playlistId) => {
            setShowNewPlaylist(false);
            setNewPlaylistTarget(playlistId);
            enterSelectEmpty();
          }}
        />
      )}
    </div>
  );
}
