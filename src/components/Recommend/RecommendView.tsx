import { useState } from "react";
import { Sparkles, ExternalLink, Music2 } from "lucide-react";
import { useLibraryStore } from "../../store/libraryStore";
import { usePlayerStore } from "../../store/playerStore";
import { useSettingsStore } from "../../store/settingsStore";
import {
  CRITERIA,
  recommendSimilar,
  youtubeSearchUrl,
  type CriterionId,
  type Recommendation,
} from "../../lib/recommend";
import { CoverArt } from "../CoverArt";
import type { Track } from "../../types";

const DEFAULT_CRITERIA: CriterionId[] = ["mood", "genre", "tempo"];

export function RecommendView() {
  const playing = usePlayerStore((s) => s.currentTrack());
  const tracks = useLibraryStore((s) => s.tracks);
  const apiKey = useSettingsStore((s) => s.geminiApiKey);

  const [picked, setPicked] = useState<Track | null>(null);
  const [criteria, setCriteria] = useState<CriterionId[]>(DEFAULT_CRITERIA);
  const [results, setResults] = useState<Recommendation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const base = playing ?? picked;

  const toggle = (id: CriterionId) =>
    setCriteria((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  const run = async () => {
    if (!base) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      setResults(await recommendSimilar(apiKey, base, criteria));
    } catch (err) {
      setError(err instanceof Error ? err.message : "추천에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (tracks.length === 0) {
    return (
      <Centered>
        <p className="text-nm-text-muted text-sm">
          라이브러리에 곡이 있어야 추천을 받을 수 있습니다.
        </p>
      </Centered>
    );
  }

  if (!apiKey) {
    return (
      <Centered>
        <div className="w-16 h-16 rounded-3xl nm-raised flex items-center justify-center text-nm-text-muted">
          <Sparkles className="w-7 h-7" />
        </div>
        <p className="text-nm-text-muted text-sm">
          설정에서 Gemini API 키를 먼저 입력해주세요.
          <br />
          키는 이 기기에만 저장됩니다.
        </p>
      </Centered>
    );
  }

  if (!base) {
    return (
      <div className="flex flex-col h-full">
        <p className="text-center text-sm text-nm-text-muted px-8 py-6 shrink-0">
          기준이 될 곡을 재생하거나 아래에서 골라주세요.
        </p>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain nm-scrollbar-none px-4 pb-4 flex flex-col gap-1">
          {tracks.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setPicked(t)}
              className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-nm-text/5 text-left"
            >
              <CoverArt artKey={t.artKey} alt={t.title} className="w-11 h-11" />
              <div className="min-w-0">
                <p className="truncate text-[15px]">{t.title}</p>
                <p className="truncate text-[13px] text-nm-text-muted">{t.artist}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain nm-scrollbar-none px-4 pb-6">
      <div className="flex items-center gap-3 nm-flat rounded-2xl px-3 py-2.5">
        <CoverArt artKey={base.artKey} alt={base.title} className="w-12 h-12" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-nm-text-muted">기준 곡</p>
          <p className="truncate text-[15px]">{base.title}</p>
          <p className="truncate text-[13px] text-nm-text-muted">{base.artist}</p>
        </div>
        {!playing && (
          <button
            type="button"
            onClick={() => setPicked(null)}
            className="text-[12px] text-nm-accent shrink-0"
          >
            변경
          </button>
        )}
      </div>

      <h2 className="text-[13px] text-nm-text-muted px-1 pt-6 pb-2">무엇을 기준으로 찾을까요?</h2>
      <div className="flex flex-wrap gap-2">
        {CRITERIA.map((c) => {
          const on = criteria.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              title={c.hint}
              onClick={() => toggle(c.id)}
              className={`px-3.5 py-2 rounded-full text-[13px] transition-all ${
                on ? "nm-pressed text-nm-accent" : "nm-flat text-nm-text-muted"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>
      {criteria.includes("key") && (
        <p className="text-[12px] text-nm-text-muted mt-2 px-1">
          코드·조성은 음원에서 읽어낸 값이 아니라 AI 추정이라 틀릴 수 있습니다.
        </p>
      )}

      <button
        type="button"
        disabled={loading || criteria.length === 0}
        onClick={run}
        className="w-full mt-5 py-3 rounded-full nm-accent-btn font-medium disabled:opacity-40"
      >
        {loading ? "찾는 중…" : "비슷한 곡 추천받기"}
      </button>

      {error && (
        <div className="nm-inset-sm rounded-2xl px-4 py-3 mt-4">
          <p className="text-[13px] text-red-500 whitespace-pre-line leading-relaxed break-words">
            {error}
          </p>
        </div>
      )}

      {results && results.length === 0 && (
        <p className="text-[13px] text-nm-text-muted text-center mt-6">추천 결과가 없습니다.</p>
      )}

      {results && results.length > 0 && (
        <div className="flex flex-col gap-2 mt-6">
          {results.map((r, i) => (
            <a
              key={`${r.artist}-${r.title}-${i}`}
              href={youtubeSearchUrl(r)}
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-3 nm-flat rounded-2xl px-4 py-3"
            >
              <div className="w-9 h-9 rounded-xl nm-inset-sm flex items-center justify-center text-nm-text-muted shrink-0">
                <Music2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] leading-snug">{r.title}</p>
                <p className="text-[13px] text-nm-text-muted">{r.artist}</p>
                {r.reason && (
                  <p className="text-[12px] text-nm-text-muted mt-1 leading-relaxed">{r.reason}</p>
                )}
                {r.estimatedKey && (
                  <span className="inline-block text-[11px] text-nm-text-muted nm-inset-sm rounded-full px-2 py-0.5 mt-1.5">
                    조성 {r.estimatedKey} (추정)
                  </span>
                )}
              </div>
              <ExternalLink className="w-4 h-4 text-nm-text-muted shrink-0 mt-1" />
            </a>
          ))}
          <p className="text-[11px] text-nm-text-muted/80 text-center pt-2">
            누르면 유튜브에서 검색됩니다
          </p>
        </div>
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 h-full px-8 text-center">
      {children}
    </div>
  );
}
