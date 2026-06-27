import { useMemo, useState } from 'react'
import { useGameState, useGames, useScoreLog, useTeams } from '../../lib/game'
import {
  awardFree,
  awardIncrement,
  awardRank,
  setCurrentGame,
  setPhase,
  setVoided,
} from '../../lib/admin'
import type { Game, Phase, ScoreLog, Team, TeamId } from '../../types'
import { Panel } from './ui'

const PHASES: Phase[] = ['intro', 'playing', 'result']
const TEAM_IDS: TeamId[] = ['J', 'I', 'L']

export default function ProgressTab() {
  const state = useGameState()
  const games = useGames()
  const teams = useTeams()
  const log = useScoreLog()

  const game = games.find((g) => g.id === state?.currentGameId)
  const idx = games.findIndex((g) => g.id === state?.currentGameId)

  if (!state || !game) return <p className="font-head text-white">불러오는 중…</p>

  return (
    <div className="w-full max-w-2xl space-y-4">
      <Panel>
        <div className="flex items-center justify-between gap-2">
          <button className="btn-mini" disabled={idx <= 0} onClick={() => setCurrentGame(games[idx - 1].id)}>
            ◀ 이전
          </button>
          <div className="text-center">
            <div className="font-display text-2xl text-pink-600">{game.name}</div>
            <div className="font-body text-xs text-gray-400">
              {game.engineType} · {game.scoringType}
            </div>
          </div>
          <button
            className="btn-mini"
            disabled={idx >= games.length - 1}
            onClick={() => setCurrentGame(games[idx + 1].id)}
          >
            다음 ▶
          </button>
        </div>

        <div className="mt-3 flex justify-center gap-2">
          {PHASES.map((p) => (
            <button
              key={p}
              className={`btn-mini ${state.phase === p ? 'bg-pink-500 text-white' : ''}`}
              onClick={() => setPhase(p)}
            >
              {p}
            </button>
          ))}
        </div>

        <select
          className="mt-3 w-full rounded-xl border-2 border-pink-200 p-2 font-body"
          value={game.id}
          onChange={(e) => setCurrentGame(e.target.value)}
        >
          {games.map((g) => (
            <option key={g.id} value={g.id}>
              {g.order}. {g.name}
            </option>
          ))}
        </select>
      </Panel>

      <Panel>
        <h2 className="mb-2 font-head text-lg text-pink-600">점수 배정</h2>
        <ScorePanel game={game} teams={teams} />
      </Panel>

      <Panel>
        <h2 className="mb-2 font-head text-lg text-pink-600">최근 점수 (되돌리기)</h2>
        <RecentScores log={log} teams={teams} games={games} />
      </Panel>
    </div>
  )
}

function ScorePanel({ game, teams }: { game: Game; teams: Team[] }) {
  const teamName = (id: TeamId) => teams.find((t) => t.id === id)?.name ?? id

  if (game.scoringType === 'increment') {
    const opts = game.incrementOptions ?? [10]
    return (
      <div className="space-y-2">
        {TEAM_IDS.map((id) => (
          <div key={id} className="flex items-center gap-2">
            <span className="w-16 font-head">{teamName(id)}</span>
            {opts.map((n) => (
              <button key={n} className="btn-mini" onClick={() => awardIncrement(game, id, n)}>
                +{n}
              </button>
            ))}
          </div>
        ))}
      </div>
    )
  }
  if (game.scoringType === 'rank') return <RankControl game={game} teamName={teamName} />
  if (game.scoringType === 'free') return <FreeControl game={game} teamName={teamName} />

  return (
    <p className="font-body text-sm text-gray-400">
      이 게임({game.engineType})은 진행 엔진(퀴즈/제시어) 화면에서 점수가 부여됩니다.
    </p>
  )
}

