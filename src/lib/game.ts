import { orderBy } from 'firebase/firestore'
import { useDocument, useCollection } from './useFirestore'
import type {
  Game,
  GameState,
  Prompt,
  PromptSet,
  Question,
  Rep,
  ScoreLog,
  Team,
  TeamId,
  User,
} from '../types'

/** 진행 상태 단일 문서 (state/current) */
export function useGameState(): GameState | null {
  return useDocument<GameState>('state', 'current')
}

/** 팀 목록 (J·I·L) */
export function useTeams(): Team[] {
  return useCollection<Team>('teams')
}

/** 게임 정의 목록 (순서대로) */
export function useGames(): Game[] {
  return useCollection<Game>('games', orderBy('order'))
}

/** 전체 점수 로그 구독 (규모 작아 클라이언트 집계) */
export function useScoreLog(): ScoreLog[] {
  return useCollection<ScoreLog>('scoreLog')
}

/** 퀴즈 문제 전체 (클라이언트 필터·정렬) */
export function useQuestions(): Question[] {
  return useCollection<Question>('questions')
}

/** 제시어 묶음 전체 */
export function usePromptSets(): PromptSet[] {
  return useCollection<PromptSet>('promptSets')
}

/** 제시어 전체 */
export function usePrompts(): Prompt[] {
  return useCollection<Prompt>('prompts')
}

/** 사용자 전체 */
export function useUsers(): User[] {
  return useCollection<User>('users')
}

/** 종목 대표자 전체 */
export function useReps(): Rep[] {
  return useCollection<Rep>('reps')
}

/* ---------- 개인 기여도 집계 (userId 귀속 항목) ---------- */

const mine = (log: ScoreLog[], name: string) => log.filter((e) => !e.voided && e.userId === name)

/** 개인 귀속 점수 합 */
export function userTotal(log: ScoreLog[], name: string): number {
  return mine(log, name).reduce((s, e) => s + (e.points ?? 0), 0)
}

/** 내가 맞춘 퀴즈 항목 (questionId 보유) */
export function userQuizzes(log: ScoreLog[], name: string): ScoreLog[] {
  return mine(log, name).filter((e) => e.questionId)
}

/** 내 MVP 항목 */
export function userMvps(log: ScoreLog[], name: string): ScoreLog[] {
  return mine(log, name).filter((e) => e.mvp)
}

export interface UserEvent {
  gameId: string
  round: string
  teamId: TeamId
  rank?: 1 | 2 | 3
  points?: number
}

/** 내가 대표자로 참가한 종목 + (채점됐으면) 등수 */
export function userEvents(reps: Rep[], log: ScoreLog[], name: string): UserEvent[] {
  return reps
    .filter((r) => r.userId === name)
    .map((r) => {
      const scored = log.find(
        (e) => !e.voided && e.gameId === r.gameId && e.round === r.round && e.teamId === r.teamId && e.rank,
      )
      return { gameId: r.gameId, round: r.round, teamId: r.teamId, rank: scored?.rank, points: scored?.points }
    })
}

/** 팀 총점 = 유효(voided=false) scoreLog 합계 */
export function teamTotals(log: ScoreLog[]): Record<TeamId, number> {
  const totals: Record<TeamId, number> = {}
  for (const entry of log) {
    if (entry.voided) continue
    totals[entry.teamId] = (totals[entry.teamId] ?? 0) + (entry.points ?? 0)
  }
  return totals
}

/** 총점 내림차순 정렬된 팀 + 점수 + 공동순위 */
export interface RankedTeam {
  team: Team
  score: number
  rank: number
}

function rankByTotals(teams: Team[], totals: Record<TeamId, number>): RankedTeam[] {
  const sorted = [...teams].sort((a, b) => (totals[b.id] ?? 0) - (totals[a.id] ?? 0))
  let lastScore = Number.POSITIVE_INFINITY
  let lastRank = 0
  return sorted.map((team, i) => {
    const score = totals[team.id] ?? 0
    const rank = score === lastScore ? lastRank : i + 1 // 공동순위
    lastScore = score
    lastRank = rank
    return { team, score, rank }
  })
}

export function rankedTeams(teams: Team[], log: ScoreLog[]): RankedTeam[] {
  return rankByTotals(teams, teamTotals(log))
}

export interface RankedTeamDelta extends RankedTeam {
  gained: number // 직전 게임으로 얻은 점수
  prevRank: number // 직전 게임 전 순위
}

/** 직전 게임(lastGameId)으로 인한 점수/순위 변동 포함 랭킹 */
export function rankedTeamsWithDelta(
  teams: Team[],
  log: ScoreLog[],
  lastGameId?: string,
): RankedTeamDelta[] {
  const cur = teamTotals(log)
  const prev = teamTotals(lastGameId ? log.filter((e) => e.gameId !== lastGameId) : log)
  const prevRank: Record<string, number> = {}
  rankByTotals(teams, prev).forEach((r) => {
    prevRank[r.team.id] = r.rank
  })
  return rankByTotals(teams, cur).map((r) => ({
    ...r,
    gained: (cur[r.team.id] ?? 0) - (prev[r.team.id] ?? 0),
    prevRank: prevRank[r.team.id] ?? r.rank,
  }))
}
