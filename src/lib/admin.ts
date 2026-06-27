// 운영(쓰기) 헬퍼 — state/current 변경 + scoreLog 부여.
// 점수는 scoreLog append 단일 출처. 멱등 부여는 결정적 docId로 set (designs/02 §7.5).
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Game, Phase, PromptScreen, QuizScreen, TeamId } from '../types'

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

/** 게임 종료 → 완료 표시 */
export async function finishGame(gameId: string) {
  await updateDoc(doc(requireDb(), 'state', 'current'), {
    finishedGameIds: arrayUnion(gameId),
  })
}

/** 완료 취소(다시 진행 가능) */
export async function reopenGame(gameId: string) {
  await updateDoc(doc(requireDb(), 'state', 'current'), {
    finishedGameIds: arrayRemove(gameId),
  })
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

/* ---------- 퀴즈 진행 엔진 ---------- */

/** 문제 출제: 현재 문제로 띄우고(q1) used 마킹 (designs/02 §4.10) */
export async function setCurrentQuestion(questionId: string) {
  const d = requireDb()
  await setDoc(
    doc(d, 'state', 'current'),
    { currentQuestionId: questionId, quizScreen: 'q1', quizImageIndex: 0 },
    { merge: true },
  )
  await updateDoc(doc(d, 'questions', questionId), { used: true })
}

export async function setQuizScreen(quizScreen: QuizScreen) {
  await updateDoc(doc(requireDb(), 'state', 'current'), { quizScreen })
}

/** 사진 N개 캐러셀 인덱스 */
export async function setQuizImageIndex(quizImageIndex: number) {
  await updateDoc(doc(requireDb(), 'state', 'current'), { quizImageIndex })
}

/** 문제 종료 → 목록 대기 */
export async function clearQuestion() {
  await setDoc(
    doc(requireDb(), 'state', 'current'),
    { currentQuestionId: null, quizScreen: 'q1' },
    { merge: true },
  )
}

/** 정답 등록(팀 단위, 멱등 docId). 개인 단위는 사용자 관리 후 확장. */
export async function awardQuizTeams(
  game: Game,
  questionId: string,
  teams: TeamId[],
  points: number,
) {
  await Promise.all(
    teams.map((teamId) =>
      setDoc(doc(requireDb(), 'scoreLog', `${game.id}__${questionId}__${teamId}`), {
        ...base(game.id, teamId),
        points,
        questionId,
      }),
    ),
  )
}

/* ---------- 제시어 진행 엔진 ---------- */

/** 게임 시작: 묶음 랜덤 배정 + 첫 팀/제시어/w1 (designs/02 §4B.4) */
export async function startPromptGame(
  assignment: Record<TeamId, string>,
  teamOrder: TeamId[],
  firstTeamId: TeamId,
  firstPromptId: string,
) {
  await setDoc(
    doc(requireDb(), 'state', 'current'),
    {
      promptAssignment: assignment,
      promptTeamOrder: teamOrder,
      currentTeamId: firstTeamId,
      currentPromptId: firstPromptId,
      promptScreen: 'w1',
    },
    { merge: true },
  )
}

export async function setPromptScreen(promptScreen: PromptScreen) {
  await updateDoc(doc(requireDb(), 'state', 'current'), { promptScreen })
}

/** 다음 제시어/팀으로 이동 (w1) */
export async function gotoPrompt(currentTeamId: TeamId, currentPromptId: string) {
  await setDoc(
    doc(requireDb(), 'state', 'current'),
    { currentTeamId, currentPromptId, promptScreen: 'w1' },
    { merge: true },
  )
}

/** 모든 팀 종료 → 결과 단계 */
export async function finishPromptGame() {
  await setDoc(
    doc(requireDb(), 'state', 'current'),
    { phase: 'result', currentPromptId: null, promptScreen: null },
    { merge: true },
  )
}

/** w4 정답 → 즉시 가산 (팀 단위 멱등 docId) */
export async function awardPromptTeam(
  game: Game,
  promptId: string,
  teamId: TeamId,
  points: number,
) {
  await setDoc(doc(requireDb(), 'scoreLog', `${game.id}__${promptId}__${teamId}`), {
    ...base(game.id, teamId),
    points,
    promptId,
  })
}

/* ---------- 타이머 (dot-notation으로 timer만 갱신) ---------- */

export async function startTimer(mode: 'countdown' | 'stopwatch', durationSec?: number) {
  await updateDoc(doc(requireDb(), 'state', 'current'), {
    'timer.mode': mode,
    'timer.status': 'running',
    'timer.durationSec': durationSec ?? null,
    'timer.startedAt': serverTimestamp(),
    'timer.accumulatedSec': 0,
  })
}

/** 일시정지: 클라이언트가 계산한 경과(초)를 누적에 고정 */
export async function pauseTimer(elapsedSecValue: number) {
  await updateDoc(doc(requireDb(), 'state', 'current'), {
    'timer.status': 'paused',
    'timer.accumulatedSec': elapsedSecValue,
    'timer.startedAt': null,
  })
}

export async function resumeTimer() {
  await updateDoc(doc(requireDb(), 'state', 'current'), {
    'timer.status': 'running',
    'timer.startedAt': serverTimestamp(),
  })
}

export async function resetTimer(mode: 'countdown' | 'stopwatch' | null) {
  await updateDoc(doc(requireDb(), 'state', 'current'), {
    'timer.mode': mode,
    'timer.status': 'idle',
    'timer.accumulatedSec': 0,
    'timer.startedAt': null,
  })
}
