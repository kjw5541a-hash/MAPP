import type { Track } from "../types";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

export const DEFAULT_MODEL = "gemini-2.0-flash";

export interface GeminiModel {
  id: string;
  label: string;
}

/** Which models a key may actually call changes over time and differs per
 *  project, so the list comes from Google rather than being hardcoded. */
export async function listModels(apiKey: string): Promise<GeminiModel[]> {
  const response = await fetch(
    `${API_BASE}/models?pageSize=200&key=${encodeURIComponent(apiKey)}`,
  );
  if (!response.ok) throw await describeFailure(response, "");

  const data = await response.json();
  return ((data?.models ?? []) as Array<Record<string, unknown>>)
    .filter((m) => (m.supportedGenerationMethods as string[])?.includes("generateContent"))
    .map((m) => ({
      id: String(m.name).replace(/^models\//, ""),
      label: String(m.displayName ?? m.name),
    }))
    .filter((m) => !/embedding|aqa|vision/i.test(m.id));
}

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

/** Google explains precisely which limit or setting is at fault; swallowing
 *  that and showing a generic line leaves nothing to act on. */
async function describeFailure(response: Response, model: string): Promise<Error> {
  const raw = await response.text().catch(() => "");
  let message = "";
  let quota = "";
  try {
    const body = JSON.parse(raw);
    message = body?.error?.message ?? "";
    const failure = body?.error?.details?.find((d: { violations?: unknown[] }) => d.violations);
    quota = failure?.violations
      ?.map((v: { quotaId?: string; quotaMetric?: string }) => v.quotaId ?? v.quotaMetric)
      .filter(Boolean)
      .join(", ");
  } catch {
    message = raw.slice(0, 400);
  }

  const detail = [message, quota && `한도 항목: ${quota}`].filter(Boolean).join("\n");

  if (response.status === 400 && /api[ _-]?key/i.test(message)) {
    return new Error(`API 키가 올바르지 않습니다. 설정에서 다시 확인해주세요.\n\n${detail}`);
  }
  if (response.status === 403) {
    return new Error(
      `이 키로는 접근이 거부되었습니다. Google AI Studio에서 키가 살아있는지, 해당 프로젝트에 Generative Language API가 켜져 있는지 확인해주세요.\n\n${detail}`,
    );
  }
  if (response.status === 404) {
    return new Error(
      `모델 ${model}을(를) 찾을 수 없습니다. 설정에서 사용 가능한 모델을 불러와 다른 모델을 골라주세요.\n\n${detail}`,
    );
  }
  // limit: 0 is not an allowance you used up — this key has no allowance for
  // this model at all, so waiting changes nothing.
  if (response.status === 429 && /limit:\s*0\b/.test(message)) {
    return new Error(
      `이 키는 ${model} 모델을 쓸 수 없습니다 (허용량이 0). 기다려도 풀리지 않습니다.\n` +
        `설정에서 "사용 가능한 모델 불러오기"를 눌러 다른 모델을 골라주세요.\n\n${detail}`,
    );
  }
  if (response.status === 429) {
    return new Error(
      `Google이 사용 한도 초과로 거절했습니다. 분당 한도라면 1분 뒤 다시 되고, 일일 한도라면 내일 풀립니다.\n\n${detail}`,
    );
  }
  return new Error(`추천 요청이 실패했습니다 (${response.status}).\n\n${detail}`);
}

export async function recommendSimilar(
  apiKey: string,
  model: string,
  track: Track,
  criteria: CriterionId[],
): Promise<Recommendation[]> {
  const endpoint = `${API_BASE}/models/${model}:generateContent`;
  const response = await fetch(`${endpoint}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(track, criteria) }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.9 },
    }),
  });

  if (!response.ok) throw await describeFailure(response, model);

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
