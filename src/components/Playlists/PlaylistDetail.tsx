import { Play, Shuffle, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { useLibraryStore } from "../../store/libraryStore";
import { useUIStore } from "../../store/uiStore";
import { usePlayerStore } from "../../store/playerStore";
import { BackHeader } from "../BackHeader";
import { CoverArt } from "../CoverArt";
import { TrackMenu } from "../TrackMenu";
import { formatDuration } from "../../lib/format";

export function PlaylistDetail({ playlistId }: { playlistId: string }) {
  const playlist = useLibraryStore((s) => s.playlists.find((p) => p.id === playlistId));
  const allTracks = useLibraryStore((s) => s.tracks);
  const deletePlaylist = useLibraryStore((s) => s.deletePlaylist);
  const reorderPlaylist = useLibraryStore((s) => s.reorderPlaylist);
  const closeDetail = useUIStore((s) => s.closeDetail);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const currentTrackId = usePlayerStore((s) => s.currentTrack()?.id);
  const shuffle = usePlayerStore((s) => s.shuffle);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);

  if (!playlist) return null;

  const tracks = playlist.trackIds
    .map((id) => allTracks.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= tracks.length) return;
    const ids = tracks.map((t) => t.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorderPlaylist(playlistId, ids);
  };

  const removeAndDelete = () => {
    deletePlaylist(playlistId);
    closeDetail();
  };

  return (
    <div className="flex flex-col h-full">
      <BackHeader title={playlist.name} onBack={closeDetail} />
      <div className="flex-1 overflow-y-auto nm-scrollbar-none px-4 pb-4">
        <div className="flex flex-col items-center text-center py-4 gap-3">
          <CoverArt
            artKey={tracks[0]?.artKey}
            alt={playlist.name}
            className="w-44 h-44"
            rounded="rounded-2xl"
          />
          <div>
            <h2 className="text-xl font-semibold">{playlist.name}</h2>
            <p className="text-xs text-nm-text-muted mt-1">{tracks.length}곡</p>
          </div>
          <div className="flex gap-3 mt-2">
            <button
              type="button"
              disabled={tracks.length === 0}
              onClick={() => playQueue(tracks, 0, { type: "playlist", playlistId })}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full nm-raised text-nm-accent font-medium disabled:opacity-40"
            >
              <Play className="w-4 h-4 fill-current" /> 재생
            </button>
            <button
              type="button"
              disabled={tracks.length === 0}
              onClick={() => {
                if (!shuffle) toggleShuffle();
                playQueue(tracks, 0, { type: "playlist", playlistId });
              }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full nm-raised text-nm-accent font-medium disabled:opacity-40"
            >
              <Shuffle className="w-4 h-4" /> 셔플
            </button>
            <button
              type="button"
              onClick={removeAndDelete}
              aria-label="재생목록 삭제"
              className="flex items-center justify-center w-11 h-11 rounded-full nm-raised text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {tracks.length === 0 ? (
          <p className="text-center text-sm text-nm-text-muted py-10">
            아직 이 재생목록에 곡이 없습니다.
            <br />곡의 ⋯ 메뉴에서 추가해보세요.
          </p>
        ) : (
          <div className="flex flex-col gap-1 mt-2">
            {tracks.map((track, i) => (
              <div
                key={track.id}
                role="button"
                onClick={() => playQueue(tracks, i, { type: "playlist", playlistId })}
                className={`flex items-center gap-2 px-3 py-2 rounded-2xl cursor-pointer transition-colors ${
                  track.id === currentTrackId ? "nm-inset-sm" : "hover:bg-nm-text/5"
                }`}
              >
                <CoverArt artKey={track.artKey} alt={track.title} className="w-11 h-11" />
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-[15px] ${track.id === currentTrackId ? "text-nm-accent" : ""}`}>
                    {track.title}
                  </p>
                  <p className="truncate text-[13px] text-nm-text-muted">{track.artist}</p>
                </div>
                <span className="text-[13px] text-nm-text-muted shrink-0 tabular-nums">
                  {formatDuration(track.duration)}
                </span>
                <div className="flex flex-col shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    aria-label="위로 이동"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                    className="w-6 h-5 flex items-center justify-center text-nm-text-muted disabled:opacity-25"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="아래로 이동"
                    disabled={i === tracks.length - 1}
                    onClick={() => move(i, 1)}
                    className="w-6 h-5 flex items-center justify-center text-nm-text-muted disabled:opacity-25"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                <TrackMenu track={track} playlistIdContext={playlistId} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
