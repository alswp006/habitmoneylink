# TASK

## Epic 1. TypeScript types + interfaces (`src/lib/types.ts`)
### Task 1.1 논리 스키마 타입 + StorageError + RouteState 계약 고정
- Description:
  - SPEC에 정의된 모든 엔티티 타입, StorageError 모델, HTTP-like status 매핑, 그리고 **RouteState 계약**을 `src/lib/types.ts`에 고정한다. (순수 타입/클래스/상수만; UI/스토리지 런타임 로직 없음)
- DoD:
  - [ ] `src/lib/types.ts`가 아래 항목을 **export** 한다.
    - `HabitCategory`, `Habit`, `CheckIn`, `Goal`, `Badge`, `WeekStartsOn`, `AppSettings`
    - `StorageErrorCode`, `StorageError`
    - `StorageHttpStatus = 400 | 401 | 404 | 409 | 500 | 507`
    - `toHttpLikeStatus(code: StorageErrorCode): StorageHttpStatus`
    - **`RouteState`** 타입이 아래 라우트를 모두 포함한다.
      - `"/"`: `undefined`
      - `"/habit/new"`: `undefined | { prefill?: Partial<Pick<Habit, "category" | "title" | "unitPriceKRW">> }`
      - `"/habit/:habitId/edit"`: `undefined`
      - `"/goal"`: `undefined`
      - `"/report"`: `undefined`
      - `"/badge"`: `undefined`
      - `"/badge/unlock"`: `undefined | { badgeId: Badge["id"] }`
  - [ ] `tsc --noEmit` 실행 시 타입 에러가 0건이다.
- Covers: [AC-S0-1, AC-S1-1, AC-S1-2, AC-S1-3, AC-S1-4, AC-S1-5, AC-S1-6, AC-S2-1, AC-S2-2, AC-S2-3, AC-S2-4, AC-S2-5, AC-S2-6, AC-S2-7, AC-S2-8, AC-S2-9, AC-S2-10, AC-S2-11, AC-S2-12, AC-S3-1, AC-S3-2, AC-S3-3, AC-S3-4, AC-S3-5, AC-S3-6, AC-S3-7, AC-S3-8, AC-S3-9, AC-S3-10, AC-S4-1, AC-S4-2, AC-S4-3, AC-S4-4, AC-S4-5, AC-S4-6, AC-S4-7, AC-S4-8, AC-11, AC-12, AC-F3-7, AC-F6-6]
- Files: [`src/lib/types.ts`]
- Depends on: [none]

### Risk Analysis (Epic 1)
- Complexity: Low
- Risk factors:
  - RouteState 누락/불일치 시 페이지 간 `location.state` 런타임 오류
  - 에러 코드 ↔ status 매핑 누락 시 UX/검수 문구 분기 실패
- Mitigation:
  - 첫 태스크에서 타입 계약을 고정하고 이후 모든 태스크가 이를 import하도록 순서 강제

---

## Epic 2. Data layer (storage helpers, state management)

### Task 2.1 localStorage base IO 유틸 + 키 상수
- Description:
  - localStorage IO 공통 유틸(읽기/쓰기/파싱)과 스토리지 키 상수를 만든다.
  - JSON.parse 실패는 `StorageError{code:'PARSE_ERROR'}`, 저장 용량 초과는 `StorageError{code:'QUOTA_EXCEEDED'}`로 통일한다.
- DoD:
  - [ ] `src/lib/storage/keys.ts`에 아래 키 상수가 export 되어 있다.
    - `savestreak.habits.v1`, `savestreak.checkins.v1`, `savestreak.goals.v1`, `savestreak.badges.v1`, `savestreak.settings.v1`
  - [ ] `readRaw(key)`는 키가 없으면 `null`을 반환한다.
  - [ ] `safeJsonParse(key, raw)`는 JSON.parse 예외 시 `StorageError(code='PARSE_ERROR', key=key)`를 throw 한다.
  - [ ] `safeSetItem(key, valueString)`는 Quota 계열 예외 발생 시 `StorageError(code='QUOTA_EXCEEDED', key=key)`를 throw 한다.
  - [ ] 모듈 import 시 사이드이펙트가 없다.
