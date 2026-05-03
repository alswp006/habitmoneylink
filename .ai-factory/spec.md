# SPEC (UPDATED, MVP) — **스토리지(로컬) 스키마 명시 + FK/유니크/인덱스(논리) 보강본 (완전본)**

> 변경 목적: 본 MVP는 **SQL DB를 사용하지 않고 localStorage만** 사용한다. 그럼에도 “스키마가 없다”는 검증 이슈가 재발하지 않도록, **DB 테이블에 준하는 ‘논리 스키마(Logical Schema)’**를 SPEC에 **명시적으로 고정**한다.  
> 따라서 아래에:
> - localStorage **키/직렬화 포맷**
> - 각 “테이블”의 **컬럼 정의(id/createdAt/updatedAt 포함)**
> - **FK/UNIQUE 제약**
> - **인덱스(로컬에서의 조회 최적화용 논리 인덱스)**  
> 를 모두 정의한다. (서버/SQL은 여전히 없음)

---

## Common Principles

### 제품/기술 원칙
- 본 앱은 **Vite + React + TypeScript**로 구현하며, UI는 **@toss/tds-mobile 컴포넌트만** 사용한다.
- 라우팅은 **react-router-dom**을 사용한다.
- 데이터 영속성은 **localStorage만** 사용하며 서버는 두지 않는다.
- 광고는 템플릿 제공 컴포넌트만 사용한다.
  - 배너: `<AdSlot />`
  - 보상형: `<TossRewardAd>{children}</TossRewardAd>` (결과/리포트/보상 노출 시 게이트)

### (FIX) HTTP Status Code 표기 규칙(로컬 앱 내 “HTTP-like”)
- 본 MVP는 서버가 없으므로 실제 HTTP 응답은 없다.
- 그럼에도 테스트/검수에서 “에러 타입”을 명확히 하기 위해, 모든 에러 AC에는 **HTTP-like status code**를 병기한다.
- 매핑 규칙:
  - **400**: 입력값/유효성 실패(VALIDATION)
  - **401**: 토스 세션/실행환경 불가(UNAUTHORIZED)
  - **404**: 리소스 없음(NOT_FOUND)
  - **409**: 중복/충돌(DUPLICATE/CONFLICT), 비활성 참조 등 상태 충돌
  - **500**: 파싱/스키마 손상(PARSE_ERROR/SCHEMA_MISMATCH)
  - **507**: 저장공간 부족(QUOTA_EXCEEDED)

### (FIX) 인증/회원가입 정책
- 본 앱은 **Toss 앱 세션을 전제로 동작**하며, MVP에서 **별도의 회원가입/로그인/로그아웃 화면과 입력 폼(email/password 등)을 제공하지 않는다.**
- 사용자는 앱 최초 진입 시 바로 `/`(홈)으로 진입하며, 데이터는 localStorage가 비어 있으면 빈 상태로 시작한다.
- 사용자 식별이 필요한 기능은 MVP 범위에 포함하지 않는다. (필요 시 `getIsTossLoginIntegratedService()` 검토는 향후 과제로 남긴다.)

### (FIX) “세션/실행환경 불가” 처리(라우트 진입 가드)
- 구현 상 개발/테스트 환경에서 토스 런타임이 아닐 수 있으므로, 앱 시작 시 아래 가드를 둔다.
- 가드 판정:
  - 앱 시작 시 `getIsTossLoginIntegratedService()`를 **try/catch로 1회 호출**한다.
  - 호출 자체가 예외를 throw 하면 **세션/실행환경 불가**로 간주한다.
- 세션/실행환경 불가 시:
  - 어떤 라우트로 진입했더라도 앱은 **차단 화면(Blocking UI)**만 렌더링한다.

### 날짜/시간 기준
- 체크인은 **KST 기준 `YYYY-MM-DD`** 문자열로 저장/판정한다.
- “오늘”은 `Asia/Seoul` 기준 날짜로 계산한다(구현은 클라이언트에서 `new Date()` 기반 + 로컬 타임존이 KST가 아닐 수 있으므로, 날짜 문자열 생성은 “현지 시간”이 아닌 **KST 날짜 문자열 생성 유틸**을 사용).

