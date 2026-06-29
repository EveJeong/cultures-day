// 미디어 업로드: 서명서버에서 presigned URL 받아 S3로 직접 PUT (designs/05-infra.md)
// 이미지·오디오·영상 공용 (contentType만 다름).
import type { MediaRef } from '../types'

const SIGNER = import.meta.env.VITE_SIGNER_BASE_URL
const SECRET = import.meta.env.VITE_SIGNER_SECRET

export const isSignerConfigured = Boolean(SIGNER && SECRET)

export async function uploadMedia(file: File): Promise<MediaRef> {
  if (!isSignerConfigured) throw new Error('서명서버 미설정')
  const headers = { 'content-type': 'application/json', 'x-api-secret': SECRET }
  const ext = file.name.split('.').pop() || 'bin'

  // 1) presigned PUT 발급
  const r1 = await fetch(`${SIGNER}/uploads`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ contentType: file.type, ext }),
  })
  if (!r1.ok) throw new Error('업로드 URL 발급 실패')
  const { uploadUrl, s3Key } = await r1.json()

  // 2) S3로 직접 PUT
  const put = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'content-type': file.type },
    body: file,
  })
  if (!put.ok) throw new Error('S3 업로드 실패')

  // 3) presigned GET 발급
  const { url, expiresAt } = await signGetUrl(s3Key)
  return { s3Key, url, expiresAt, contentType: file.type }
}

/** s3Key로 presigned GET URL 재발급 (만료된 미디어 새로고침용) */
export async function signGetUrl(s3Key: string): Promise<{ url: string; expiresAt: number }> {
  if (!isSignerConfigured) throw new Error('서명서버 미설정')
  const r = await fetch(`${SIGNER}/sign-get`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-secret': SECRET },
    body: JSON.stringify({ s3Key }),
  })
  if (!r.ok) throw new Error('조회 URL 발급 실패')
  return r.json()
}
