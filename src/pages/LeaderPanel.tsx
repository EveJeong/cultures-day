import { useNavigate } from 'react-router-dom'
import { eventNames, eventRosterSize, eventWinCondition, useGames, useGameState, useReps, useScoreLog, useTeams, useUsers } from '../lib/game'
import { setRoster } from '../lib/reps'
import { setMvp, clearMvp } from '../lib/admin'
import { getSession } from '../lib/auth'
import type { Game, Team, User } from '../types'
import Logo from '../components/Logo'
import { Panel, inputCls } from './admin/ui'

/** 팀장 전용 — 종목 대표자 등록 + 게임별 MVP 선정 */
export default function LeaderPanel() {
  const nav = useNavigate()
  const session = getSession()
  const users = useUsers()
  const teams = useTeams()
  const games = useGames()
  const state = useGameState()
  const reps = useReps()
  const log = useScoreLog()

  const me = users.find((u) => u.name === session?.userId)
  const team = teams.find((t) => t.id === me?.teamId)
  const isLeader = !!team && !!me && team.leaderId === me.name
  const members = users.filter((u) => u.teamId === team?.id && !u.isAdmin)
  const finished = new Set(state?.finishedGameIds ?? [])

  const eventGames = games.filter((g) => eventNames(g).length > 0 && !g.excluded && !finished.has(g.id))
  const mvpGames = games.filter(
    (g) => g.engineType !== 'quiz' && eventNames(g).length === 0 && (finished.has(g.id) || state?.currentGameId === g.id),
  )

  return (
    <div className="rainbow-bg min-h-screen w-full p-4">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
        <div className="flex items-center justify-between">
          <button className="rounded-full bg-white/90 px-4 py-1.5 font-head text-pink-600 shadow" onClick={() => nav('/')}>
            ← 홈
          </button>
          <Logo size="sm" />
        </div>

        {!isLeader ? (
          <Panel>
            <p className="font-head text-pink-600">👑 팀장 전용 메뉴</p>
            <p className="mt-1 font-body text-sm text-gray-500">팀장으로 지정된 참여자만 사용할 수 있어요.</p>
          </Panel>
        ) : (
          <>
            <Panel>
              <div className="font-display text-xl" style={{ color: team.color }}>{team.name} 팀장 · {me.name}</div>
              <p className="font-body text-sm text-gray-500">종목 대표자와 게임 MVP를 관리하세요.</p>
            </Panel>

            <Panel>
              <h2 className="mb-2 font-head text-pink-600">🎯 종목 대표자 등록</h2>
              {eventGames.length === 0 ? (
                <p className="font-body text-sm text-gray-400">대표자를 등록할 종목제 게임이 없어요.</p>
              ) : (
                <div className="space-y-3">
                  {eventGames.map((g) => (
                    <div key={g.id} className="rounded-2xl bg-pink-50 p-3">
                      <p className="mb-1 font-head text-sm text-pink-700">{g.name}</p>
                      <div className="space-y-2">
                        {eventNames(g).map((round) => {
                          const cur = reps.find((r) => r.gameId === g.id && r.round === round && r.teamId === team.id)
                          return (
                            <RosterRow
                              key={round}
                              label={round}
                              win={eventWinCondition(g, round)}
                              members={members}
                              max={eventRosterSize(g, round)}
                              selected={cur?.userIds ?? []}
                              onChange={(ids) => setRoster(g.id, round, team.id, ids)}
                            />
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel>
              <h2 className="mb-2 font-head text-pink-600">🏅 게임 MVP 선정</h2>
              {mvpGames.length === 0 ? (
                <p className="font-body text-sm text-gray-400">현재 MVP를 선정할 게임이 없어요. (진행 중이거나 종료된 게임에서 선정)</p>
              ) : (
                <div className="space-y-2">
                  {mvpGames.map((g) => {
                    const cur = log.find((e) => e.gameId === g.id && e.mvp && e.teamId === team.id && !e.voided)
                    return (
                      <MvpRow
                        key={g.id}
                        game={g}
                        team={team}
                        members={members}
                        value={cur?.userId ?? ''}
                      />
                    )
                  })}
                </div>
              )}
            </Panel>
          </>
        )}
      </div>
    </div>
  )
}

function RosterRow({
  label,
  win,
  members,
  max,
  selected,
  onChange,
}: {
  label: string
  win?: string
  members: User[]
  max: number
  selected: string[]
  onChange: (userIds: string[]) => void
}) {
  const toggle = (name: string) => {
    if (selected.includes(name)) onChange(selected.filter((n) => n !== name))
    else if (max === 1) onChange([name])
    else if (selected.length < max) onChange([...selected, name])
  }
  return (
    <div className="rounded-xl bg-white/70 p-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-body text-sm text-gray-600">
          {label}
          {win && <span className="ml-1 text-xs text-gray-400">🏆 {win}</span>}
        </span>
        <span className="font-head text-xs text-gray-400">{selected.length}/{max}명</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {members.map((m) => {
          const on = selected.includes(m.name)
          const full = max > 1 && !on && selected.length >= max
          return (
            <button
              key={m.name}
              disabled={full}
              className={`btn-mini ${on ? 'bg-pink-500 text-white' : ''} ${full ? 'opacity-40' : ''}`}
              onClick={() => toggle(m.name)}
            >
              {m.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MvpRow({
  game,
  team,
  members,
  value,
}: {
  game: Game
  team: Team
  members: User[]
  value: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-pink-50 px-3 py-2">
      <span className="min-w-0 flex-1 truncate font-head text-sm text-pink-700">
        {game.name} <span className="text-xs text-gray-400">(+{game.mvpPoints ?? 50})</span>
      </span>
      <select
        className={`${inputCls} w-32`}
        value={value}
        onChange={(e) => (e.target.value ? setMvp(game, team.id, e.target.value) : clearMvp(game, team.id))}
      >
        <option value="">— MVP 없음 —</option>
        {members.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
      </select>
    </div>
  )
}
