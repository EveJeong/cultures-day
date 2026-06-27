import { rankedTeams, useScoreLog, useTeams } from '../../lib/game'
import type { TeamId } from '../../types'

/** 상단 상시 점수 바 (컴팩트 랭킹) */
export default function ScoreBar({ myTeamId }: { myTeamId?: TeamId | null }) {
  const teams = useTeams()
  const log = useScoreLog()
  if (teams.length === 0) return null
  const ranked = rankedTeams(teams, log)

  return (
    <div className="flex w-full justify-center gap-2 p-3">
      {ranked.map(({ team, score, rank }) => (
        <div
          key={team.id}
          className={`flex items-center gap-2 rounded-2xl px-4 py-2 shadow-lg ${
            team.id === myTeamId ? 'ring-4 ring-yellow-300' : ''
          }`}
          style={{ background: team.color }}
        >
          <span className="font-display text-lg text-white drop-shadow">{rank}</span>
          <span className="font-display text-lg text-white drop-shadow">{team.name}</span>
          <span className="font-display text-2xl text-white drop-shadow">{score}</span>
        </div>
      ))}
    </div>
  )
}
