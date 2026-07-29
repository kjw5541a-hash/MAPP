import type { Track } from "../types";

const ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export const CRITERIA = [
  { id: "mood", label: "분위기", hint: "곡이 주는 감정과 정서" },
  { id: "artist", label: "가수", hint: "같은 가수이거나 창법이 닮은 가수" },
  { id: "key", label: "코드·조성", hint: "AI 추정값이라 부정확할 수 있음" },
  { id: "genre", label: "장르", hint: "발라드, 시티팝 같은 장르" },
  { id: "era", label: "시대", hint: "비슷한 연대의 곡" },
  { id: "tempo", label: "템포·에너지", hint: "빠르기와 고조되는 정도" },
  { id: "lyrics", label: "가사 주제", hint: "가사가 다루는 소재" },
] as const;

export type CriterionId = (typeof CRITERIA)[number]["id"];

export interface Recommendation {
  title: string;
  artist: string;
  reason: string;
  estimatedKey?: string;
}

export function youtubeSearchUrl(rec: Recommendation) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${rec.artist} ${rec.title}`,
  )}`;
}

function buildPrompt(track: Track, criteria: CriterionId[]) {
  const asked = CRITERIA.filter((c) => criteria.includes(c.id)).map((c) => c.label);
  const lyricsExcerpt = track.lyrics?.slice(0, 600);

  return [
    "너는 음악 추천 전문가다. 아래 기준 곡과 비슷한 느낌의 곡을 8곡 추천해라.",
    "",
    "[기준 곡]",
    `제목: ${track.title}`,
    `가수: ${track.artist}`,
    `앨범: ${track.album}`,
    lyricsExcerpt ? `가사 일부:\n${lyricsExcerpt}` : "가사: 없음",
    "",
    `[비교 기준] ${asked.join(", ")}`,
    "위 기준들을 종합해서 비슷한 곡을 골라라.",
    criteria.includes("key")
      ? "코드·조성은 확실히 아는 경우에만 estimatedKey에 적고, 모르면 생략해라. 지어내지 마라."
      : "",
    "",
    "[규칙]",
    "- 기준 곡 자신은 제외한다.",
    "- 실제로 존재하는 곡만 추천한다. 확실하지 않으면 넣지 마라.",
    "- reason은 왜 비슷한지 한국어 한 문장으로 쓴다.",
    "- 기준 곡이 한국 노래면 한국 곡 위주로 추천한다.",
    "",
    "JSON 배열로만 답하라. 각 원소는 title, artist, reason, (선택)estimatedKey 키를 가진다.",
  ]
    .filter(Boolean)
    .join("\n");
}

function extractJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    // Models sometimes wrap JSON in prose or a code fence.
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("추천 결과를 해석하지 못했습니다.");
    return JSON.parse(match[0]);
  }
}

export async function recommendSimilar(
  apiKey: string,
  track: Track,
  criteria: CriterionId[],
): Promise<Recommendation[]> {
  const response = await fetch(`${ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(track, criteria) }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.9 },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    if (response.status === 400 && detail.includes("API_KEY")) {
      throw new Error("API 키가 올바르지 않습니다. 설정에서 다시 확인해주세요.");
    }
    if (response.status === 429) {
      throw new Error("요청 한도를 넘었습니다. 잠시 후 다시 시도해주세요.");
    }
    throw new Error(`추천 요청이 실패했습니다 (${response.status}).`);
  }

  const data = await response.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("추천 결과가 비어 있습니다.");

  const parsed = extractJson(text);
  if (!Array.isArray(parsed)) throw new Error("추천 결과를 해석하지 못했습니다.");

  return parsed
    .filter((r): r is Recommendation => Boolean(r?.title && r?.artist))
    .map((r) => ({
      title: String(r.title),
      artist: String(r.artist),
      reason: String(r.reason ?? ""),
      estimatedKey: r.estimatedKey ? String(r.estimatedKey) : undefined,
    }));
}