- Covers: [AC-11]
- Files: [`src/lib/storage/keys.ts`, `src/lib/storage/base.ts`]
- Depends on: [Task 1.1]

---

### Task 2.2 엔티티별 get/set + 최소 스키마 검증(타입가드)
- Description:
  - 5개 저장소 키에 대해 `get*()/set*()`를 만들고, 최소 스키마 검증 실패 시 `SCHEMA_MISMATCH(500)`로 throw 한다.
  - `goals`는 **active goal이 2개 이상이면 SCHEMA_MISMATCH**로 간주한다.
- DoD:
  - [ ] 아래 함수가 구현되어 export 된다. (키 미존재 시 기본값 반환)
    - `getHabits(): Habit[]`, `setHabits(next: Habit[]): void`
    - `getCheckIns(): CheckIn[]`, `setCheckIns(next: CheckIn[]): void`
    - `getGoals(): Goal[]`, `setGoals(next: Goal[]): void`
    - `getBadges(): Badge[]`, `setBadges(next: Badge[]): void`
    - `getSettings(): AppSettings | null`, `setSettings(next: AppSettings): void`
  - [ ] 각 `get*()`는 파싱 성공하더라도 최소 스키마 검증 실패 시 `StorageError(code='SCHEMA_MISMATCH')`를 throw 한다.
    - 예: `Habit[]`에 `id`가 string이 아니면 throw
  - [ ] `getGoals()`는 `isActive === true`가 2개 이상이면 `StorageError(code='SCHEMA_MISMATCH')`를 throw 한다.
  - [ ] 모든 `set*()`는 내부에서 Task 2.1의 `safeSetItem()`을 사용한다.
  - [ ] `tsc --noEmit` 에러 0건.
- Covers: [AC-11]
- Files: [`src/lib/storage/validate.ts`, `src/lib/storage/entities.ts`]
- Depends on: [Task 2.1]

---

### Task 2.3 KST 날짜 유틸 + AppStore 하이드레이션(인덱스/FK 검증/초기화)
- Description:
  - KST 기준 `YYYY-MM-DD` 오늘 문자열 유틸을 제공한다.
  - 앱 시작 하이드레이션에서 5개 엔티티를 로드하고, 메모리 인덱스(Map/Set)를 생성한다.
  - **FK 무결성(checkIns.habitId → habits.id) 검증 실패 시 SCHEMA_MISMATCH(500)**로 에러 상태를 만든다.
  - “초기화(resetAll)” 액션: 5개 키 삭제 후 빈 상태로 재하이드레이션 가능.
- DoD:
  - [ ] `src/lib/date/kst.ts`에 `getTodayKstYmd(): string`이 있고 반환 포맷이 `YYYY-MM-DD`이다.
  - [ ] `AppStoreProvider` + `useAppStore()`가 존재한다.
  - [ ] store state가 최소 아래를 포함한다.
    - `isHydrating: boolean`
    - `storageError: StorageError | null`
    - `habits, checkIns, goals, badges, settings`
    - 인덱스: `habitsById: Map`, `checkInsByHabitId: Map`, `checkInsByDate: Map`, `checkInUniqSet: Set`, `activeGoal: Goal | null`
  - [ ] hydrate 시 FK 검증:
    - 모든 `checkIns[].habitId`가 `habitsById`에 없으면 `storageError.code === 'SCHEMA_MISMATCH'` 상태가 된다. (throw를 provider에서 받아도 됨)
  - [ ] `resetAll()` 실행 시 5개 키가 localStorage에서 제거되고, store가 빈 데이터로 재구성된다.
  - [ ] 이 태스크 완료 후 앱은 컴파일된다(아직 라우팅/페이지 미완이어도 OK).
- Covers: [AC-S1-1, AC-11, AC-12]
- Files: [`src/lib/date/kst.ts`, `src/lib/store/AppStore.tsx`]
- Depends on: [Task 2.2]

---

### Task 2.4 Store write-side 뮤테이션(습관/체크인/목표/배지)
- Description:
  - 화면에서 호출할 “쓰기” 액션을 구현한다.
  - 중복/참조/상태 충돌을 `StorageError`로 표준화한다.