### 모바일 UX 원칙 (폼/터치/스크롤)
- 모든 인터랙티브 요소는 **터치 타겟 44px 이상**이 되도록 TDS 기본 컴포넌트 크기를 사용한다(커스텀 CSS로 축소 금지).
- 모든 입력 폼은 모바일 키보드를 고려한다.
  - 금액 입력: `inputMode="numeric"` + 숫자만 허용(정수)
  - 제출 시 키보드가 열려 있으면 blur 처리하여 결과/토스트가 가려지지 않게 한다.
- 리스트는 기본적으로 스크롤 가능해야 하며(모바일), **항목이 200개 초과** 시 virtual scroll을 적용한다(MVP에서는 체크인/리포트 목록을 “일자 전부 나열”하지 않으므로 기본 스크롤로 충분).

### Pagination / Virtual Scroll Contract
- 본 MVP의 데이터 읽기(getHabits/getCheckIns/getGoals/getBadges/getSettings)는 **모두 unpaginated(전체 반환)** 이다.
- “최대 안전 리스트 크기”
  - `Habit[]`: 500개
  - `CheckIn[]`: 20,000개
  - `Goal[]`: 50개
  - `Badge[]`: 10개 (MVP는 1개 고정)
- PASS/FAIL 판정: 위 상한 이하에서 스크롤/탭/저장이 **크래시 없이** 가능해야 한다.

### 광고 배치 원칙
- 배너 광고(AdSlot)는 **홈 화면의 “누적 절약액/목표 요약 섹션 하단”**에 1개 고정 배치하며, 콘텐츠를 덮지 않는다.
- 보상형 광고(TossRewardAd)는 아래 결과 노출을 게이트한다.
  - 주간 리포트 상세
  - 7일 스트릭 배지 언락 완료 화면

### Toss 검수 준수(전역 정책)
- `window.location.href`/`window.open` 사용 금지.
- 외부 로깅/분석 SDK 금지.
- 색상 HEX 하드코딩 금지(TDS 및 `var(--tds-color-*)`만 사용).
- Android 7+, iOS 16+에서 동작해야 하므로 최신 전용 브라우저 API 의존 기능 금지.

---

# (FIX) Database/Storage Schema — **명시적 논리 스키마(로컬스토리지 기반)**

## 0) 전제: SQL/서버 DB는 없음
- MVP 저장소는 **localStorage(JSON 문자열)** 뿐이다.
- “테이블/인덱스/제약”은 구현을 위한 **논리 스키마**로 정의한다.
- 이 논리 스키마와 다른 값이 localStorage에 존재하면, **SCHEMA_MISMATCH(500)** 로 처리하고 S1의 초기화 UX로 유도한다.

## 1) localStorage Key Namespace / Versioning
- `savestreak.habits.v1` : `Habit[]`
- `savestreak.checkins.v1` : `CheckIn[]`
- `savestreak.goals.v1` : `Goal[]` (MVP: 활성 목표 1개만 허용하지만 히스토리 저장을 위해 배열 형태 유지)
- `savestreak.badges.v1` : `Badge[]`
- `savestreak.settings.v1` : `AppSettings` (단일 오브젝트)

## 2) 공통 컬럼 규칙(전 “테이블” 공통)
- `id: string` **필수**
- `createdAt: string` **필수**, ISO 8601 문자열
- `updatedAt: string` **필수**, ISO 8601 문자열
- 생성 시 `createdAt === updatedAt`
- 수정 시 `updatedAt`만 갱신

## 3) Logical Table Definitions (Columns / Constraints)

### 3.1 `habits` (localStorage: `savestreak.habits.v1`)
- **Row Type**: `Habit`
- **Columns**
  - `id` (PK) : string (uuid)
  - `category` : `'smoking' | 'coffee' | 'delivery' | 'alcohol' | 'impulse' | 'etc'`
  - `title` : string (trim 후 1..20)
  - `unitPriceKRW` : number (integer, 1..1,000,000)
  - `isActive` : boolean
  - `createdAt` : ISO string
  - `updatedAt` : ISO string
