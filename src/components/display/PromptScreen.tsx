import { useGameState, usePrompts, useTeams } from '../../lib/game'
import type { TeamId } from '../../types'

/** 제시어 참가자 화면 w1(순서)·w2(공개)·w3(카테고리만)·w4(공개) */
export default function PromptScreen() {
  const state = useGameState()
  const teams = useTeams()
  const prompt = usePrompts().find((p) => p.id === state?.currentPromptId)

  if (!state || !state.currentTeamId) {
    return <p className="wordart wordart-white text-4xl">배정 대기 중…</p>
  }

  const teamId = state.currentTeamId as TeamId
  const team = teams.find((t) => t.id === teamId)
  const screen = state.promptScreen
  const reveal = screen === 'w2' || screen === 'w4'
  const showCategory = screen !== 'w1'

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-6 text-center">
      <div
        className="rounded-full px-8 py-3 font-display text-3xl text-white shadow-lg"
        style={{ background: team?.color ?? '#888' }}
      >
        {team?.name ?? teamId} 차례
      </div>

      {showCategory && prompt?.category && (
        <div className="rounded-full bg-white/90 px-6 py-2 font-head text-2xl text-pink-600">
          카테고리: {prompt.category}
        </div>
      )}

      {reveal ? (
        <div className="w-full rounded-3xl bg-white/90 p-12 shadow-2xl">
          <p className="font-display text-7xl text-gray-800">{prompt?.text ?? '—'}</p>
        </div>
      ) : (
        <p className="wordart wordart-white text-5xl">
          {screen === 'w1' ? '제시어 준비!' : '몸으로 표현 중…'}
        </p>
      )}
    </div>
  )
}
