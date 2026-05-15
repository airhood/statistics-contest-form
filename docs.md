# AI 콘텐츠 판별 설문

## 프로젝트 목표

"사람들은 AI 콘텐츠를 구별해낼 수 있을까?"라는 주제의 통계 설문을 JSON 정의 기반으로 운영한다. 응답자는 한 화면에 하나의 콘텐츠/문항 세트를 보고 답변하며, 관리자는 JSON 설문 정의와 응답 데이터를 확인한다.

## 현재 구현

- Vite + React + TypeScript 기반 프론트엔드.
- 스타일은 Tailwind CSS 유틸리티만 사용한다. 루트 CSS 파일은 `src/styles.css` 하나이며 Tailwind import만 포함한다.
- 응답자 화면 `/`은 저장된 설문 JSON 정의를 읽어 렌더링한다.
- 관리자 화면 `/admin`은 설문 목록, JSON 빌더, 대시보드, 상태 화면을 제공한다.
- 관리자 JSON 빌더에서 저장한 설문 정의는 즉시 응답자 화면에 반영된다.
- 이미지, 영상, 음성, 텍스트 미디어 블록을 지원한다. `media.src`가 있으면 실제 미디어를 렌더링하고 없으면 플레이스홀더를 보여준다.
- 문항에 `showIf`를 넣어 이전 응답에 따른 조건부 표시를 지원한다.
- 연락처 문항은 `type: "contact"`로 이메일 또는 전화번호 입력을 받을 수 있다.
- 응답 중간 저장 드래프트를 `localStorage`에 저장하고 재방문 시 이어서 답변한다.
- 응답 완료 시 Firestore 저장을 시도하고, 실패하거나 Firebase 설정이 없으면 로컬 캐시로 동작한다.
- Firestore 정상 응답 저장이 실패하면 `survey_response_logs`에 원본 응답 JSON 문자열을 한 번 더 저장해 복구 가능성을 높인다.
- 완료 화면은 Firebase 저장 성공, 저장 확인 중, 로컬 캐시 보관 상태를 구분해서 표시한다.
- 관리자 응답 목록에서 CSV/JSON 내보내기를 지원한다.
- CSV/JSON 내보내기는 전체 문항 구조를 유지하고, 조건상 표시되지 않은 문항은 빈 값으로 둔다.
- 관리자 화면에서 로컬 캐시에 남은 응답을 Firestore로 다시 전송할 수 있다.
- 관리자 화면에서 응답 상세 확인, 개별 응답 삭제, 전체 응답 초기화를 지원한다.

## Firebase 전환

- Supabase 사용량 문제로 Firebase Firestore + Firebase Auth 구조로 전환했다.
- 예상 응답자 규모가 최대 약 1000명 수준이라 Firestore 무료 한도 안에서 운영 가능하다고 판단했다.
- Firebase 웹 앱 설정값은 `.env.local`에 입력했다.
- `.env.example`에는 변수명만 남겨둔다.
- Firestore 컬렉션은 `survey_definitions`, `survey_responses`를 사용한다.
- Firebase 설정이 있으면 관리자 페이지는 이메일/비밀번호 로그인을 요구한다.
- 세부 Rules와 Firebase Console 설정은 `docs/firebase.md`에 정리했다.

## 파일 구조

```text
statistics-contest-form/
  .env.example
  .env.local
  .gitignore
  docs.md
  firestore.rules
  docs/
    firebase.md
  index.html
  package.json
  vite.config.ts
  src/
    components/
      App.tsx
      icons.tsx
      admin/
        AdminCharts.tsx
        AdminPage.tsx
      layout/
        BottomMeta.tsx
        TopBar.tsx
      pages/
        CompletePage.tsx
        IntroPage.tsx
        QuestionPage.tsx
      survey/
        ErrorLine.tsx
        MediaBlock.tsx
        QuestionRenderer.tsx
    data/
      survey.ts
    lib/
      draft.ts
      exportResponses.ts
      firebase.ts
      responses.ts
      survey.ts
      surveyDefinition.ts
      theme.ts
      types.ts
    main.tsx
    styles.css
```

## 남은 작업

- Firebase Console의 Authentication/Firestore 설정 완료 상태 확인.
- Firestore Rules는 루트 `firestore.rules`와 동일하게 유지.
- Firestore 설정 후 `/admin`에서 로그인하고 JSON 빌더의 저장 버튼을 눌러 기본 설문 정의를 Firestore에 업로드.
- 실제 미디어 파일을 Firebase Storage나 외부 URL에 올리고 설문 JSON의 `media.src`에 연결.
- 배포 설정.
