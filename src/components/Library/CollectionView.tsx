import { useUIStore } from "../../store/uiStore";
import { AlbumsGrid } from "./AlbumsGrid";
import { ArtistsList } from "./ArtistsList";

const MODES = [
  { id: "albums", label: "앨범" },
  { id: "artists", label: "아티스트" },
] as const;

export function CollectionView() {
  const mode = useUIStore((s) => s.collectionMode);
  const setMode = useUIStore((s) => s.setCollectionMode);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pb-3 shrink-0">
        <div className="flex gap-1 p-1 rounded-xl bg-am-fill">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`flex-1 py-1.5 rounded-lg text-[14px] transition-all ${
                mode === m.id ? "bg-white text-am-accent font-semibold" : "text-am-muted"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain no-scrollbar">
        {mode === "albums" ? <AlbumsGrid /> : <ArtistsList />}
      </div>
    </div>
  );
}
