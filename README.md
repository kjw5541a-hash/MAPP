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

## 동작 방식

- m4a 파일을 선택하면 [`music-metadata`](https://github.com/Borewit/music-metadata)로 태그(제목/아티스트/앨범/커버/가사)를 파싱합니다.
- 원본 오디오 파일과 커버 이미지, 메타데이터는 브라우저 IndexedDB에 저장되어 다음 방문 시 다시 선택할 필요가 없습니다.
- PWA로 구성되어 있어 아이폰에서 홈 화면에 추가하면 전체 화면 앱처럼 사용할 수 있습니다.
