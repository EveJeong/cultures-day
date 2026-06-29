// presigned GET URL 재발급 훅.
// 주의: Lambda가 임시 자격증명(STS)으로 서명하므로 실제 URL 수명은 요청한 TTL(3일)이 아니라
// 임시 자격증명 수명(수 시간)까지다. 저장된 expiresAt은 신뢰하지 않고, 표시 시점에 재서명하고
// 로드 실패(onError) 시 즉시 재발급한다.
import { useCallback, useEffect, useRef, useState } from 'react'
import type { MediaRef } from '../types'
import { isSignerConfigured, signGetUrl } from './upload'

const SOFT_TTL = 30 * 60_000 // s3Key별 자체 캐시 30분 (수 시간 수명 안에서 자주 갱신)
const MAX_RETRY = 2
const cache = new Map<string, { url: string; signedAt: number }>()

const freshCache = (s3Key: string) => {
  const c = cache.get(s3Key)
  return c && Date.now() - c.signedAt < SOFT_TTL ? c.url : undefined
}

/** MediaRef → 표시용 URL + onError(재발급). <img/audio/video onError={onError} src={url}> 형태로 사용. */
export function useMediaUrl(media?: MediaRef): { url?: string; onError: () => void } {
  const [url, setUrl] = useState<string | undefined>(() => (media ? freshCache(media.s3Key) : undefined))
  const [tick, setTick] = useState(0)
  const retries = useRef(0)

  // 미디어가 바뀌면 재시도 카운트 초기화
  useEffect(() => {
    retries.current = 0
  }, [media?.s3Key])

  const onError = useCallback(() => {
    if (!media || retries.current >= MAX_RETRY) return
    retries.current++
    cache.delete(media.s3Key)
    setTick((t) => t + 1)
  }, [media?.s3Key])

  useEffect(() => {
    if (!media) {
      setUrl(undefined)
      return
    }
    const cached = freshCache(media.s3Key)
    if (cached) {
      setUrl(cached)
      return
    }
    if (!isSignerConfigured) {
      setUrl(media.url)
      return
    }
    let alive = true
    signGetUrl(media.s3Key)
      .then((r) => {
        cache.set(media.s3Key, { url: r.url, signedAt: Date.now() })
        if (alive) setUrl(r.url)
      })
      .catch(() => {
        if (alive) setUrl(media.url) // 재서명 실패 시 일단 기존 URL
      })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media?.s3Key, tick])

  return { url, onError }
}
