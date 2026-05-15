# Firebase 설정

## 선택값

- Firestore edition: Standard
- 시작 모드: Production mode
- 권장 리전: 한국 사용자 중심이면 `asia-northeast3 (Seoul)`

## 사용 서비스

- Firebase Authentication: 관리자 이메일/비밀번호 로그인
- Cloud Firestore: 설문 정의와 응답 저장

## 컬렉션

```text
survey_definitions/{slug}
  slug: string
  title: string
  definition: object
  isActive: boolean
  updatedAt: string

survey_responses/{responseId}
  id: string
  surveySlug: string
  anonId: string
  startedAt: string
  submittedAt: string
  answers: object
  userAgent: string
  schemaVersion: number

survey_response_logs/{logId}
  id: string
  responseId: string
  surveySlug: string
  anonId: string
  submittedAt: string
  createdAt: string
  payloadJson: string
  errorMessage: string
  userAgent: string
  schemaVersion: number
```

## 문서 ID와 타입

- `survey_definitions`의 문서 ID는 자동 생성하지 않는다.
- 기본 설문 문서 ID는 설문 slug와 같은 `ai-vs-human`을 사용한다.
- `definition` 필드는 Firestore 콘솔에서 `map` 타입으로 만든다. `reference`가 아니다.
- `answers` 필드도 `map` 타입이다.
- `survey_responses`는 수동 생성하지 않는다. 응답 제출 시 앱이 `resp_...` 형식 ID로 생성한다.

## Firestore Rules

콘솔 Rules 탭에는 루트의 `firestore.rules` 내용을 붙여넣는다.

## Firebase Console에서 할 일

- Authentication에서 Email/Password provider 활성화
- 관리자 계정 생성
- Firestore Database를 Standard + Production mode로 생성
- `firestore.rules` 적용
- `.env.local`에 Firebase 웹 앱 설정값 입력

## 운영 메모

- 응답자는 `survey_responses` 문서 생성만 가능하다.
- `survey_responses` 정상 저장이 실패하면 `survey_response_logs`에 원본 응답 JSON 문자열을 복구용으로 저장한다.
- 관리자 로그인 사용자는 설문 정의 저장과 응답 조회가 가능하다.
- 설문 정의가 아직 Firestore에 없으면 앱은 코드에 포함된 기본 설문을 사용한다.
- `/admin` JSON 빌더에서 저장하면 Firestore의 `survey_definitions/{slug}`에 업로드된다.
- `/admin`의 캐시 동기화 버튼은 브라우저 캐시에 남아 있는 응답을 Firestore로 다시 저장한다.
- `/admin`에서는 관리자 로그인 상태에서 응답 조회, 개별 삭제, 전체 초기화가 가능하다.
