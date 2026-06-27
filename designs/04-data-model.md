# Firestore 데이터 모델 (통합)

> 흩어진 스키마를 한 곳에 모은 정본. 진행 페이지(`03-display-design.md`)는 이 모델을 읽어 그린다.
> 관련: `00-overview.md`, `01-auth-design.md`, `02-admin-design.md`.

## 1. 컬렉션 개요

| 컬렉션/문서 | 종류 | 용도 |
| --- | --- | --- |
| (Remote Config) | Firebase RC | 행사 진행 상태(open/close), 로고, 행사명 — Firestore 아님(§2) |
| `state/current` | 단일 문서 | 실시간 진행 상태(현재 게임·단계·q/w 화면·제시어 배정) |
| `users/{name}` | 컬렉션 | 참가자·운영자 계정 |
| `teams/{teamId}` | 컬렉션(3개) | 팀 표시 메타(이름·색). **점수는 저장 안 함** |
| `games/{gameId}` | 컬렉션(9개) | 게임 정의(유형·배점·설명) |
| `questions/{id}` | 컬렉션 | 퀴즈 문제 |
| `promptSets/{id}` | 컬렉션 | 제시어 묶음 |
| `prompts/{id}` | 컬렉션 | 제시어(묶음 소속) |
| `scoreLog/{id}` | 컬렉션 | **모든 점수 변경의 단일 출처**(append-only + void) |

## 2. 행사 상태 (Firebase Remote Config)

Firestore가 아니라 **Remote Config**로 관리한다. 운영자는 Firebase 콘솔에서 값을 토글한다.

```
app_status : 'open' | 'closed'      // 행사 진행 상태
logo_url   : string (선택)           // closed 시 표시할 로고(보노보노 + 바딧불이 야호)
event_name : string = "바딧불이 야호"  // 행사명 기본값
```

- **앱 레벨 게이팅**: `app_status === 'closed'` 면 모든 페이지는 **로고만 표시, 로그인 불가**.
- **웹은 실시간 아님**: 모바일의 `onConfigUpdate` 리스너 미지원. 웹 클라이언트는 `fetchAndActivate`를
  로드 시 + **주기적 폴링**(예: 30~60초, `minimumFetchInterval` 짧게)으로 갱신한다.
  → 콘솔 토글이 즉시 모든 폰에 반영되진 않고 다음 페치 때 반영(open/close는 몇 번뿐이라 허용).
- 앱 내 토글 UI는 없다(클라이언트는 RC를 쓰지 못함). 설정은 콘솔에서만.

## 3. state/current (진행 상태, 단일 문서)

```ts
state/current = {
  currentGameId: string,
  phase: 'intro' | 'playing' | 'result',

  // 퀴즈 진행 엔진 (기능 4)
  currentQuestionId: string | null,
  quizScreen: 'q1' | 'q2' | 'q3',

  // 제시어 진행 엔진 (기능 4-B)
  promptScreen: 'w1' | 'w2' | 'w3' | 'w4' | null,
  promptAssignment: { J: string, I: string, L: string } | null,  // 팀→묶음 랜덤 배정(게임 시작 시 1회 롤)
  promptTeamOrder: ('J' | 'I' | 'L')[] | null,                   // 팀 진행 순서(팀별 일괄)
  currentTeamId: 'J' | 'I' | 'L' | null,
  currentPromptId: string | null,

  // 타이머 (기능 3 / 운영 제어)
  timer: {
    mode: 'countdown' | 'stopwatch' | null,
    status: 'idle' | 'running' | 'paused' | 'finished',
    durationSec?: number,        // countdown
    startedAt?: Timestamp,       // 서버 기준 시작 시각(serverTimestamp)
    accumulatedSec?: number,     // 일시정지 누적(이어재생용)
  },
}
```

