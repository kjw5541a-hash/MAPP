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
import { CollectionView } from "./components/Library/CollectionView";
import { AlbumDetail } from "./components/Library/AlbumDetail";
import { ArtistDetail } from "./components/Library/ArtistDetail";
import { RecommendView } from "./components/Recommend/RecommendView";
import { PlaylistsList } from "./components/Playlists/PlaylistsList";
import { PlaylistDetail } from "./components/Playlists/PlaylistDetail";
import { SearchView } from "./components/Search/SearchView";
import { SettingsSheet } from "./components/Settings/SettingsSheet";

const TAB_TITLES: Record<string, string> = {
  playlists: "재생목록",
  collection: "보관함",
  songs: "곡",
  ai: "AI 추천",
};

// These lay out their own scrolling region rather than sitting inside one.
const SELF_SCROLLING: string[] = ["collection", "ai"];

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
            {tab !== "ai" && <ImportButton />}
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
        {SELF_SCROLLING.includes(tab) ? (
          <div className="flex-1 min-h-0 flex flex-col">
            {tab === "collection" && <CollectionView />}
            {tab === "ai" && <RecommendView />}
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain nm-scrollbar-none">
            {tab === "playlists" && <PlaylistsList />}
            {tab === "songs" && <SongsList />}
          </div>
        )}
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
