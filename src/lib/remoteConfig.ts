// 행사 open/close — Firebase Remote Config (designs/04-data-model.md §2)
// 웹은 실시간 아님 → 로드 시 + 주기 폴링. 미설정/미지원이면 기본 'open'.
import { useEffect, useState } from 'react'
import {
  fetchAndActivate,
  getRemoteConfig,
  getValue,
  type RemoteConfig,
} from 'firebase/remote-config'
import { app } from './firebase'

const DEFAULTS = { app_status: 'open', logo_url: '', event_name: '바딧불이 야호' }

let rc: RemoteConfig | null | undefined // undefined=미시도, null=미지원

/** 지연 초기화 — 실패해도 throw하지 않음 */
function getRc(): RemoteConfig | null {
  if (rc !== undefined) return rc
  try {
    if (!app) {
      rc = null
    } else {
      const r = getRemoteConfig(app)
      r.settings.minimumFetchIntervalMillis = 30000
      r.defaultConfig = DEFAULTS
      rc = r
    }
  } catch {
    rc = null
  }
  return rc
}

export interface AppConfig {
  status: 'open' | 'closed'
  logoUrl: string
  eventName: string
}

export function useAppConfig(): AppConfig {
  const [cfg, setCfg] = useState<AppConfig>({
    status: 'open',
    logoUrl: '',
    eventName: DEFAULTS.event_name,
  })

  useEffect(() => {
    const r = getRc()
    if (!r) return
    let active = true
    const load = async () => {
      try {
        await fetchAndActivate(r)
        if (!active) return
        setCfg({
          status: (getValue(r, 'app_status').asString() as 'open' | 'closed') || 'open',
          logoUrl: getValue(r, 'logo_url').asString(),
          eventName: getValue(r, 'event_name').asString() || DEFAULTS.event_name,
        })
      } catch {
        // 미설정/오류 → 기본(open) 유지
      }
    }
    load()
    const id = setInterval(load, 30000)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [])

  return cfg
}
