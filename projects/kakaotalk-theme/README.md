# 카카오톡 테마 만들기

브라우저에서 카카오톡 테마 리소스를 편집하고 zip으로 내려받는 페이지입니다. 배포 주소는 `/MAPP/kakao/` 이며, 음악 플레이어와는 코드도 서비스 워커 캐시도 공유하지 않습니다.

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

- 채팅방 · 친구 목록 미리보기를 보면서 색상 리소스를 편집합니다.
- 채팅방/전체 배경 이미지를 올리면 업로드한 파일 그대로 테마에 담깁니다.
- 편집 중인 내용은 IndexedDB에 남아 다음 방문 때 이어서 작업할 수 있습니다.
- 내려받기를 누르면 `res/values/colors.xml`, 배경 drawable, `AndroidManifest.xml` 예시, 다시 불러올 수 있는 `theme.json`이 담긴 zip이 만들어집니다.

브라우저에서는 APK 서명을 할 수 없어 설치 파일까지는 만들지 못합니다. 내려받은 리소스를 카카오톡 테마 템플릿 안드로이드 프로젝트에 넣고 Android Studio에서 빌드해야 합니다.
