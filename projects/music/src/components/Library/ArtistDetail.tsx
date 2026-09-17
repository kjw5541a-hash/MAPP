import { useMemo } from "react";
import { useLibraryStore } from "../../store/libraryStore";
import { useUIStore } from "../../store/uiStore";
import { groupByArtist } from "../../lib/derive";
import { DetailScreen } from "../DetailScreen";

export function ArtistDetail({ artistKey }: { artistKey: string }) {
  const tracks = useLibraryStore((s) => s.tracks);
  const closeDetail = useUIStore((s) => s.closeDetail);
  const artists = useMemo(() => groupByArtist(tracks), [tracks]);
  const artist = artists.find((a) => a.key === artistKey);

  if (!artist) return null;

  return (
    <DetailScreen
      title={artist.artist}
      subtitle={`앨범 ${artist.albumCount}개`}
      coverArtKey={artist.tracks[0].artKey}
      tracks={artist.tracks}
      onBack={closeDetail}
      source={{ type: "artist", artist: artist.artist }}
    />
  );
}