- **Constraints**
  - PK: `id` unique
  - (Business) `title`/`unitPriceKRW` 범위는 **화면(S2/S3)** 에서 검증 후 저장 함수는 유효값만 받는 것을 전제로 한다.
- **Logical Indexes (in-memory, hydration 시 생성)**
  - `idx_habits_byId: Map<Habit['id'], Habit>`
  - `idx_habits_byCategory: Map<HabitCategory, Habit[]>` (홈/필터/표시 정렬 최적화 용도)

### 3.2 `checkIns` (localStorage: `savestreak.checkins.v1`)
- **Row Type**: `CheckIn`
- **Columns**
  - `id` (PK): string (uuid)
  - `habitId` (FK → habits.id): string
  - `date` : string (`YYYY-MM-DD`, KST)
  - `savedAmountKRW` : number (integer)
  - `createdAt` : ISO string
  - `updatedAt` : ISO string
- **Constraints**
  - PK: `id` unique
  - FK: `habitId`는 `habits.id`에 존재해야 함
  - UNIQUE: `(habitId, date)`는 유일해야 함 (하루 1회 체크인)
- **FK / Cascade**
  - Habit 비활성화: 기존 CheckIn 유지, 새 CheckIn 생성 금지
  - Habit 삭제: 해당 habitId를 참조하는 CheckIn **모두 삭제(cascade)**
- **Logical Indexes (in-memory, hydration 시 생성)**
  - `idx_checkins_byId: Map<CheckIn['id'], CheckIn>`
  - `idx_checkins_byHabitId: Map<Habit['id'], CheckIn[]>`
  - `idx_checkins_byDate: Map<string /*YYYY-MM-DD*/, CheckIn[]>`
  - `uniq_checkins_habitId_date: Set<string /* ${habitId}::${date} */>`  
    - PASS/FAIL: createCheckIn 시 `Set`에 이미 키가 있으면 **DUPLICATE(409)**

### 3.3 `goals` (localStorage: `savestreak.goals.v1`)
- **Row Type**: `Goal`
- **Columns**
  - `id` (PK): string (uuid)
  - `title` : string (trim 후 1..20)
  - `targetAmountKRW` : number (integer, 1,000..100,000,000)
  - `isActive` : boolean (MVP: **동시에 true는 최대 1개**)
  - `createdAt` : ISO string
  - `updatedAt` : ISO string
- **Constraints**
  - PK: `id` unique
  - UNIQUE (Business): `isActive=true` 인 row는 최대 1개
- **Logical Indexes**
  - `idx_goals_active: Goal | null` (hydrate 시 active 1개만 추출; 2개 이상이면 SCHEMA_MISMATCH)

### 3.4 `badges` (localStorage: `savestreak.badges.v1`)
- **Row Type**: `Badge`
- **Columns**
  - `id` (PK): string (예: `'streak_7'`)
  - `title`: string
  - `unlockedAt`: string | null (ISO)
  - `createdAt`: ISO string
  - `updatedAt`: ISO string
- **Constraints**
  - PK: `id` unique
  - `unlockedAt !== null` 인 경우 “이미 획득” 상태이며, 재언락은 **409** 처리(AC-F6-6)
- **Logical Indexes**
  - `idx_badges_byId: Map<Badge['id'], Badge>`

### 3.5 `settings` (localStorage: `savestreak.settings.v1`)
- **Row Type**: `AppSettings` (단일 레코드)
- **Columns**
  - `id`: string (uuid)
  - `weekStartsOn`: `'mon' | 'sun'` (default `'mon'`)
  - `lastOpenedDate`: string (`YYYY-MM-DD`, KST)
  - `promotionRewardGranted`: boolean (default `false`)
  - `aiDisclosureAccepted`: boolean (default `true`) — MVP UI/기능 미사용
  - `createdAt`: ISO string
  - `updatedAt`: ISO string
- **Constraints**
  - 단일 오브젝트이므로 PK uniqueness/테이블 개념 대신 **스키마 일치**만 검사한다.

