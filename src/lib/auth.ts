// 인증 유틸: 클라이언트 SHA-256 해시 + 세션 (designs/01-auth-design.md)
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import type { TeamId, User } from '../types'

export async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** 이름으로 사용자 조회 (없으면 null) */
export async function getUser(name: string): Promise<User | null> {
  if (!db) return null
  const snap = await getDoc(doc(db, 'users', name))
  return snap.exists() ? (snap.data() as User) : null
}

/** 최초 가입(B): 비번 해시 + 닉네임 저장 */
export async function registerParticipant(name: string, password: string, nickname: string) {
  if (!db) throw new Error('Firestore 미설정')
  const passwordHash = await sha256(password)
  await setDoc(doc(db, 'users', name), { passwordHash, nickname }, { merge: true })
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