- 단일 문서 → 구독 하나로 모든 화면이 동기화되고, 갱신이 원자적이다.
- 현재 게임의 `engineType`에 따라 퀴즈 필드 또는 제시어 필드만 의미를 가진다.
- 게임 전환·시작 시 무관한 엔진 필드는 리셋한다(`02-admin-design.md` §3.4, §4B.4).
- **타이머 동기화 범위(중요)**: `startedAt`은 공통 *시작 기준점*일 뿐, 각 클라이언트는 자기
  `Date.now()`로 경과를 계산하므로 **기기 시계 오차만큼 표시값이 달라질 수 있다**. 본 설계는
  **빔프로젝터 화면을 권위(authoritative)** 로 두고 참가자 폰은 근사치로 본다. 클럭 오프셋
  보정은 범위 밖(필요 시 스냅샷 시점 서버-로컬 skew 측정으로 승격 가능).

## 4. users/{name}

```ts
users/{이름} = {           // docId = 이름(고유키)
  name: string,
  teamId: 'J' | 'I' | 'L',
  nickname: string | null,
  passwordHash: string | null,   // SHA-256, null이면 미가입(B 분기)
  isAdmin: boolean,
}
```

상세 분기 로직은 `01-auth-design.md`.

## 5. teams/{teamId}

```ts
teams/{teamId} = {        // docId = 'J' | 'I' | 'L'
  id: 'J' | 'I' | 'L',
  name: string,           // 표시 이름(편집 가능)
  color: string,          // hex(편집 가능)
}
```

- **점수 필드 없음** — `scoreLog` 유효 항목 합계로 파생(§9).

## 6. games/{gameId}

```ts
games/{gameId} = {
  name: string,
  description: string,             // intro 단계에 표시할 규칙 설명
  scoringExplanation: string,      // "우리 팀 점수 산정 방식" 표시용 문구
  engineType: 'quiz' | 'prompt' | 'none',   // 진행 방식(q엔진/w엔진/일반)
  scoringType: 'quiz' | 'rank' | 'increment' | 'free',  // 점수 방식
  totalPoints?: number,            // 결과 표시·가변형 합계 검증(옵셔널)
  rankPoints?: { 1: number, 2: number, 3: number },
  incrementOptions?: number[],
  rounds?: string[],               // 보드게임 등 세부 종목
  timer?: { mode: 'countdown' | 'stopwatch', durationSec?: number },  // 기본 타이머
  order: number,                   // 진행 순서
}
```

> 타이머 예: 윷놀이 `{mode:'countdown', durationSec:1800}`, 이어서그리기
> `{mode:'countdown', durationSec:1200}`, 릴레이게임 `{mode:'stopwatch'}`.

### 6.1 예시 프리셋(9게임)

게임은 관리자가 직접 CRUD로 만든다(`02-admin-design.md` 기능 9). 아래는 "기본 9게임
불러오기" 프리셋으로 생성되는 초기값이며, 생성 후 관리자가 자유롭게 편집한다.

| gameId | name | engineType | scoringType | 배점 |
| --- | --- | --- | --- | --- |
| `quiz` | 퀴즈 | quiz | quiz | 문제당 10 |
| `charades` | 릴레이 몸으로 말해요 | prompt | increment | 정답당(설정) |
| `draw-relay` | 이어서 그리기 | prompt | increment | +50 |
| `liar` | 라이어게임 | none | free | totalPoints 옵셔널 |
| `snack-taste` | 과자 맞추기(미각) | none | increment | +20 |
| `yut` | 윷놀이+훈민정음 | none | rank | 200/100/50 |
| `board` | 보드게임 | none | rank(×3 rounds) | 라운드별 100/50/10 |
| `relay` | 릴레이 게임 | none | rank | 200/100/50 |
| `bottlecap` | 병뚜껑 컬링 | none | free | 자유 |

> 몸으로말해요·이어서그리기는 제시어 엔진(`prompt`, w1~w4)을 쓰며 w4 정답 시 즉시 가산(`increment`).
> 미정 배점(라이어·병뚜껑)은 `free` + `totalPoints` 옵셔널.

## 7. 퀴즈 문제 / 제시어

```ts
questions/{id} = {
  gameId: 'quiz',
  category: '과자이름' | '초성' | '확대샷' | '노래' | '영화',
  kind: 'practice' | 'real',
  promptText?: string,
  promptImage?: { s3Key: string, url: string, expiresAt: number },
  answerText?: string,
  answerImage?: { s3Key: string, url: string, expiresAt: number },
  points: number,
  used: boolean,
  order: number,
}

promptSets/{id} = { gameId: string, label?: string, order: number }
prompts/{id}    = { setId: string, text: string, category: string, order: number }
```

