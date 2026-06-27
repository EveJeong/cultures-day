// 인증 유틸: 클라이언트 SHA-256 해시 + 세션 (designs/01-auth-design.md)
import type { TeamId } from '../types'

export async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export interface Session {
  userId: string
  role: 'participant' | 'admin'
  nickname?: string | null
  teamId?: TeamId | null
}

const KEY = 'baditbuli_session'

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export function setSession(s: Session) {
  localStorage.setItem(KEY, JSON.stringify(s))
}

export function clearSession() {
  localStorage.removeItem(KEY)
}
