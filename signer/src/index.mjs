// 이미지 presigned URL 발급 Lambda (designs/05-infra.md §3)
// 런타임(nodejs20)에 AWS SDK v3 내장 → 별도 번들 불필요.
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'node:crypto'

const s3 = new S3Client({})
const BUCKET = process.env.BUCKET
const SECRET = process.env.API_SECRET
const TTL = Number(process.env.URL_TTL_SECONDS || 259200) // 3일

const cors = {
  'Access-Control-Allow-Origin': process.env.ALLOW_ORIGIN || '*',
  'Access-Control-Allow-Headers': 'content-type,x-api-secret',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
}
const json = (code, body) => ({
  statusCode: code,
  headers: { 'content-type': 'application/json', ...cors },
  body: JSON.stringify(body),
})

export const handler = async (event) => {
  const method = event.requestContext?.http?.method || event.httpMethod
  if (method === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' }

  const secret = event.headers?.['x-api-secret'] || event.headers?.['X-Api-Secret']
  if (secret !== SECRET) return json(403, { error: 'forbidden' })

  const path = event.rawPath || event.path || ''
  const body = JSON.parse(event.body || '{}')

  try {
    if (path.endsWith('/uploads')) {
      const ext = String(body.ext || 'png').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'png'
      const s3Key = `questions/${randomUUID()}.${ext}`
      const uploadUrl = await getSignedUrl(
        s3,
        new PutObjectCommand({ Bucket: BUCKET, Key: s3Key, ContentType: body.contentType || 'image/png' }),
        { expiresIn: 300 },
      )
      return json(200, { uploadUrl, s3Key })
    }
    if (path.endsWith('/sign-get')) {
      if (!body.s3Key) return json(400, { error: 's3Key required' })
      const url = await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: BUCKET, Key: body.s3Key }),
        { expiresIn: TTL },
      )
      return json(200, { url, expiresAt: Date.now() + TTL * 1000 })
    }
    return json(404, { error: 'not found' })
  } catch (e) {
    return json(500, { error: e.message })
  }
}
