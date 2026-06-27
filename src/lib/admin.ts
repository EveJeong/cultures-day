// 운영(쓰기) 헬퍼 — state/current 변경 + scoreLog 부여.
// 점수는 scoreLog append 단일 출처. 멱등 부여는 결정적 docId로 set (designs/02 §7.5).
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Game, Phase, TeamId } from '../types'

function requireDb() {
  if (!db) throw new Error('Firestore 미설정')
  return db
}

/** 현재 게임 전환 — 무관 엔진/타이머 상태 리셋 (designs/02 §3.4) */
export async function setCurrentGame(gameId: string) {
  await setDoc(
    doc(requireDb(), 'state', 'current'),
    {
      currentGameId: gameId,
      phase: 'intro',
      currentQuestionId: null,
      quizScreen: 'q1',
      promptScreen: null,
      promptAssignment: null,
      promptTeamOrder: null,
      currentTeamId: null,
      currentPromptId: null,
      timer: { mode: null, status: 'idle' },
    },
    { merge: true },
  )
}

export async function setPhase(phase: Phase) {
  await updateDoc(doc(requireDb(), 'state', 'current'), { phase })
}

const base = (gameId: string, teamId: TeamId) => ({
  gameId,
  teamId,
  voided: false,
  createdBy: 'admin' as const,
  createdAt: serverTimestamp(),
})

/** 순위형: 팀별 등수 → 사전 배점. round 단위 멱등(set). */
export async function awardRank(
  game: Game,
  ranks: Partial<Record<TeamId, 1 | 2 | 3>>,
  round = 'main',
) {
  const rp = game.rankPoints
  if (!rp) throw new Error('rankPoints 없음')
  const slug = round.replace(/[^\p{L}\p{N}]+/gu, '-')
  const writes = (Object.entries(ranks) as [TeamId, 1 | 2 | 3][])
    .filter(([, r]) => r)
    .map(([teamId, r]) =>
      setDoc(doc(requireDb(), 'scoreLog', `${game.id}__${slug}__${teamId}`), {
        ...base(game.id, teamId),
        points: rp[r],
        rank: r,
        round,
      }),
    )
  await Promise.all(writes)
}

/** 누적형: 팀에 +N (반복 정상 → auto-id add) */
export async function awardIncrement(game: Game, teamId: TeamId, points: number) {
  await addDoc(collection(requireDb(), 'scoreLog'), {
    ...base(game.id, teamId),
    points,
  })
}

/** 가변형: 팀별 점수 일괄 배분. 팀 단위 멱등(set). */
export async function awardFree(game: Game, points: Partial<Record<TeamId, number>>) {
  const writes = (Object.entries(points) as [TeamId, number][]).map(([teamId, p]) =>
    setDoc(doc(requireDb(), 'scoreLog', `${game.id}__free__${teamId}`), {
      ...base(game.id, teamId),
      points: p,
    }),
  )
  await Promise.all(writes)
}

/** 되돌리기 — 항목 무효화/복구 */
export async function setVoided(scoreLogId: string, voided: boolean) {
  await updateDoc(doc(requireDb(), 'scoreLog', scoreLogId), { voided })
}
