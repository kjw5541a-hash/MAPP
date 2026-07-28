import { useMemo } from "react";
import { useLibraryStore } from "../../store/libraryStore";
import { useUIStore } from "../../store/uiStore";
import { groupByAlbum } from "../../lib/derive";
import { DetailScreen } from "../DetailScreen";

export function AlbumDetail({ albumKey }: { albumKey: string }) {
  const tracks = useLibraryStore((s) => s.tracks);
  const closeDetail = useUIStore((s) => s.closeDetail);
  const albums = useMemo(() => groupByAlbum(tracks), [tracks]);
  const album = albums.find((a) => a.key === albumKey);

  if (!album) return null;

  return (
    <DetailScreen
      title={album.album}
      subtitle={album.artist}
      coverArtKey={album.tracks[0].artKey}
      tracks={album.tracks}
      onBack={closeDetail}
      source={{ type: "album", album: album.album }}
    />
  );
}