- DoD:
  - [ ] `createHabit(input)`이 Habit을 추가하고 `createdAt === updatedAt`을 만족한다.
  - [ ] `updateHabit(habitId, patch)`가 `updatedAt`만 갱신한다.
  - [ ] `deleteHabit(habitId)`가 Habit 삭제 후 해당 `habitId`의 CheckIn을 **모두 삭제(cascade)** 한다.
  - [ ] `createCheckIn({ habitId, date, savedAmountKRW })`가 아래를 만족한다.
    - habit이 없거나 `isActive === false`면 `StorageError(code='INVALID_REF')` throw (409)
    - `(habitId, date)`가 이미 존재하면 `StorageError(code='DUPLICATE')` throw (409)
    - 성공 시 checkIn 추가 + 인덱스/Set 동기화
  - [ ] `upsertActiveGoal({ title, targetAmountKRW })`:
    - active goal이 있으면 해당 goal 업데이트, 없으면 새 goal 생성
    - 저장 후 store의 `activeGoal`이 그 goal을 가리킨다.
  - [ ] `unlockBadge('streak_7', nowISO)`:
    - 이미 `unlockedAt !== null`이면 `StorageError(code='DUPLICATE')` throw (409)
    - 성공 시 `unlockedAt` 설정 + `updatedAt` 갱신
- Covers: [AC-F3-7, AC-F6-6]
- Files: [`src/lib/store/mutations.ts`]
- Depends on: [Task 2.3]

### Risk Analysis (Epic 2)
- Complexity: Medium
- Risk factors:
  - localStorage 손상/파싱 실패 시 앱 크래시
  - FK 무결성 누락 시 홈/리포트 계산에서 undefined 접근
  - CheckIn unique 미구현 시 중복 저장
- Mitigation:
  - base IO → 엔티티 검증 → 하이드레이션 FK → write-side 순서로 “실패 지점”을 분리해 디버깅/검수 리스크를 낮춤

---

## Epic 3. Core UI pages (`src/pages/`) — ONE page per task  
> 공통 규칙(모든 페이지 태스크에서 반드시 수행):  
> - `RouteState`를 import  
> - `const state = location.state as RouteState["/path"]` 형태로 타입 캐스팅  
> - `navigate()` 호출 시 `RouteState`에 정의된 타입만 전달

### Task 3.1 S0 차단 화면 `BlockingPage`
- Description:
  - S0 차단 화면을 TDS `Top`, `Paragraph.Text`로 구현한다.
- DoD:
  - [ ] `Top` 타이틀 텍스트가 정확히 “세션을 확인할 수 없어요”이다.
  - [ ] `Paragraph.Text` 텍스트가 정확히 “토스 앱에서 다시 열어주세요.”이다.
- Covers: [AC-S0-1]
- Files: [`src/pages/BlockingPage.tsx`]
- Depends on: [Task 1.1]

---

### Task 3.2 S1 홈 `/` (로딩/빈상태/에러다이얼로그/체크인/요약/배너)
- Description:
  - 활성 습관 리스트, 오늘 체크인, 누적 절약액, 목표 요약, 배너 `<AdSlot />`를 구현한다.
  - PARSE_ERROR/SCHEMA_MISMATCH 시 S1 에러 AlertDialog + 초기화 버튼을 구현한다.
  - 비활성/미존재 습관 체크인 시(409) “체크인할 수 없어요” AlertDialog를 구현한다.