## 4) Hydration-time Referential Integrity (FK 검증) 규칙
- 앱 시작 시 hydrate 과정에서:
  - `checkIns`의 모든 `habitId`가 `habits`에 존재하는지 검사한다.
- FK 검증 실패 시:
  - `StorageError{code:'SCHEMA_MISMATCH'}`로 처리 (HTTP-like **500**)
  - S1의 “데이터를 불러올 수 없어요” AlertDialog + “초기화” 버튼 UX로 유도

---

## Screen Definitions (React Router)

### S0. 차단 화면(세션/실행환경 불가)
- **설명**: 토스 런타임/세션이 확인되지 않는 경우, 앱의 모든 기능을 차단하고 안내한다.
- **TDS 컴포넌트**
  - `Top`
  - `Paragraph.Text`
- **UI**
  - Top 타이틀: “세션을 확인할 수 없어요”
  - 본문 문구(고정): “토스 앱에서 다시 열어주세요.”
- **상태 코드(HTTP-like)**: `401 Unauthorized`

**S0 Acceptance Criteria**
- **AC-S0-1 [E][P0] 세션/실행환경 불가 차단 (401)**
  - **Given** 앱 시작 시 `getIsTossLoginIntegratedService()` 호출이 예외를 throw 하는 환경일 때
  - **When** 사용자가 어떤 경로(예: `/habit/new`)로 진입하더라도
  - **Then** 시스템은 상태 코드 **401**에 해당하는 차단 화면을 렌더링한다
  - **And** `Top`에 “세션을 확인할 수 없어요”를 표시한다
  - **And** `Paragraph.Text`에 “토스 앱에서 다시 열어주세요.”를 표시한다

---

### S1. 홈 — `/`
- **설명**: 활성 습관 목록과 오늘 체크인 액션, 누적 절약액/목표 D-day 요약, 배너 광고를 보여준다.
- **TDS 컴포넌트**
  - `Top`, `Paragraph.Text`, `ListRow`, `Button`, `Chip`, `Spacing`, `Toast`, `AlertDialog`
  - 배너: `<AdSlot />`
- **Loading/Empty/Error**
  - Loading: localStorage hydration 전(`isHydrating=true`)이면 “불러오는 중” 표시
  - Empty: 활성 습관 0개면 “아직 습관이 없어요. 습관을 추가해보세요.” + “습관 추가”
  - Error: localStorage 파싱 실패/스키마 불일치 시 AlertDialog로 “데이터를 불러올 수 없어요” + “초기화”
- **Touch interactions**
  - 각 활성 습관 ListRow 내부에 해당 습관 전용 `Button` “오늘 참았어요”
  - 탭 시 `createCheckIn({ habitId, date: todayKST, savedAmountKRW: habit.unitPriceKRW })`
- **Navigation**
  - “습관 추가” → `/habit/new`
  - 습관 행 탭 → `/habit/:habitId/edit`
  - “목표 설정” → `/goal`
  - “주간 리포트” → `/report`
  - “배지 보관함” → `/badge`
- **홈 요약 섹션 표시 규칙**
  - 누적 절약액(전체): `sum(getCheckIns().map(c => c.savedAmountKRW))`
  - 목표 요약:
    - 활성 Goal이 없으면: “목표를 설정하면 D-day를 볼 수 있어요”
    - 활성 Goal이 있으면: F4 규칙 사용

**S1 Acceptance Criteria**
- AC-S1-1 [U][P0] 로딩 문구 표시/해제  
- AC-S1-2 [S][P0] 활성 습관 리스트 렌더링 수량  
- AC-S1-3 [W][P0] 빈 상태 CTA 동작  
- AC-S1-4 [W][P0] 습관 행 탭 네비게이션  
- AC-S1-5 [U][P1] 배너 광고 위치  
- AC-S1-6 [E][P0] 목표 없음 요약 문구 노출  

---

