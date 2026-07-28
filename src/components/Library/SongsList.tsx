import { useLibraryStore } from "../../store/libraryStore";
import { usePlayerStore } from "../../store/playerStore";
import { TrackRow } from "../TrackRow";
import { EmptyLibrary } from "./EmptyLibrary";

export function SongsList() {
  const tracks = useLibraryStore((s) => s.tracks);
  const playQueue = usePlayerStore((s) => s.playQueue);
  const currentTrackId = usePlayerStore((s) => s.currentTrack()?.id);

  if (tracks.length === 0) return <EmptyLibrary />;

  return (
    <div className="px-4 py-2 flex flex-col gap-1">
      {tracks.map((track, i) => (
        <TrackRow
          key={track.id}
          track={track}
          isActive={track.id === currentTrackId}
          onPlay={() => playQueue(tracks, i, { type: "songs" })}
        />
      ))}
    </div>
  );
}
