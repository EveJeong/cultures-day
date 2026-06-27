# 바딧불이 야호 — 남은 작업 (TODO)

> 코어 기능은 완료. 남은 건 대부분 **배포·세팅**과 **선택적 폴리시**.
> 설계 참고: `designs/`, 인프라: `designs/05-infra.md`.

## 1. 행사 전 필수 세팅

- [ ] **운영자 비밀번호 변경** — 현재 부트스트랩 기본값 `admin / admin1234`.
      운영 페이지 → 설정 탭 → "운영자 계정"에서 변경.
- [ ] **참가자 등록** — 설정 탭 → 사용자 관리에서 팀별 이름 일괄 등록(한 줄에 하나).
- [ ] **팀 이름·색 확정** — 설정 탭 → 팀 관리 (현재 J팀/I팀/L팀, 기본색).
- [ ] **게임·배점 확정** — 설정 탭 → 게임 관리 (프리셋 9게임 편집 또는 추가).
- [ ] **콘텐츠 등록** — 콘텐츠 탭에서 퀴즈 문제 / 제시어 묶음(게임당 3개) 입력.
- [ ] (선택) `node scripts/reset.mjs` 로 테스트 점수·상태 초기화.

## 2. 배포

- [ ] **Vercel 배포** — 참가자 폰 접속용 공개 URL.
  - `vercel.json` SPA rewrites 확인, 환경변수(`VITE_FIREBASE_*`, `VITE_APP_BASE_URL`) 등록.
  - 배포 URL을 `VITE_APP_BASE_URL`에 넣어야 QR이 올바른 주소를 가리킴.
- [ ] **Firestore 보안 규칙** — 이미 read/write 허용으로 게시됨(이벤트용).
      필요 시 `firestore.rules` CLI 배포(`firebase login` 후 `firebase deploy --only firestore:rules`).

## 3. 이미지 기능 쓸 경우 (선택)

- [ ] **SAM 서명서버 배포** — `signer/README.md` 따라 `sam build && sam deploy --guided`.
  - `ApiSecret`, `BucketName`, `AllowOrigin`(운영 시 Vercel 도메인) 입력.
- [ ] 출력된 `ApiUrl`을 `.env.local`에 설정: `VITE_SIGNER_BASE_URL`, `VITE_SIGNER_SECRET`.
- [ ] 설정되면 콘텐츠 탭 문제 폼에 이미지 업로드가 자동 활성화됨.

## 4. open/close 게이트 쓸 경우 (선택)

- [ ] **Firebase 콘솔 → Remote Config** 에 키 추가:
  - `app_status` = `open` | `closed`
  - `logo_url`(선택), `event_name`(선택, 기본 "바딧불이 야호")
- [ ] 행사 시작 전 `closed`(로고만), 시작 시 `open`.
      ※ 웹은 실시간 아님 → 토글이 다음 페치(~30초) 때 반영.

## 5. 행사 후

- [ ] Firestore 쓰기 규칙을 `false`로 동결(데이터 보존).
- [ ] 서명서버 시크릿 폐기/로테이션, (선택) S3 객체 정리.

## 6. 추가 기능 / 폴리시 (선택, 코딩 필요)

- [ ] **퀴즈 정답자 개인 단위 선택** — 현재 정답을 *팀 단위*로 등록.
      사용자 목록에서 개인 정답자 선택 → 개인 "맞춘 문제" 집계까지 확장 (설계 02 §4.5).
- [ ] **사용자 이름 변경 UI** — `renameUser` 헬퍼는 있으나 화면 버튼 미구현.
- [ ] **결과(result) 화면 연출 강화** — 1등 축하 애니메이션 등.
- [ ] **워드아트/타이포 튜닝** — 외곽선·그림자 강도, 폰트 로딩 폴백.
- [ ] **번들 분할** — firebase 포함 청크 500KB 경고. 필요 시 manualChunks/동적 import.
- [ ] **서명서버 CORS** — 운영 배포 시 `AllowOrigin`을 `*` → Vercel 도메인으로 제한.

## 7. 알려진 제약

- Remote Config는 **프리뷰 iframe**(스토리지 제약)에선 비활성 → 기본 `open`으로 동작.
  실제 브라우저/배포에선 정상.
- 인증/시크릿은 클라이언트 단 보호("장난 방지" 수준) — 사내 1일 이벤트 전제 (설계 01 §8, 05 §5).
- 타이머는 **빔프로젝터 화면이 권위**, 참가자 폰은 기기 시계 오차만큼 근사치 (설계 04 §3).
