import { useState } from 'react'
import { useGameState, usePromptSets, usePrompts, useTeams } from '../../lib/game'
import {
  awardPromptTeam,
  finishPromptGame,
  gotoPrompt,
  setPromptScreen,
  startPromptGame,
} from '../../lib/admin'
import type { Game, Prompt, TeamId } from '../../types'

const TEAM_ORDER: TeamId[] = ['J', 'I', 'L']

export default function PromptEngine({ game }: { game: Game }) {
  const state = useGameState()
  const teams = useTeams()
  const sets = usePromptSets()
    .filter((s) => s.gameId === game.id)
    .sort((a, b) => a.order - b.order)
  const allPrompts = usePrompts()
  const promptsOf = (setId: string) =>
    allPrompts.filter((p) => p.setId === setId).sort((a, b) => a.order - b.order)

  const [points, setPoints] = useState(String(game.incrementOptions?.[0] ?? 10))

  if (!state) return null
  const teamName = (id: TeamId) => teams.find((t) => t.id === id)?.name ?? id

  /* 첫 진행 가능한 팀/제시어 찾기 */
  const firstPlayable = (assignment: Record<TeamId, string>) => {
    for (const t of TEAM_ORDER) {
      const first = promptsOf(assignment[t])[0]
      if (first) return { teamId: t, promptId: first.id }
    }
    return null
  }

  const start = async () => {
    const picked = [...sets].slice(0, 3).sort(() => Math.random() - 0.5)
    const assignment = { J: picked[0].id, I: picked[1].id, L: picked[2].id } as Record<TeamId, string>
    const fp = firstPlayable(assignment)
    if (!fp) return
    await startPromptGame(assignment, TEAM_ORDER, fp.teamId, fp.promptId)
  }

  /* 게임 시작 전 */
  if (!state.promptAssignment) {
    return (
      <div className="space-y-2">
        <p className="font-body text-sm text-gray-500">묶음 {sets.length}개 (3개 필요)</p>
        <button
          className="btn-mini w-full bg-pink-500 text-white disabled:opacity-40"
          disabled={sets.length < 3}
          onClick={start}
        >
          게임 시작 (묶음 랜덤 배정)
        </button>
      </div>
    )
  }

  const assignment = state.promptAssignment
  const teamId = state.currentTeamId ?? 'J'
  const setPrompts = promptsOf(assignment[teamId])
  const idx = setPrompts.findIndex((p) => p.id === state.currentPromptId)
  const current: Prompt | undefined = setPrompts[idx]

  /* 다음 제시어/팀 이동 */
  const advance = async () => {
    const next = setPrompts[idx + 1]
    if (next) return gotoPrompt(teamId, next.id)
    const ti = TEAM_ORDER.indexOf(teamId)
    for (let i = ti + 1; i < TEAM_ORDER.length; i++) {
      const first = promptsOf(assignment[TEAM_ORDER[i]])[0]
      if (first) return gotoPrompt(TEAM_ORDER[i], first.id)
    }
    await finishPromptGame()
  }

  const correct = async () => {
    if (current) await awardPromptTeam(game, current.id, teamId, Number(points) || 10)
    await advance()
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-pink-50 p-3 text-center">
        <div className="font-head text-sm text-pink-500">
          {teamName(teamId)} 차례 · {idx + 1}/{setPrompts.length}
        </div>
        <div className="font-display text-2xl">{current?.text ?? '—'}</div>
        {current?.category && (
          <div className="font-body text-sm text-gray-500">카테고리: {current.category}</div>
        )}
      </div>

      <div className="flex justify-center gap-1">
        {(['w1', 'w2', 'w3', 'w4'] as const).map((s) => (
          <button
            key={s}
            className={`btn-mini ${state.promptScreen === s ? 'bg-pink-500 text-white' : ''}`}
            onClick={() => setPromptScreen(s)}
          >
            {s === 'w1' ? '순서' : s === 'w2' ? '공개' : s === 'w3' ? '카테고리' : '결과'}
          </button>
        ))}
      </div>

      {state.promptScreen === 'w4' && (
        <div className="space-y-2 rounded-2xl border-2 border-pink-100 p-3">
          <div className="flex items-center gap-2">
            <span className="font-head text-sm text-pink-600">정답 점수</span>
            <input
              type="number"
              className="w-20 rounded-xl border-2 border-pink-200 p-1 font-body"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button className="btn-mini flex-1 bg-pink-500 text-white" onClick={correct}>
              정답 +{points}
            </button>
            <button className="btn-mini flex-1" onClick={advance}>
              오답/넘기기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
