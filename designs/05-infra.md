# 인프라 설계 (S3 · 서명서버 · Firebase · Vercel)

> 하이브리드 구성의 인프라 정본. 이미지(S3+Lambda), 실시간(Firestore), 행사상태(Remote Config),
> 배포(Vercel)를 셋업한다. 지역: **ap-northeast-2(서울)**.
> 관련: `00-overview.md`, `04-data-model.md`, `02-admin-design.md`(4.7 이미지 파이프라인).

## 1. 구성도

```
[브라우저 SPA · Vercel]
   │  ├─ Firestore (실시간 상태/점수) ── onSnapshot
   │  ├─ Remote Config (app_status open/close) ── fetch 폴링
   │  └─ 이미지 업로드/조회
   │        │ (1) presigned 요청 (x-api-secret)
   │        ▼
   │   [API Gateway] ── [Lambda 서명서버 (SAM)]
   │        │ (2) presigned PUT/GET 발급
   │        ▼
   └──────[S3 버킷] ◄── (3) 브라우저가 직접 PUT, 게임 때 GET
```

## 2. S3 버킷 (이미지 저장)

| 항목 | 값 |
| --- | --- |
| 버킷명 | `cultures-day-images`(예) |
| 공개 | **비공개**(퍼블릭 액세스 차단). 접근은 presigned URL로만 |
| 객체 키 | `questions/{uuid}.{ext}` |
| 수명주기 | 행사 종료 후 정리용 만료 규칙(선택, 예: 30일 후 삭제) |

### 2.1 CORS (S3) — 브라우저 직접 PUT 허용

```json
[{
  "AllowedOrigins": ["https://<vercel-도메인>", "http://localhost:5173"],
  "AllowedMethods": ["PUT", "GET"],
  "AllowedHeaders": ["*"],
  "ExposeHeaders": ["ETag"],
  "MaxAgeSeconds": 3000
}]
```

## 3. 서명서버 (Lambda + API Gateway, SAM)

### 3.1 엔드포인트

| 메서드 | 경로 | 역할 |
| --- | --- | --- |
| `POST` | `/uploads` | presigned **PUT** 발급(업로드용). 크기/타입 제한 |
| `POST` | `/sign-get` | presigned **GET** 발급(유효기간 3일) |

- 요청에 **`x-api-secret` 헤더** 필수 → Lambda가 환경변수 시크릿과 비교, 불일치 시 403.
- 업로드는 `createPresignedPost`로 **content-length-range(예: ~10MB)·content-type(image/*)** 조건을 걸어 남용 축소.
- presigned GET 만료는 3일(`expiresIn: 259200`). 문서에 `{s3Key, url, expiresAt}` 저장(`04-data-model.md` §7).

### 3.2 SAM 템플릿 개요

```yaml
# template.yaml (개요)
Resources:
  SignerFn:
    Type: AWS::Serverless::Function
    Properties:
      Runtime: nodejs20.x
      Handler: index.handler
      Environment:
        Variables:
          BUCKET: cultures-day-images
          API_SECRET: !Ref ApiSecret      # 배포 시 주입
          URL_TTL_SECONDS: "259200"       # 3일
      Policies:
        - S3CrudPolicy: { BucketName: cultures-day-images }
      Events:
        Uploads: { Type: Api, Properties: { Path: /uploads, Method: post } }
        SignGet: { Type: Api, Properties: { Path: /sign-get, Method: post } }
Parameters:
  ApiSecret: { Type: String, NoEcho: true }
```

- 빌드: `sam build --use-container`(레포 관례), 배포: `sam deploy --guided`.
- 의존: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`.

### 3.3 API Gateway CORS

- `OPTIONS` 프리플라이트 허용, `Access-Control-Allow-Headers`에 `x-api-secret`·`content-type` 포함.
- `Access-Control-Allow-Origin`을 Vercel 도메인으로 제한(와일드카드 지양).

## 4. IAM

- Lambda 실행 역할: 대상 버킷 프리픽스에 한정한 `s3:PutObject`, `s3:GetObject`.
- 최소권한: 버킷 전체가 아닌 `arn:aws:s3:::cultures-day-images/questions/*` 범위.

## 5. 보안 한계 (명시)

- **공유 시크릿은 클라이언트 SPA 번들·네트워크 요청에서 사실상 누구나 읽을 수 있다**(소스/DevTools).
  → 결정적 차단이 아닌 **"장난 방지" 수준**(앱 전체 보안 posture와 동일).
- ⚠️ **admin 로그인 뒤에 둬도 보호되지 않는다**: admin 판정은 클라이언트 분기(`01-auth-design.md` §8)라
  번들을 여는 누구나 시크릿을 얻는다. admin-gating은 보안 완화책이 **아님**.
- 실효 있는 완화책은 다음뿐: ① API Gateway CORS origin 제한, ② presigned PUT 크기/타입 제한,
  ③ 버킷 비공개·프리픽스 한정, ④ **행사 후 시크릿 폐기/로테이션**.
- 진짜 보호가 필요하면 서버 측 인증(예: Firebase Auth ID 토큰을 서명서버가 검증)으로 승격해야 한다(현재 범위 밖).

## 6. Firebase 셋업

| 항목 | 내용 |
| --- | --- |
| 프로젝트 | Firebase 콘솔에서 생성, 웹 앱 등록 → `firebaseConfig` 획득 |
| Firestore | 네이티브 모드, 지역 `asia-northeast3`(서울) |
| 보안 규칙 | 이벤트 기간 읽기/쓰기 허용, 종료 후 `false` 동결(`04-data-model.md` §12) |
| 인덱스 | §10 복합 인덱스(또는 전체 `scoreLog` 구독으로 최소화) |
| Remote Config | 키 `app_status`(기본 `closed`), `logo_url`, `event_name`. 짧은 `minimumFetchInterval` |
| 시드 | `teams`(J·I·L), `games`(9개), `state/current` 초기 문서 |

## 7. Vercel 배포

- 프레임워크: Vite(React). `npm run build` → `dist`.
- **SPA 라우팅**: `/admin`·`/spectator` 새로고침 대응 rewrites.
  ```json
  // vercel.json
  { "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
  ```
- 환경변수는 Vercel 프로젝트 설정에 등록(아래 §8).

## 8. 환경변수 (프론트 `.env`)

| 키 | 용도 |
| --- | --- |
| `VITE_FIREBASE_*` | apiKey·authDomain·projectId·appId 등 Firebase 웹 config |
| `VITE_SIGNER_BASE_URL` | API Gateway 서명서버 베이스 URL |
| `VITE_SIGNER_SECRET` | 서명 요청 `x-api-secret` 값(클라이언트 노출 한계 §5) |
| `VITE_APP_BASE_URL` | QR 인코딩용 앱 베이스 URL(`03-display-design.md` 7) |

## 9. 배포 체크리스트

1. S3 버킷 생성 + 퍼블릭 차단 + CORS(§2).
2. SAM 서명서버 배포(`API_SECRET` 주입) → 엔드포인트 URL 확보(§3).
3. Firebase 프로젝트·Firestore·Remote Config·시드(§6).
4. 프론트 `.env` 채우고 Vercel 배포 + rewrites(§7).
5. 스모크 테스트: 이미지 업로드 → 문제 등록 → 진행 페이지 표시 → open/close 토글.
6. 행사 종료 후: Firestore 쓰기 규칙 동결, 시크릿 폐기, (선택) S3 객체 정리.