이미지는 S3 + Lambda presigned 파이프라인(`02-admin-design.md` 4.7).

## 8. scoreLog/{id} (점수 단일 출처)

```ts
scoreLog/{id} = {
  gameId: string,
  teamId: 'J' | 'I' | 'L',
  points: number,            // 음수 가능(가변형 뚜기)
  userId?: string,           // 퀴즈 정답자(개인 집계)
  questionId?: string,       // 퀴즈 문제
  promptId?: string,         // 제시어 게임 정답 제시어
  round?: string,            // 세부 라운드 라벨
  rank?: 1 | 2 | 3,          // 순위형
  voided: boolean,           // 되돌리기 시 true
  createdBy: 'admin',
  createdAt: Timestamp,      // serverTimestamp
}
```

- **append-only**: 점수는 추가만, 정정은 `voided` 토글(기능 7).
- **중복 방지(멱등) docId 규약**(`02-admin-design.md` §7.5):
  - 퀴즈 `${gameId}__${questionId}__${userId}` · 제시어 `${gameId}__${promptId}__${teamId}` ·
    순위 `${gameId}__${round||'main'}__${teamId}` · 가변 `${gameId}__free__${teamId}` → **`set`(멱등)**.
  - 누적(increment)만 반복 가산이 정상이라 **auto-id `add`** + 버튼 디바운스.

## 9. 파생값 (저장하지 않는 계산값)

| 값 | 계산식 |
| --- | --- |
| 팀 총점 | `Σ points where teamId=T and voided=false` |
| 게임별 팀 점수 | `Σ points where gameId=G and teamId=T and voided=false` |
| 개인 맞춘 문제 | `scoreLog where userId=U and gameId='quiz' and voided=false` |
| 팀별 맞춘 갯수 | `count scoreLog where gameId='quiz' group by teamId (voided=false)` |

- 클라이언트는 `scoreLog`를 구독해 합계를 계산(이벤트 규모상 수백 건 → 성능 무리 없음).

## 10. 필요한 복합 인덱스 (Firestore)

| 쿼리 | 인덱스 |
| --- | --- |
| 게임별 유효 점수 | `gameId` + `voided` |
| 팀별 유효 점수 | `teamId` + `voided` |
| 개인 퀴즈 집계 | `userId` + `gameId` + `voided` |
| 최근 기록(되돌리기) | `voided` + `createdAt desc` |

> 전체 `scoreLog`를 구독해 클라이언트에서 합산하면 인덱스 최소화 가능. 규모 작으면 단순 구독 권장.

## 11. ID 전략

| 컬렉션 | docId |
| --- | --- |
| `users` | 이름(고유키) |
| `teams` | `J` / `I` / `L` |
| `games` | 의미 슬러그(`quiz`, `board` 등) |
| `questions`·`prompts`·`promptSets` | 자동 ID |
| `scoreLog` | 멱등 부여는 결정적 docId, 누적형만 자동 ID (§8) |
| `state` | 고정(`current`) |

> 행사 상태는 Firestore가 아니라 **Remote Config**(§2). `config/app` 같은 Firestore 문서는 없다.

## 12. 보안 규칙 (앱 레벨 게이팅 전제)

```
// 의사 규칙 — 이벤트 기간
match /{document=**} {
  allow read: if true;
  allow write: if true;   // 접근 제어는 Remote Config app_status(open/close)로 앱에서 수행
}
```

- `closed`면 클라이언트가 로고만 렌더(로그인·조작 차단).
- 행사 종료 후에는 콘솔에서 쓰기 규칙을 `false`로 잠가 동결.

## 13. 행사 open/close 운영

- **Firebase 콘솔의 Remote Config**에서 `app_status`를 `open`/`closed`로 토글(§2).
- 앱 내 토글 UI는 없음. close 시 전체 페이지가 로고 화면으로 전환(다음 RC 페치 시점).