- DoD:
  - [ ] `isHydrating === true`이면 “불러오는 중” 텍스트가 렌더링된다. (AC-S1-1)
  - [ ] 활성 습관 개수만큼 `ListRow`가 렌더링된다. (AC-S1-2)
  - [ ] 활성 습관 0개면 문구 “아직 습관이 없어요. 습관을 추가해보세요.” + 버튼 “습관 추가”가 보이고, 탭 시 `/habit/new`로 이동한다. (AC-S1-3)
  - [ ] 습관 행 탭 시 `/habit/:habitId/edit`로 이동한다. (AC-S1-4)
  - [ ] 누적 절약액이 `sum(checkIns.savedAmountKRW)` 값과 일치하는 숫자로 표시된다.
  - [ ] 활성 Goal이 없으면 “목표를 설정하면 D-day를 볼 수 있어요” 문구가 보인다. (AC-S1-6)
  - [ ] `<AdSlot />`이 “누적 절약액/목표 요약 섹션 하단”에 1개 렌더링된다. (AC-S1-5)
  - [ ] `storageError.code`가 `PARSE_ERROR` 또는 `SCHEMA_MISMATCH`이면 AlertDialog가 아래 문구로 표시된다. (AC-11, AC-12)
    - 제목: “데이터를 불러올 수 없어요”
    - 본문: “저장된 데이터가 손상되었어요. 초기화하면 다시 사용할 수 있어요.”
    - 버튼: “초기화” 탭 시 `resetAll()` 호출
  - [ ] “오늘 참았어요” 버튼으로 `createCheckIn` 호출 시 `INVALID_REF`가 throw 되면 AlertDialog가 아래 문구로 표시되고, CheckIn이 저장되지 않는다. (AC-F3-7)
    - 제목: “체크인할 수 없어요”
    - 본문: “습관이 없거나 비활성화되어 있어요.”
- Covers: [AC-S1-1, AC-S1-2, AC-S1-3, AC-S1-4, AC-S1-5, AC-S1-6, AC-11, AC-12, AC-F3-7]
- Files: [`src/pages/HomePage.tsx`]
- Depends on: [Task 2.4]

---

### Task 3.3 S2 습관 생성 `/habit/new`
- Description:
  - 카테고리 BottomSheet(6개 고정), 제목/금액 입력, 저장 검증(순서 고정), 저장 시 blur를 구현한다.
- DoD:
  - [ ] 카테고리 선택 BottomSheet에 6개 고정 값이 존재한다: `smoking, coffee, delivery, alcohol, impulse, etc`
  - [ ] 금액 입력 `TextField`가 `inputMode="numeric"`이다.
  - [ ] 저장 버튼 탭 시 포커스된 입력이 있으면 `blur()`가 호출된다.
  - [ ] 검증 순서가 아래와 동일하며, 1회 저장 시도에서 **첫 에러 1개만** Toast로 표시된다. (AC-S2-*)
    1) category 미선택
    2) unitPriceKRW 파싱 불가/미입력
    3) unitPriceKRW 범위(1..1,000,000) 위반
    4) title 자동대체 후 title 길이(1..20, trim) 위반
  - [ ] title이 비어있거나 공백만 있으면 카테고리 기본 라벨로 대체되어 저장된다.
  - [ ] 성공 시 Habit이 생성되고 화면 전환(`/` 또는 뒤로가기)이 발생한다.
- Covers: [AC-S2-1, AC-S2-2, AC-S2-3, AC-S2-4, AC-S2-5, AC-S2-6, AC-S2-7, AC-S2-8, AC-S2-9, AC-S2-10, AC-S2-11, AC-S2-12]
- Files: [`src/pages/HabitNewPage.tsx`]
- Depends on: [Task 2.4]

---

### Task 3.4 S3 습관 수정 `/habit/:habitId/edit`
- Description:
  - 습관 로드/수정(제목/단가), `Switch`(활성/비활성) 로컬 토글, 저장 버튼, 삭제 확인 AlertDialog, not found 처리를 구현한다.
- DoD:
  - [ ] `habitId`에 해당하는 Habit이 없으면 “존재하지 않는 습관이에요” 문구 + “홈으로” 버튼이 보이며, 버튼 탭 시 `/`로 이동한다.
  - [ ] `Switch` 토글은 즉시 저장하지 않고 화면 로컬 상태만 변경한다.
  - [ ] “저장” 버튼 탭 시에만 `updateHabit`이 호출되어 실제 저장된다.
  - [ ] “삭제” 버튼 탭 시 확인 `AlertDialog`가 열리고, 확인 탭 시 `deleteHabit(habitId)` 실행 후 `/`로 이동한다.
- Covers: [AC-S3-1, AC-S3-2, AC-S3-3, AC-S3-4, AC-S3-5, AC-S3-6, AC-S3-7, AC-S3-8, AC-S3-9, AC-S3-10]
- Files: [`src/pages/HabitEditPage.tsx`]
- Depends on: [Task 2.4]

