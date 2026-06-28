import { useGameState, useReps, useTeams, useUsers } from '../../lib/game'
import type { Game, Rep, User } from '../../types'

const label = (users: User[], name: string) => {
  const u = users.find((x) => x.name === name)
  return u?.nickname || name
}

const rosterOf = (reps: Rep[], gameId: string, round: string, teamId: string) =>
  reps.find((r) => r.gameId === gameId && r.round === round && r.teamId === teamId)?.userIds ?? []

/** 팀별 진행(릴레이) — 현재 진행 팀 + 그 팀의 종목별 출전자 */
export function RosterTeamView({ game }: { game: Game }) {
  const state = useGameState()
  const teams = useTeams()
  const users = useUsers()
  const reps = useReps()
  const rounds = game.rounds ?? []
  const team = teams.find((t) => t.id === state?.currentTeamId) ?? teams[0]

  return (
    <div className="flex h-full w-full max-w-4xl flex-col items-center justify-center gap-4">
      <h1 className="wordart wordart-yellow text-5xl md:text-6xl">{game.name}</h1>
      {team ? (
        <div className="rounded-full px-10 py-3 shadow-xl" style={{ background: team.color }}>
          <span className="font-display text-4xl text-white drop-shadow">▶ {team.name} 차례</span>
        </div>
      ) : (
        <p className="wordart wordart-white text-2xl">진행 팀을 선택하세요</p>
      )}
      <div className="flex w-full flex-wrap justify-center gap-3">
        {rounds.map((round) => {
          const roster = team ? rosterOf(reps, game.id, round, team.id) : []
          return (
            <div key={round} className="min-w-[12rem] flex-1 rounded-3xl bg-white/90 p-4 text-center shadow-lg">
              <p className="font-head text-xl text-pink-600">{round}</p>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {roster.length > 0 ? (
                  roster.map((n) => (
                    <span key={n} className="rounded-full bg-pink-100 px-3 py-1 font-body text-lg text-pink-700">
                      {label(users, n)}
                    </span>
                  ))
                ) : (
                  <span className="font-body text-gray-400">미정</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** 종목별 진행 — 현재 진행 종목 + 팀별 출전자 */
export function RosterEventView({ game }: { game: Game }) {
  const state = useGameState()
  const teams = useTeams()
  const users = useUsers()
  const reps = useReps()
  const round = state?.currentRound ?? game.rounds?.[0] ?? ''

  return (
    <div className="flex h-full w-full max-w-5xl flex-col items-center justify-center gap-4">
      <h1 className="wordart wordart-yellow text-4xl md:text-5xl">{game.name}</h1>
      {round ? (
        <div className="rounded-full bg-white/90 px-10 py-2 shadow-xl">
          <span className="font-display text-4xl text-pink-600">🎯 {round}</span>
        </div>
      ) : (
        <p className="wordart wordart-white text-2xl">진행 종목을 선택하세요</p>
      )}
      <div className="flex w-full flex-wrap justify-center gap-3">
        {teams.map((t) => {
          const roster = rosterOf(reps, game.id, round, t.id)
          return (
            <div key={t.id} className="min-w-[12rem] flex-1 rounded-3xl p-4 text-center text-white shadow-lg" style={{ background: t.color }}>
              <p className="font-display text-2xl drop-shadow">{t.name}</p>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {roster.length > 0 ? (
                  roster.map((n) => (
                    <span key={n} className="rounded-full bg-white/30 px-3 py-1 font-body text-lg text-white">
                      {label(users, n)}
                    </span>
                  ))
                ) : (
                  <span className="font-body text-white/70">미정</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
