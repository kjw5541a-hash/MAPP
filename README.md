# Music

로컬 m4a 파일(제목/아티스트/커버/가사 태그 포함)을 재생하는 웹 기반 음악 플레이어입니다. 서버 없이 브라우저에서만 동작하며, 아이폰 뮤직 앱과 유사한 기본 기능(라이브러리, 재생, 가사, 재생목록, 검색)을 제공합니다.

## 개발

```bash
npm install
npm run dev
```

## 빌드 / 검증

```bash
npm run typecheck
npm run lint
npm run build
```

## 카카오톡 테마 만들기 (`/kakao/`)

같은 저장소에 들어 있는 별도 페이지입니다(`kakao/index.html`, `src/kakao/`). 음악 플레이어와는 코드도 서비스 워커 캐시도 공유하지 않습니다.

- 채팅방 · 친구 목록 미리보기를 보면서 색상 리소스를 편집합니다.
- 채팅방/전체 배경 이미지를 올리면 업로드한 파일 그대로 테마에 담깁니다.
- 편집 중인 내용은 IndexedDB에 남아 다음 방문 때 이어서 작업할 수 있습니다.
- 내려받기를 누르면 `res/values/colors.xml`, 배경 drawable, `AndroidManifest.xml` 예시, 다시 불러올 수 있는 `theme.json`이 담긴 zip이 만들어집니다.

브라우저에서는 APK 서명을 할 수 없어 설치 파일까지는 만들지 못합니다. 내려받은 리소스를 카카오톡 테마 템플릿 안드로이드 프로젝트에 넣고 Android Studio에서 빌드해야 합니다.

## 동작 방식

- m4a 파일을 선택하면 [`music-metadata`](https://github.com/Borewit/music-metadata)로 태그(제목/아티스트/앨범/커버/가사)를 파싱합니다.
- 원본 오디오 파일과 커버 이미지, 메타데이터는 브라우저 IndexedDB에 저장되어 다음 방문 시 다시 선택할 필요가 없습니다.
- PWA로 구성되어 있어 아이폰에서 홈 화면에 추가하면 전체 화면 앱처럼 사용할 수 있습니다.