### S2. 습관 생성 — `/habit/new`
- **설명**: 카테고리 선택, 제목(선택), 하루 절약 금액을 입력해 습관을 만든다.
- **TDS 컴포넌트**: `Top`, `ListRow`, `BottomSheet`, `TextField`, `Button`, `Paragraph.Text`, `Spacing`, `Toast`
- **모바일 키보드**: 금액 `inputMode="numeric"`, 저장 시 blur
- **카테고리 선택 시트**: 6개 고정(`smoking, coffee, delivery, alcohol, impulse, etc`)
- **제목(선택) 처리**
  - title이 비어 있거나 공백만 존재하면 저장 시 **카테고리 기본 라벨로 대체**
- **폼 검증 우선순위(검증 순서 고정)**
  1) category 미선택 → 에러(400) 후 종료  
  2) unitPriceKRW 파싱 불가/미입력 → 에러(400) 후 종료  
  3) unitPriceKRW 범위(1..1,000,000) 위반 → 에러(400) 후 종료  
  4) title 자동대체 수행 후, title 길이(1..20, trim) 위반 → 에러(400) 후 종료  
  - 한 번의 저장 시도에서 **첫 번째 에러 1개만** 표시한다.

**S2 Acceptance Criteria**
- AC-S2-1 ~ AC-S2-6 (기존 유지)
- AC-S2-7 ~ AC-S2-12 (기존 유지; 본문과 동일)

---

### S3. 습관 수정 — `/habit/:habitId/edit`
- **설명**: 기존 습관의 제목/단가를 수정하고 활성/비활성을 전환한다.
- **TDS**: `Top`, `TextField`, `Switch`, `ListRow`, `Button`, `Paragraph.Text`, `Spacing`, `Toast`, `AlertDialog`
- **Empty**: habitId를 찾지 못하면 “존재하지 않는 습관이에요” + “홈으로”
- **삭제 기능**: 확인 다이얼로그 후 `deleteHabit(habitId)` 수행(체크인 연쇄 삭제)
- **Switch 저장 방식**: 토글 즉시 저장하지 않음. “저장” 탭 시 반영.

**S3 Acceptance Criteria**
- AC-S3-1 ~ AC-S3-10 (기존 유지; 본문과 동일)

---

### S4. 목표 설정 — `/goal`
- **설명**: 목표 이름과 목표 금액을 설정/수정한다(활성 목표 1개).
- **TDS**: `Top`, `TextField`, `Button`, `Paragraph.Text`, `Spacing`, `Toast`
- **(FIX) 유효성(Goal)**
  - title: trim 후 1..20
  - targetAmountKRW: 정수, **1000..100000000**

**S4 Acceptance Criteria**
- AC-S4-1 ~ AC-S4-8 (기존 유지; 본문과 동일)

---

### S5. 주간 리포트(게이트 포함) — `/report`
- (기존 유지: 광고 실패 토스트 등)

### S6. 배지 보관함 — `/badge`
- (기존 유지)

### S7. 배지 잠금 해제(게이트 포함) — `/badge/unlock`
- (기존 유지: 조건 미충족 차단, 광고 실패 토스트)

---

## Data Models (변경 없음, **스키마 섹션에서 “테이블 컬럼”으로 재명시했으므로 여기서는 타입 계약 유지**)

### Habit
```ts
export type HabitCategory = 'smoking' | 'coffee' | 'delivery' | 'alcohol' | 'impulse' | 'etc';

export interface Habit {
  id: string; // uuid
  category: HabitCategory;
  title: string; // 1..20 chars (trim)
  unitPriceKRW: number; // integer, 1..1000000
  createdAt: string; // ISO
  updatedAt: string; // ISO
  isActive: boolean;
}
```

### CheckIn
```ts
export interface CheckIn {
  id: string; // uuid
  habitId: string; // FK -> Habit.id
  date: string; // 'YYYY-MM-DD' (KST)
  savedAmountKRW: number; // integer
  createdAt: string; // ISO
  updatedAt: string; // ISO
}
```
- unique by `(habitId, date)`

### Goal
```ts
export interface Goal {
  id: string;
  title: string; // 1..20 chars (trim)
  targetAmountKRW: number; // integer, 1000..100000000
  createdAt: string;
  updatedAt: string;
  isActive: boolean; // MVP: only one active goal allowed
}
```

