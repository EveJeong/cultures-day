import { useEffect, useState } from 'react'
import type { TimerState } from '../types'

/** 경과 시간(초) = 누적 + (running이면 now - startedAt) */
export function elapsedSec(timer: TimerState, nowMs: number): number {
  const acc = timer.accumulatedSec ?? 0
  const started = (timer.startedAt as { seconds?: number } | undefined)?.seconds
  if (timer.status === 'running' && started) {
    return acc + Math.max(0, nowMs / 1000 - started)
  }
  return acc
}

/** 카운트다운 남은 시간(초) */
export function remainingSec(timer: TimerState, nowMs: number): number {
  if (timer.mode !== 'countdown' || timer.durationSec == null) return 0
  return Math.max(0, timer.durationSec - elapsedSec(timer, nowMs))
}

/** active일 때만 0.5초마다 now 갱신 */
export function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [active])
  return now
}

export function fmt(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec))
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