function RankControl({ game, teamName }: { game: Game; teamName: (id: TeamId) => string }) {
  const [ranks, setRanks] = useState<Partial<Record<TeamId, 1 | 2 | 3>>>({})
  const [round, setRound] = useState(game.rounds?.[0] ?? 'main')
  const rp = game.rankPoints

  return (
    <div className="space-y-2">
      {game.rounds && game.rounds.length > 0 && (
        <select
          className="w-full rounded-xl border-2 border-pink-200 p-2 font-body"
          value={round}
          onChange={(e) => setRound(e.target.value)}
        >
          {game.rounds.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      )}
      {TEAM_IDS.map((id) => (
        <div key={id} className="flex items-center gap-2">
          <span className="w-16 font-head">{teamName(id)}</span>
          {([1, 2, 3] as const).map((r) => (
            <button
              key={r}
              className={`btn-mini ${ranks[id] === r ? 'bg-pink-500 text-white' : ''}`}
              onClick={() => setRanks((prev) => ({ ...prev, [id]: r }))}
            >
              {r}등{rp ? ` (${rp[r]})` : ''}
            </button>
          ))}
        </div>
      ))}
      <button className="btn-mini w-full bg-pink-500 text-white" onClick={() => awardRank(game, ranks, round)}>
        순위 확정 ({round})
      </button>
    </div>
  )
}

function FreeControl({ game, teamName }: { game: Game; teamName: (id: TeamId) => string }) {
  const [pts, setPts] = useState<Record<TeamId, string>>({ J: '', I: '', L: '' })
  const sum = TEAM_IDS.reduce((s, id) => s + (Number(pts[id]) || 0), 0)
  const total = game.totalPoints
  const mismatch = total != null && sum !== total

  return (
    <div className="space-y-2">
      {TEAM_IDS.map((id) => (
        <div key={id} className="flex items-center gap-2">
          <span className="w-16 font-head">{teamName(id)}</span>
          <input
            type="number"
            className="flex-1 rounded-xl border-2 border-pink-200 p-2 font-body"
            value={pts[id]}
            onChange={(e) => setPts((prev) => ({ ...prev, [id]: e.target.value }))}
          />
        </div>
      ))}
      {total != null && (
        <p className={`font-body text-sm ${mismatch ? 'text-red-500' : 'text-green-600'}`}>
          합계 {sum} / 총배점 {total} {mismatch ? '— 불일치' : '✓'}
        </p>
      )}
      <button
        className="btn-mini w-full bg-pink-500 text-white disabled:opacity-40"
        disabled={mismatch}
        onClick={() =>
          awardFree(
            game,
            Object.fromEntries(TEAM_IDS.map((id) => [id, Number(pts[id]) || 0])) as Partial<
              Record<TeamId, number>
            >,
          )
        }
      >
        배분
      </button>
    </div>
  )
}

function RecentScores({ log, teams, games }: { log: ScoreLog[]; teams: Team[]; games: Game[] }) {
  const recent = useMemo(() => {
    const ts = (e: ScoreLog) => (e.createdAt as { seconds?: number })?.seconds ?? 0
    return [...log].sort((a, b) => ts(b) - ts(a)).slice(0, 8)
  }, [log])

  if (recent.length === 0)
    return <p className="font-body text-sm text-gray-400">아직 부여된 점수가 없어요</p>

  return (
    <div className="space-y-1">
      {recent.map((e) => {
        const team = teams.find((t) => t.id === e.teamId)
        const game = games.find((g) => g.id === e.gameId)
        return (
          <div
            key={e.id}
            className={`flex items-center justify-between gap-2 rounded-xl px-3 py-1.5 ${
              e.voided ? 'bg-gray-100 line-through opacity-50' : 'bg-pink-50'
            }`}
          >
            <span className="font-body text-sm">
              {game?.name} · {team?.name} <b>{e.points > 0 ? `+${e.points}` : e.points}</b>
            </span>
            <button className="btn-mini" onClick={() => setVoided(e.id, !e.voided)}>
              {e.voided ? '복구' : '취소'}
            </button>
          </div>
        )
      })}
    </div>
  )
}
