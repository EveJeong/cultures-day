# 이미지 서명서버 (SAM)

퀴즈 이미지 문제용 S3 presigned URL 발급 Lambda. 브라우저는 자격증명 없이 S3에 못 올리므로
이 서버가 업로드(PUT)·조회(GET, 3일) URL을 서명해 준다. 설계: `../designs/05-infra.md`.

## 엔드포인트
- `POST /uploads` — `{ contentType, ext }` → `{ uploadUrl, s3Key }` (PUT용, 5분)
- `POST /sign-get` — `{ s3Key }` → `{ url, expiresAt }` (GET용, 3일)
- 두 엔드포인트 모두 헤더 `x-api-secret` 필수.

## 배포 (AWS 계정 필요)

```bash
cd signer
sam build
sam deploy --guided
# 프롬프트:
#   ApiSecret   : 임의의 시크릿 (프론트와 동일하게 쓸 값)
#   BucketName  : cultures-day-images (기본)
#   AllowOrigin : 운영 시 Vercel 도메인, 개발 중엔 *
```

배포 후 출력된 `ApiUrl`을 프론트 `.env.local`에 넣는다:

```
VITE_SIGNER_BASE_URL=<ApiUrl>
VITE_SIGNER_SECRET=<ApiSecret 와 동일>
```

## 보안 한계
공유 시크릿은 프론트 번들에 노출됨 → "장난 방지" 수준. CORS origin 제한 + 업로드 크기/타입
제한 + 행사 후 시크릿 폐기로 완화 (`designs/05-infra.md` §5).

> AWS SDK v3는 nodejs20 런타임에 내장되어 `src/`에 의존성 설치가 필요 없다.
