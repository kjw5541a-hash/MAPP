import { useRef, type ReactNode } from "react";
import { Download, RotateCcw, Upload } from "lucide-react";
import { Preview } from "./Preview";
import { useEditor } from "./store";
import { buildPackage, download, slug, themeJson } from "./export";
import { BACKGROUNDS, COLOR_GROUPS, newTheme, PRESETS, sanitize, type BackgroundKey } from "./theme";

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function App() {
  const { theme, screen, setScreen, setName, setAuthor, setColor, replace } = useEditor();
  const projectInput = useRef<HTMLInputElement>(null);

  async function importProject(file: File) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      parsed = null;
    }
    const imported = sanitize(parsed);
    if (imported) replace(imported);
    else alert("이 파일에서는 테마를 읽지 못했습니다. 이 툴에서 저장한 theme.json을 골라 주세요.");
  }

  return (
    <div className="min-h-dvh bg-neutral-100 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
          <h1 className="mr-auto text-lg font-bold">카카오톡 테마 만들기</h1>
          <button
            type="button"
            onClick={() => projectInput.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium"
          >
            <Upload size={15} /> 불러오기
          </button>
          <button
            type="button"
            onClick={() => download(new Blob([themeJson(theme)], { type: "application/json" }), `${slug(theme.name)}.json`)}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium"
          >
            저장
          </button>
          <button
            type="button"
            onClick={() => {
              const { blob, fileName } = buildPackage(theme);
              download(blob, fileName);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-[#fee500] px-3 py-1.5 text-sm font-bold"
          >
            <Download size={15} /> 테마 내려받기
          </button>
          <input
            ref={projectInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importProject(file);
              e.target.value = "";
            }}
          />
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-[1fr_320px]">
        <div className="order-2 space-y-6 lg:order-1">
          <Section title="테마 정보">
            <label className="block">
              <span className="mb-1 block text-xs text-neutral-500">테마 이름</span>
              <input
                value={theme.name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-neutral-500">제작자</span>
              <input
                value={theme.author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="선택"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </label>
          </Section>

          <Section title="기본 팔레트">
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => replace({ ...theme, colors: { ...preset.colors } })}
                  className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm"
                >
                  <span className="flex">
                    {["thm_chatroom_bg", "thm_chatroom_me_bubble_bg", "thm_chatroom_other_bubble_bg"].map((key) => (
                      <span
                        key={key}
                        className="-ml-1 size-4 rounded-full border border-black/10 first:ml-0"
                        style={{ background: preset.colors[key] }}
                      />
                    ))}
                  </span>
                  {preset.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  if (confirm("편집 중인 내용을 모두 지우고 새로 시작할까요?")) replace(newTheme());
                }}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-500"
              >
                <RotateCcw size={14} /> 초기화
              </button>
            </div>
          </Section>

          <Section title="배경 이미지">
            <p className="text-xs text-neutral-500">
              넣지 않으면 위에서 고른 배경색이 그대로 쓰입니다. 올린 파일은 그대로 테마에 담깁니다.
            </p>
            {BACKGROUNDS.map(({ key, label }) => (
              <ImageField key={key} imageKey={key} label={label} />
            ))}
          </Section>

          {COLOR_GROUPS.map((group) => (
            <Section key={group.id} title={group.label}>
              <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {group.keys.map(({ name, label }) => (
                  <div key={name} className="flex items-center gap-3">
                    <input
                      type="color"
                      value={theme.colors[name]}
                      onChange={(e) => setColor(name, e.target.value)}
                      aria-label={label}
                      className="size-9 shrink-0 cursor-pointer rounded-lg border border-neutral-300 bg-white p-1"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm">{label}</div>
                      <div className="truncate font-mono text-[11px] text-neutral-400">{name}</div>
                    </div>
                    <span className="font-mono text-xs text-neutral-500 uppercase">{theme.colors[name]}</span>
                  </div>
                ))}
              </div>
            </Section>
          ))}

          <p className="text-xs leading-relaxed text-neutral-500">
            내려받은 zip에는 colors.xml과 배경 이미지, AndroidManifest.xml 예시가 들어 있습니다. 브라우저에서는 APK
            서명을 할 수 없어 설치 파일까지는 만들 수 없으니, 카카오톡 테마 템플릿 프로젝트에 넣고 Android Studio에서
            빌드하세요. 자세한 순서는 zip 안의 README.txt에 있습니다.
          </p>
        </div>

        <div className="order-1 lg:order-2">
          <div className="lg:sticky lg:top-6">
            <div className="mb-3 flex justify-center gap-1 rounded-lg bg-neutral-200 p-1 text-sm">
              {(["chatroom", "friends"] as const).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setScreen(id)}
                  className={`flex-1 rounded-md px-3 py-1.5 ${screen === id ? "bg-white font-semibold" : "text-neutral-500"}`}
                >
                  {id === "chatroom" ? "채팅방" : "친구 목록"}
                </button>
              ))}
            </div>
            <Preview theme={theme} screen={screen} />
          </div>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-neutral-200 bg-white p-4">
      <h2 className="text-sm font-bold">{title}</h2>
      {children}
    </section>
  );
}

function ImageField({ imageKey, label }: { imageKey: BackgroundKey; label: string }) {
  const image = useEditor((s) => s.theme.images[imageKey]);
  const setImage = useEditor((s) => s.setImage);
  const input = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-3">
      <div
        className="size-12 shrink-0 rounded-lg border border-neutral-300 bg-neutral-100 bg-cover bg-center"
        style={image ? { backgroundImage: `url(${image.dataUrl})` } : undefined}
      />
      <div className="min-w-0 flex-1">
        <div className="text-sm">{label}</div>
        <div className="truncate text-[11px] text-neutral-400">{image ? image.fileName : "없음"}</div>
      </div>
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs"
      >
        선택
      </button>
      {image && (
        <button
          type="button"
          onClick={() => setImage(imageKey, null)}
          className="rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs text-neutral-500"
        >
          삭제
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) setImage(imageKey, { dataUrl: await readAsDataUrl(file), fileName: file.name });
        }}
      />
    </div>
  );
}