---

### Task 3.5 S4 목표 설정 `/goal`
- Description:
  - 목표 이름/금액 입력 + 유효성 검증 후 active goal upsert를 구현한다.
- DoD:
  - [ ] 금액 입력 `TextField`가 `inputMode="numeric"`이다.
  - [ ] 저장 시 title( trim 후 1..20 ) 또는 targetAmountKRW(정수, 1000..100000000) 위반이면 Toast 1개를 표시하고 저장하지 않는다.
  - [ ] 성공 시 `upsertActiveGoal()` 호출 후 화면 전환(`/` 또는 뒤로가기)이 발생한다.
- Covers: [AC-S4-1, AC-S4-2, AC-S4-3, AC-S4-4, AC-S4-5, AC-S4-6, AC-S4-7, AC-S4-8]
- Files: [`src/pages/GoalPage.tsx`]
- Depends on: [Task 2.4]

---

### Task 3.6 S5 주간 리포트 `/report` (보상형 광고 게이트)
- Description:
  - 리포트 상세 영역을 `<TossRewardAd>`로 감싸서 게이트한다.
  - (MVP) 주간 누적 절약액(합계)을 표시한다.
- DoD:
  - [ ] 페이지에 `Top`이 렌더링된다.
  - [ ] “리포트 상세” 콘텐츠가 `<TossRewardAd>` 하위에 렌더링된다. (게이트 패턴 준수)
  - [ ] `<TossRewardAd>` 하위 콘텐츠에 “이번 주 누적 절약액”이 숫자로 표시된다(합계 계산 결과가 0이어도 표시).
- Covers: []  
- Files: [`src/pages/ReportPage.tsx`]
- Depends on: [Task 2.4]

---

### Task 3.7 S6 배지 보관함 `/badge`
- Description:
  - `streak_7` 배지 상태(잠김/획득) 표시 및 “잠금 해제” 진입 버튼을 구현한다.
- DoD:
  - [ ] 페이지 진입 시 badges 데이터가 비어 있어도 크래시 없이 렌더링된다.
  - [ ] `streak_7`이 잠김(`unlockedAt === null`)이면 “잠금 해제” 버튼이 보이고, 탭 시 `/badge/unlock`로 `navigate(path, { state: { badgeId: 'streak_7' } })`가 호출된다. (RouteState 준수)
  - [ ] `streak_7`이 획득(`unlockedAt !== null`)이면 획득 완료 상태로 표시된다.
- Covers: []
- Files: [`src/pages/BadgePage.tsx`]
- Depends on: [Task 2.4]

---

### Task 3.8 S7 배지 잠금 해제 `/badge/unlock` (보상형 광고 게이트 + 재언락 409 Toast)
- Description:
  - `location.state`에서 badgeId를 읽고, `<TossRewardAd>` 게이트 뒤에서 `unlockBadge()`를 수행한다.
  - 이미 획득한 배지면 **409 처리(Toast “이미 획득한 배지예요”)**를 구현한다.
- DoD:
  - [ ] `const state = location.state as RouteState["/badge/unlock"]`로 state를 읽는다.
  - [ ] `state?.badgeId`가 없으면 `/badge`로 이동한다.
  - [ ] 언락 완료(결과) 영역이 `<TossRewardAd>` 하위에 렌더링된다. (게이트 패턴 준수)
  - [ ] 이미 획득 상태에서 `unlockBadge('streak_7', nowISO)`가 `StorageError(code='DUPLICATE')`로 실패하면 아래를 만족한다. (AC-F6-6)
    - `Toast` 텍스트가 정확히 “이미 획득한 배지예요”
    - 저장된 `unlockedAt` 값이 변경되지 않는다.
- Covers: [AC-F6-6]
- Files: [`src/pages/BadgeUnlockPage.tsx`]
- Depends on: [Task 2.4]

### Risk Analysis (Epic 3)
- Complexity: Medium
- Risk factors:
  - `location.state` 무타입 접근으로 런타임 오류
  - 에러/문구 불일치로 검수 반려
  - TDS 간격을 커스텀 스타일로 덮어써 UI 깨짐