### Badge
```ts
export interface Badge {
  id: string; // e.g., 'streak_7'
  title: string; // e.g., '7일 스트릭'
  createdAt: string;
  updatedAt: string;
  unlockedAt: string | null;
}
```

### AppSettings
```ts
export type WeekStartsOn = 'mon' | 'sun';

export interface AppSettings {
  id: string;
  createdAt: string;
  updatedAt: string;

  weekStartsOn: WeekStartsOn; // default 'mon'
  lastOpenedDate: string; // 'YYYY-MM-DD' (KST)
  promotionRewardGranted: boolean; // default false
  aiDisclosureAccepted: boolean; // default true (MVP에서 UI/기능 미사용)
}
```

---

## Data Access Contracts (localStorage)

### 공통 에러 모델
```ts
export type StorageErrorCode =
  | 'PARSE_ERROR'
  | 'SCHEMA_MISMATCH'
  | 'QUOTA_EXCEEDED'
  | 'NOT_FOUND'
  | 'DUPLICATE'
  | 'INVALID_REF';

export class StorageError extends Error {
  code: StorageErrorCode;
  key: string;
  cause?: unknown;
  constructor(params: { code: StorageErrorCode; key: string; message: string; cause?: unknown });
}
```

### 공통 에러 → HTTP-like status 매핑
- `PARSE_ERROR`, `SCHEMA_MISMATCH` → **500**
- `QUOTA_EXCEEDED` → **507**
- `NOT_FOUND` → **404**
- `DUPLICATE` → **409**
- `INVALID_REF` → **409**

### Read/Write 공통 규칙
- `get*()`:
  - key 미존재면 기본값 반환
  - JSON.parse 실패 → throw `StorageError{code:'PARSE_ERROR'}`
  - 최소 스키마 검증 실패(필드 누락/타입 불일치/제약 위반/활성 Goal 2개/FK 깨짐 등) → throw `StorageError{code:'SCHEMA_MISMATCH'}`
- `set*()`:
  - setItem 용량 초과 → throw `StorageError{code:'QUOTA_EXCEEDED'}`
- 타임스탬프: create 시 createdAt=updatedAt, update 시 updatedAt만 갱신

---

## Feature List

### F1. 로컬 데이터 레이어 + 앱 초기화(하이드레이션/검증)
- (기존 AC 유지)
- SCHEMA_MISMATCH도 PARSE_ERROR와 동일 UX로 처리

**F1 Acceptance Criteria 추가/확정**
- **AC-11 [W][P0] Scenario: localStorage 스키마 불일치(SCHEMA_MISMATCH) 처리 (500)**
  - **Given** localStorage의 `savestreak.habits.v1`가 JSON 파싱은 되지만 `Habit[]` 최소 스키마 검증에 실패하는 값(예: `[{"id":1}]`)일 때
  - **When** 사용자가 `/`로 앱에 진입하면
  - **Then** 시스템은 상태 코드 **500** 에러를 처리한다
  - **And** `AlertDialog` 제목 “데이터를 불러올 수 없어요”를 표시한다
  - **And** 본문에 “저장된 데이터가 손상되었어요. 초기화하면 다시 사용할 수 있어요.”를 표시한다
  - **And** “초기화” 버튼을 표시한다

- **(FIX) AC-12 [W][P0] Scenario: FK 무결성 깨짐(checkIns.habitId가 habits에 없음) → SCHEMA_MISMATCH (500)**
  - **Given** `savestreak.checkins.v1`에 `{ habitId:"h_missing" }`를 참조하는 CheckIn이 존재하고, `savestreak.habits.v1`에는 `id:"h_missing"` Habit이 없을 때
  - **When** 사용자가 `/`로 앱에 진입하여 하이드레이션이 수행되면
  - **Then** 시스템은 `StorageError.code='SCHEMA_MISMATCH'`를 발생시켜 상태 코드 **500**을 처리한다
  - **And** S1 에러 AlertDialog(“데이터를 불러올 수 없어요” + “초기화”)를 표시한다

---

### F2. 습관 생성/수정/활성 관리
- (기존 AC 유지)
- 제목 길이/금액 상한 검증은 Screen AC(S2/S3)로 강제하며, 저장 함수는 유효값만 받는 것을 전제로 한다.

