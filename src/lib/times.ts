// 릴레이(roster-team) 팀별 기록 시간 — 스톱워치로 측정해 저장.
import { deleteDoc, doc, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import type { TeamId, TeamTime } from '../types'

function requireDb() {
  if (!db) throw new Error('Firestore 미설정')
  return db
}

const timeId = (gameId: string, teamId: TeamId) => `${gameId}__${teamId}`

/** 팀 기록 시간 저장(멱등 — 재측정 시 덮어씀) */
export async function saveTeamTime(gameId: string, teamId: TeamId, sec: number) {
  const id = timeId(gameId, teamId)
  await setDoc(doc(requireDb(), 'times', id), { id, gameId, teamId, sec } satisfies TeamTime)
}

/** 팀 기록 시간 삭제 */
export async function clearTeamTime(gameId: string, teamId: TeamId) {
  await deleteDoc(doc(requireDb(), 'times', timeId(gameId, teamId)))
}