- Mitigation:
  - 1태스크=1페이지로 격리 + RouteState 강제
  - 홈/언락 페이지에 “고정 문구”를 DoD로 명시하여 누락 방지

---

## Epic 4. Integration + polish (routing wiring, guard, final UX)

### Task 4.1 라우팅 연결 + 세션/실행환경 가드(401) 전역 적용
- Description:
  - 모든 라우트를 연결하고, 앱 시작 시 `getIsTossLoginIntegratedService()`를 **try/catch로 1회 호출**하여 throw면 어떤 경로로 들어와도 S0 차단 화면만 렌더링한다.
- DoD:
  - [ ] 앱 초기 마운트 시 `getIsTossLoginIntegratedService()`를 try/catch로 1회 호출한다.
  - [ ] 호출이 throw이면 현재 URL과 무관하게 `BlockingPage`만 렌더링된다. (AC-S0-1)
  - [ ] throw이 아니면 아래 라우트가 렌더링 가능하다.
    - `/`, `/habit/new`, `/habit/:habitId/edit`, `/goal`, `/report`, `/badge`, `/badge/unlock`
  - [ ] `AppStoreProvider`가 라우터 상위(또는 필요한 상위)에 연결되어, 홈에서 hydration/state 사용이 가능하다.
- Covers: [AC-S0-1]
- Files: [`src/App.tsx`, `src/main.tsx`]
- Depends on: [Task 3.1, Task 3.2, Task 3.3, Task 3.4, Task 3.5, Task 3.6, Task 3.7, Task 3.8]

---

### Task 4.2 전역 폴리시: QUOTA_EXCEEDED(507) 토스트 처리(앱 크래시 방지)
- Description:
  - 저장 시 `StorageError(code='QUOTA_EXCEEDED')`가 발생할 수 있으므로, 공통 처리로 앱이 크래시하지 않게 하고 Toast를 노출한다.
  - 구현 위치는 `AppStore` 또는 공통 error handler(예: `src/lib/store/errors.ts`)로 두며, **페이지 파일 수정 없이도 동작**하도록 한다.
- DoD:
  - [ ] `set*()` 또는 뮤테이션 호출 중 `StorageError(code='QUOTA_EXCEEDED')`가 throw 되어도 앱이 크래시하지 않는다.
  - [ ] `QUOTA_EXCEEDED` 발생 시 Toast 1개가 표시된다. (문구는 자유)
  - [ ] 이 변경으로 `HomePage.tsx`, `BadgeUnlockPage.tsx`, `src/lib/types.ts`를 수정하지 않는다. (파일 충돌 방지)
- Covers: []
- Files: [`src/lib/store/AppStore.tsx` **or** `src/lib/store/errors.ts`(신설)]
- Depends on: [Task 2.4, Task 4.1]

### Risk Analysis (Epic 4)
- Complexity: Low ~ Medium
- Risk factors:
  - 가드 적용 타이밍 문제로 잠깐 다른 화면이 보이는 플래시
  - Quota 에러 미처리로 앱이 예외로 중단
- Mitigation:
  - App 루트에서 가드 판정 후 조건부 라우터 렌더로 플래시 방지
  - 507 처리를 전역으로 모아 페이지별 누락 리스크 감소

---

## AC Coverage
- Total ACs in SPEC: **41**
  - AC-S0-1 (1)
  - AC-S1-1..6 (6)
  - AC-S2-1..12 (12)
  - AC-S3-1..10 (10)
  - AC-S4-1..8 (8)
  - AC-11, AC-12 (2)
  - AC-F3-7 (1)
  - AC-F6-6 (1)
- Covered by tasks: **41**
  - AC-S0-1: Task 1.1, 3.1, 4.1
  - AC-S1-1..6: Task 1.1, 2.3, 3.2
  - AC-S2-1..12: Task 1.1, 3.3
  - AC-S3-1..10: Task 1.1, 3.4
  - AC-S4-1..8: Task 1.1, 3.5
  - AC-11: Task 1.1, 2.1, 2.2, 2.3, 3.2
  - AC-12: Task 1.1, 2.3, 3.2
  - AC-F3-7: Task 1.1, 2.4, 3.2
  - AC-F6-6: Task 1.1, 2.4, 3.8
- Uncovered: **0**