// 이미지 업로드: 서명서버에서 presigned URL 받아 S3로 직접 PUT (designs/05-infra.md)
import type { ImageRef } from '../types'

const SIGNER = import.meta.env.VITE_SIGNER_BASE_URL
const SECRET = import.meta.env.VITE_SIGNER_SECRET

export const isSignerConfigured = Boolean(SIGNER && SECRET)

export async function uploadImage(file: File): Promise<ImageRef> {
  if (!isSignerConfigured) throw new Error('서명서버 미설정')
  const headers = { 'content-type': 'application/json', 'x-api-secret': SECRET }
  const ext = file.name.split('.').pop() || 'png'

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

  // 3) presigned GET(3일) 발급
  const r2 = await fetch(`${SIGNER}/sign-get`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ s3Key }),
  })
  if (!r2.ok) throw new Error('조회 URL 발급 실패')
  const { url, expiresAt } = await r2.json()

  return { s3Key, url, expiresAt }
}
