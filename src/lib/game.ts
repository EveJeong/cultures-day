import { orderBy } from 'firebase/firestore'
import { useDocument, useCollection } from './useFirestore'
import type { Game, GameState, ScoreLog, Team, TeamId } from '../types'

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

/** 팀 총점 = 유효(voided=false) scoreLog 합계 */
export function teamTotals(log: ScoreLog[]): Record<TeamId, number> {
  const totals: Record<TeamId, number> = { J: 0, I: 0, L: 0 }
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

export function rankedTeams(teams: Team[], log: ScoreLog[]): RankedTeam[] {
  const totals = teamTotals(log)
  const sorted = [...teams].sort((a, b) => totals[b.id] - totals[a.id])
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
