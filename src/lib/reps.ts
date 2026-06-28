// 종목 대표자(reps) — 팀장이 채점 전에 종목별 대표자를 등록.
import { deleteDoc, doc, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import type { Rep, TeamId } from '../types'

function requireDb() {
  if (!db) throw new Error('Firestore 미설정')
  return db
}

/** round 문자열 → docId용 슬러그 (awardRank와 동일 규칙) */
export function roundSlug(round: string): string {
  return round.replace(/[^\p{L}\p{N}]+/gu, '-')
}

export function repId(gameId: string, round: string, teamId: TeamId): string {
  return `${gameId}__${roundSlug(round)}__${teamId}`
}

/** 대표자 지정/변경 (멱등) */
export async function setRep(gameId: string, round: string, teamId: TeamId, userId: string) {
  const id = repId(gameId, round, teamId)
  await setDoc(doc(requireDb(), 'reps', id), { id, gameId, round, teamId, userId } satisfies Rep)
}

/** 대표자 해제 */
export async function clearRep(gameId: string, round: string, teamId: TeamId) {
  await deleteDoc(doc(requireDb(), 'reps', repId(gameId, round, teamId)))
}