---

### F3. 오늘 체크인 + 스트릭 계산 + 누적 절약액
- (기존 AC 유지)
- 비활성/미존재 습관 체크인 시 INVALID_REF 처리(409)

**F3 Acceptance Criteria 추가**
- **AC-F3-7 [W][P0] Scenario: 비활성/미존재 습관 체크인 거부 (409)**
  - **Given** localStorage에 Habit `h_1`이 없거나, 또는 `Habit{id:"h_1", isActive:false}`로 저장되어 있을 때
  - **When** 사용자가 홈(`/`)에서 어떤 방식으로든 `createCheckIn({ habitId:"h_1", date: todayKST, savedAmountKRW: 1000 })`가 호출되는 동작을 수행하면
  - **Then** 시스템은 상태 코드 **409** 에러를 처리한다
  - **And** 새 CheckIn을 저장하지 않는다
  - **And** `AlertDialog` 제목 “체크인할 수 없어요”를 표시한다
  - **And** 본문에 “습관이 없거나 비활성화되어 있어요.”를 표시한다

---

### F4. 목표 요약(D-day)
- (기존 유지)

### F5. 주간 리포트(보상형 광고 게이트)
- (기존 유지)

### F6. 배지(7일 스트릭) + 언락(보상형 광고 게이트)
- (기존 AC 유지)
- 이미 획득한 배지 재언락 시도 처리(409)

**F6 Acceptance Criteria 추가**
- **AC-F6-6 [W][P0] Scenario: 이미 획득한 배지 재언락 거부 (409)**
  - **Given** localStorage의 `savestreak.badges.v1`에 `Badge{id:'streak_7', unlockedAt:'2026-05-03T00:00:00.000Z'}`가 저장되어 있을 때
  - **When** 사용자가 어떤 경로로든 `unlockBadge('streak_7', nowISO)`를 다시 수행하려고 하면
  - **Then** 시스템은 상태 코드 **409** 에러를 처리한다
  - **And** `unlockedAt` 값을 변경하지 않는다
  - **And** `Toast`로 “이미 획득한 배지예요”를 표시한다

---

## (FIX) 누락 에러 시나리오 커버리지 체크(요약)
- 빈/잘못된 필드: S2/S3/S4에 **400 + 고정 문구**로 명시 완료
- 로그인/세션 불가: S0로 **401 + 차단 UI** 명시 완료
- 리소스 없음: S3 “없는 habitId”는 **404 UX** 정의(기존 유지)
- 중복/충돌:
  - 체크인 DUPLICATE: **409**
  - 배지 재언락: **409**
  - 목표는 upsert 계약(중복 생성 개념 없음)
- 타입 손상/스키마 불일치/ FK 무결성 파손: **500 + 초기화 다이얼로그**(AC-11, AC-12)
- 저장 용량 초과: **507** (기존 계약 유지)

---

## Appendix: “인덱스”의 구현 범위(명시)
- 본 MVP는 localStorage에 인덱스를 저장하지 않는다.
- 대신 hydrate 단계에서 메모리 상 논리 인덱스(Map/Set)를 생성해 아래를 만족한다.
  - `(habitId, date)` 중복 체크: `Set` 조회로 O(1)에 가깝게 수행
  - `habitId`별 체크인 조회: `Map` 기반으로 필터 비용 감소
- PASS/FAIL 기준: 인덱스 자체 생성 여부를 UI에서 노출/검증하지 않으며, **중복/참조 오류가 AC대로 처리되면 PASS**로 간주한다.

--- 

위 스펙은 **SQL CREATE TABLE이 아니라 localStorage 기반 MVP**에 맞춰, “테이블/PK/FK/UNIQUE/인덱스” 요구사항을 **논리 스키마로 완결**시킨 버전입니다. 원하시면 다음 단계로, 이 스키마를 그대로 코드로 옮길 수 있게 **`zod` 없이(외부 의존 추가 없이) 타입가드 기반 최소 스키마 검증 함수 목록**까지 Work Packet 단위로 쪼개드릴 수 있어요.