import { ListMusic, Disc3, Music2, Search, Sparkles } from "lucide-react";
import { useUIStore, type Tab } from "../store/uiStore";

const TABS: { id: Tab; label: string; icon: typeof ListMusic }[] = [
  { id: "playlists", label: "재생목록", icon: ListMusic },
  { id: "collection", label: "보관함", icon: Disc3 },
  { id: "songs", label: "곡", icon: Music2 },
  { id: "search", label: "검색", icon: Search },
  { id: "ai", label: "AI추천", icon: Sparkles },
];

export function TabBar() {
  const tab = useUIStore((s) => s.tab);
  const setTab = useUIStore((s) => s.setTab);

  return (
    <nav className="flex justify-around px-2 pt-2 nm-flat safe-bottom">
      {TABS.map(({ id, label, icon: Icon }) => {
        const active = tab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 min-w-16 rounded-2xl transition-all ${
              active ? "nm-pressed text-nm-accent" : "text-nm-text-muted"
            }`}
          >
            <Icon className="w-5.5 h-5.5" strokeWidth={active ? 2.4 : 2} />
            <span className="text-[10px]">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
