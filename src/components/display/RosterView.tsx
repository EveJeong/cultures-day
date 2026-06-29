import { eventNames, eventWinCondition, relayLeaderboard, useGameState, useReps, useTeams, useTimes, useUsers } from '../../lib/game'
import { elapsedSec, fmt, useNow } from '../../lib/timer'
import type { Game, Rep, User } from '../../types'

const label = (users: User[], name: string) => {
  const u = users.find((x) => x.name === name)
  return u?.nickname || name
}

const rosterOf = (reps: Rep[], gameId: string, round: string, teamId: string) =>
  reps.find((r) => r.gameId === gameId && r.round === round && r.teamId === teamId)?.userIds ?? []

/** 팀별 진행 릴레이 — 현재 진행 팀(큰 스톱워치 + 종목별 출전자) + 팀별 시간 리더보드 */
export function RosterTeamView({ game }: { game: Game }) {
  const state = useGameState()
  const teams = useTeams()
  const users = useUsers()
  const reps = useReps()
  const times = useTimes()
  const rounds = eventNames(game)
  const team = teams.find((t) => t.id === state?.currentTeamId)
  const running = state?.timer.status === 'running'
  const now = useNow(running)
  const elapsed = state ? elapsedSec(state.timer, now) : 0
  const board = relayLeaderboard(teams, times, game.id).filter((r) => r.sec != null)

  return (
    <div className="flex h-full w-full max-w-5xl flex-col items-center justify-center gap-3">
      <h1 className="wordart wordart-yellow text-4xl md:text-5xl">{game.name}</h1>

      {team ? (
        <>
          <div className="rounded-full px-8 py-2 shadow-xl" style={{ background: team.color }}>
            <span className="font-display text-3xl text-white drop-shadow">▶ {team.name} 차례</span>
          </div>
          <div className={`wordart text-7xl md:text-8xl ${running ? 'wordart-white' : 'wordart-blue'}`}>{fmt(elapsed)}</div>
          <div className="flex flex-wrap justify-center gap-2">
            {rounds.map((round) => {
              const roster = rosterOf(reps, game.id, round, team.id)
              return (
                <div key={round} className="rounded-2xl bg-white/90 px-4 py-2 text-center shadow">
                  <p className="font-head text-pink-600">{round}</p>
                  <div className="mt-1 flex flex-wrap justify-center gap-1">
                    {roster.length > 0 ? (
                      roster.map((n) => (
                        <span key={n} className="rounded-full bg-pink-100 px-2 py-0.5 font-body text-pink-700">{label(users, n)}</span>
                      ))
                    ) : (
                      <span className="font-body text-gray-400">미정</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <p className="wordart wordart-white text-2xl">진행 팀을 선택하세요</p>
      )}

      {board.length > 0 && (
        <div className="w-full max-w-md space-y-1">
          {board.map((r) => (
            <div key={r.team.id} className="flex items-center gap-2 rounded-2xl px-4 py-1.5 text-white shadow" style={{ background: r.team.color }}>
              <span className="w-6 text-center font-display text-xl drop-shadow">{r.rank}</span>
              <span className="flex-1 truncate font-head drop-shadow">{r.team.name}</span>
              <span className="font-display text-xl drop-shadow">{fmt(r.sec!)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** 종목별 진행 — 현재 진행 종목 + 팀별 출전자 */
export function RosterEventView({ game }: { game: Game }) {
  const state = useGameState()
  const teams = useTeams()
  const users = useUsers()
  const reps = useReps()
  const round = state?.currentRound ?? eventNames(game)[0] ?? ''
  const win = round ? eventWinCondition(game, round) : undefined

  return (
    <div className="flex h-full w-full max-w-5xl flex-col items-center justify-center gap-4">
      <h1 className="wordart wordart-yellow text-4xl md:text-5xl">{game.name}</h1>
      {round ? (
        <div className="flex flex-col items-center gap-1">
          <div className="rounded-full bg-white/90 px-10 py-2 shadow-xl">
            <span className="font-display text-4xl text-pink-600">🎯 {round}</span>
          </div>
          {win && <p className="rounded-full bg-white/80 px-4 py-1 font-head text-lg text-gray-600">🏆 {win}</p>}
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
