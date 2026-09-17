import { ALL_KEYS, BACKGROUNDS, type KakaoTheme } from "./theme";
import { dataUrlBytes, textEntry, zip, type ZipEntry } from "./zip";

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** Lowercase ASCII identifier, used for the file name and the package suffix. */
export function slug(name: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned || "mytheme";
}

function colorsXml(theme: KakaoTheme): string {
  const lines = ALL_KEYS.map(({ name }) => `    <color name="${name}">${theme.colors[name]}</color>`);
  return `<?xml version="1.0" encoding="utf-8"?>
<resources>
${lines.join("\n")}
</resources>
`;
}

function stringsXml(theme: KakaoTheme): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${escapeXml(theme.name)}</string>
    <string name="theme_author">${escapeXml(theme.author)}</string>
</resources>
`;
}

function manifestXml(theme: KakaoTheme): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.kakaotheme.${slug(theme.name)}">

    <application
        android:label="@string/app_name"
        android:icon="@drawable/ic_launcher">
        <meta-data
            android:name="com.kakao.talk.theme"
            android:value="true" />
    </application>
</manifest>
`;
}

function readme(theme: KakaoTheme, drawables: string[]): string {
  const images = drawables.length ? drawables.map((d) => `  - res/drawable-nodpi/${d}`).join("\n") : "  (없음)";
  return `${theme.name}
${theme.author ? `제작: ${theme.author}\n` : ""}
카카오톡 테마 리소스 묶음입니다. 브라우저에서는 APK 서명을 할 수 없으므로,
이 파일들을 카카오톡 테마 템플릿 안드로이드 프로젝트에 넣고 빌드해야 합니다.

포함된 파일
  - res/values/colors.xml   색상 ${ALL_KEYS.length}개
  - res/values/strings.xml  테마 이름 / 제작자
  - AndroidManifest.xml     패키지명과 테마 메타데이터 예시
${images}
  - theme.json              이 툴에서 다시 열 수 있는 프로젝트 파일

적용 방법
  1. 카카오톡 테마 템플릿 프로젝트를 Android Studio로 엽니다.
  2. 위 res/ 파일들을 프로젝트의 res/ 아래 같은 경로에 덮어씁니다.
  3. AndroidManifest.xml의 package 값이 다른 테마와 겹치지 않는지 확인합니다.
  4. 릴리스 APK를 빌드해 서명한 뒤 기기에 설치합니다.
  5. 카카오톡 > 더보기 > 설정 > 테마에서 설치한 테마를 고릅니다.

색상 리소스 이름은 카카오톡 테마 템플릿의 표준 이름을 따릅니다. 카카오톡
버전에 따라 이름이 추가·변경될 수 있으니, 적용되지 않는 항목이 있으면
사용 중인 템플릿의 colors.xml과 이름을 맞춰 주세요.
`;
}

export function themeJson(theme: KakaoTheme): string {
  return JSON.stringify(theme, null, 2);
}

function extensionFor(dataUrl: string): string {
  return dataUrl.startsWith("data:image/jpeg") ? "jpg" : "png";
}

export function buildPackage(theme: KakaoTheme): { blob: Blob; fileName: string } {
  const entries: ZipEntry[] = [];
  const drawables: string[] = [];

  for (const { key } of BACKGROUNDS) {
    const image = theme.images[key];
    if (!image) continue;
    const fileName = `${key}.${extensionFor(image.dataUrl)}`;
    drawables.push(fileName);
    entries.push({ path: `res/drawable-nodpi/${fileName}`, data: dataUrlBytes(image.dataUrl) });
  }

  entries.push(
    textEntry("res/values/colors.xml", colorsXml(theme)),
    textEntry("res/values/strings.xml", stringsXml(theme)),
    textEntry("AndroidManifest.xml", manifestXml(theme)),
    textEntry("theme.json", themeJson(theme)),
    textEntry("README.txt", readme(theme, drawables)),
  );

  return { blob: zip(entries), fileName: `${slug(theme.name)}-theme.zip` };
}

export function download(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
