import { useEffect, useState } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { useLibraryStore } from "./store/libraryStore";
import { useUIStore } from "./store/uiStore";
import { useAudioElement } from "./hooks/useAudioElement";
import { useViewport } from "./hooks/useViewport";
import { TabBar } from "./components/TabBar";
import { MiniPlayer } from "./components/MiniPlayer";
import { ImportToast } from "./components/ImportToast";
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
import { SettingsSheet } from "./components/Settings/SettingsSheet";

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

  const [showSettings, setShowSettings] = useState(false);

  const { keyboardOpen } = useViewport();

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
        <div className="flex items-center justify-between px-4 pb-2 shrink-0 safe-top">
          <h1 className="text-2xl font-bold">{TAB_TITLES[tab]}</h1>
          <div className="flex items-center gap-2">
            <ImportButton />
            <button
              type="button"
              aria-label="설정"
              onClick={() => setShowSettings(true)}
              className="w-9 h-9 rounded-full nm-flat flex items-center justify-center shrink-0"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain nm-scrollbar-none">
          {tab === "playlists" && <PlaylistsList />}
          {tab === "artists" && <ArtistsList />}
          {tab === "albums" && <AlbumsGrid />}
          {tab === "songs" && <SongsList />}
        </div>
      </div>
    );
  };

  if (!ready) {
    return <div className="fixed inset-0 bg-nm-bg" />;
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden">
      <main className="flex-1 min-h-0">{renderContent()}</main>
      {!keyboardOpen && (
        <>
          <ImportToast />
          <MiniPlayer />
          <TabBar />
        </>
      )}
      <NowPlayingSheet />
      {showSettings && <SettingsSheet onClose={() => setShowSettings(false)} />}
    </div>
  );
}

export default App;
