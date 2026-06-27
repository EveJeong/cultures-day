import { rankedTeams, useScoreLog, useTeams } from '../lib/game'
import type { TeamId } from '../types'

const medal = ['🥇', '🥈', '🥉']

/** 팀 점수 리더보드 — scoreLog 합계 파생 */
export default function Leaderboard({ myTeamId }: { myTeamId?: TeamId | null }) {
  const teams = useTeams()
  const log = useScoreLog()

  if (teams.length === 0) {
    return (
      <div className="rounded-3xl bg-white/85 px-6 py-5 font-head text-gray-500 shadow-xl">
        팀이 아직 등록되지 않았어요 (운영 페이지에서 등록)
      </div>
    )
  }

  const ranked = rankedTeams(teams, log)

  return (
    <div className="flex w-full max-w-2xl flex-col gap-3">
      {ranked.map(({ team, score, rank }) => {
        const isMine = team.id === myTeamId
        return (
          <div
            key={team.id}
            className={`flex items-center gap-4 rounded-3xl px-5 py-4 shadow-xl transition ${
              isMine ? 'ring-4 ring-yellow-300 scale-[1.02]' : ''
            }`}
            style={{ background: team.color || '#888' }}
          >
            <span className="w-10 text-center font-display text-2xl text-white drop-shadow">
              {medal[rank - 1] ?? rank}
            </span>
            <span className="flex-1 truncate font-display text-3xl text-white drop-shadow">
              {team.name}
              {isMine && <span className="ml-2 text-lg">(우리팀)</span>}
            </span>
            <span className="font-display text-4xl text-white drop-shadow">{score}</span>
          </div>
        )
      })}
    </div>
  )
}
