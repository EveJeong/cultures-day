import { rankedTeamsWithDelta, useGameState, useGames, useScoreLog, useTeams } from '../../lib/game'
import Logo from '../Logo'
import type { TeamId } from '../../types'

const medal = ['🥇', '🥈', '🥉']

/** 대기 화면 — 로고 + 다음 게임 힌트 + 직전 게임 점수/순위 변동 리더보드 */
export default function WaitingScreen({ myTeamId }: { myTeamId?: TeamId | null }) {
  const state = useGameState()
  const teams = useTeams()
  const log = useScoreLog()
  const games = useGames()

  const lastGame = games.find((g) => g.id === state?.currentGameId)
  const finished = new Set(state?.finishedGameIds ?? [])
  const ordered = [...games].filter((g) => !g.excluded).sort((a, b) => a.order - b.order)
  const nextGame = lastGame
    ? ordered.find((g) => g.order > lastGame.order && !finished.has(g.id))
    : ordered.find((g) => !finished.has(g.id))

  const ranked = rankedTeamsWithDelta(teams, log, lastGame?.id)

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-4">
      <Logo size="lg" />

      {nextGame ? (
        <div className="rounded-full bg-white/90 px-6 py-2 font-head text-2xl text-pink-600">
          🎮 다음 게임: {nextGame.name}
        </div>
      ) : (
        <div className="rounded-full bg-white/90 px-6 py-2 font-head text-2xl text-pink-600">잠시 후 시작해요!</div>
      )}

      <div className="flex min-h-0 w-full max-w-2xl flex-col gap-2 overflow-hidden">
        {ranked.map(({ team, score, rank, gained, prevRank }) => {
          const up = prevRank - rank // 양수면 순위 상승
          return (
            <div
              key={team.id}
              className={`flex items-center gap-3 rounded-3xl px-5 py-3 shadow-xl ${team.id === myTeamId ? 'ring-4 ring-yellow-300' : ''}`}
              style={{ background: team.color }}
            >
              <span className="w-10 text-center font-display text-2xl text-white drop-shadow">{medal[rank - 1] ?? rank}</span>
              <span className="flex-1 truncate font-display text-3xl text-white drop-shadow">{team.name}</span>
              {gained > 0 && <span className="font-head text-lg text-white/90">+{gained}</span>}
              {up !== 0 && (
                <span className="font-head text-lg text-white drop-shadow">{up > 0 ? `▲${up}` : `▼${-up}`}</span>
              )}
              <span className="w-16 text-right font-display text-4xl text-white drop-shadow">{score}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
