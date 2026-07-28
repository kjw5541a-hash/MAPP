import { useEffect } from "react";
import { useLibraryStore } from "./store/libraryStore";
import { useUIStore } from "./store/uiStore";
import { useAudioElement } from "./hooks/useAudioElement";
import { TabBar } from "./components/TabBar";
import { MiniPlayer } from "./components/MiniPlayer";
import { ImportButton } from "./components/ImportButton";
import { NowPlayingSheet } from "./components/NowPlaying/NowPlayingSheet";
import { SongsList } from "./components/Library/SongsList";
import { AlbumsGrid } from "./components/Library/AlbumsGrid";
import { AlbumDetail } from "./components/Library/AlbumDetail";
import { ArtistsList } from "./components/Library/ArtistsList";
import { ArtistDetail } from "./components/Library/ArtistDetail";
import { PlaylistsList } from "./components/Playlists/PlaylistsList";
import { PlaylistDetail } from "./components/Playlists/PlaylistDetail";
import { SearchView } from "./components/Search/SearchView";

const TAB_TITLES: Record<string, string> = {
  playlists: "재생목록",
  artists: "아티스트",
  albums: "앨범",
  songs: "곡",
};

function App() {
  const init = useLibraryStore((s) => s.init);
  const ready = useLibraryStore((s) => s.ready);
  const tab = useUIStore((s) => s.tab);
  const detail = useUIStore((s) => s.detail);

  useAudioElement();

  useEffect(() => {
    init();
  }, [init]);

  const renderContent = () => {
    if (detail?.type === "album") return <AlbumDetail albumKey={detail.key} />;
    if (detail?.type === "artist") return <ArtistDetail artistKey={detail.key} />;
    if (detail?.type === "playlist") return <PlaylistDetail playlistId={detail.id} />;

    if (tab === "search") return <SearchView />;

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 pt-3 pb-2 sticky top-0 bg-nm-bg/90 backdrop-blur z-10 safe-top">
          <h1 className="text-2xl font-bold">{TAB_TITLES[tab]}</h1>
          <ImportButton />
        </div>
        <div className="flex-1 overflow-y-auto nm-scrollbar-none">
          {tab === "playlists" && <PlaylistsList />}
          {tab === "artists" && <ArtistsList />}
          {tab === "albums" && <AlbumsGrid />}
          {tab === "songs" && <SongsList />}
        </div>
      </div>
    );
  };

  if (!ready) {
    return <div className="h-screen w-screen bg-nm-bg" />;
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <main className="flex-1 min-h-0">{renderContent()}</main>
      <MiniPlayer />
      <TabBar />
      <NowPlayingSheet />
    </div>
  );
}

export default App;
