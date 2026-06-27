import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { teamTotals, useGames, useScoreLog, useTeams, useUsers } from '../../lib/game'
import { addUsers, deleteUser, saveTeam, setTeamLeader } from '../../lib/manage'
import type { ScoreLog } from '../../types'
import { Panel, inputCls } from './ui'

export default function TeamDetailPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const teams = useTeams()
  const users = useUsers().filter((u) => !u.isAdmin)
  const log = useScoreLog()
  const games = useGames()

  const team = teams.find((t) => t.id === id)
  const members = users.filter((u) => u.teamId === id)
  const score = teamTotals(log)[id ?? ''] ?? 0

  const history = useMemo(() => {
    const ts = (e: ScoreLog) => (e.createdAt as { seconds?: number })?.seconds ?? 0
    return log.filter((e) => e.teamId === id && !e.voided).sort((a, b) => ts(b) - ts(a))
  }, [log, id])

  const [newMember, setNewMember] = useState('')
  const [name, setName] = useState(team?.name ?? '')
  const [color, setColor] = useState(team?.color ?? '#888')

  if (!team) {
    return (
      <Panel>
        <button className="btn-mini" onClick={() => nav('/admin/participants')}>← 참가자 관리</button>
        <p className="mt-2 font-body text-gray-500">팀을 찾을 수 없어요.</p>
      </Panel>
    )
  }

  const addMember = async () => {
    if (!newMember.trim()) return
    await addUsers([newMember.trim()], team.id)
    setNewMember('')
  }

  return (
    <div className="w-full max-w-2xl space-y-4">
      <Panel>
        <div className="flex items-center justify-between">
          <button className="btn-mini" onClick={() => nav('/admin/participants')}>← 참가자 관리</button>
          <div className="text-right">
            <div className="font-display text-2xl" style={{ color: team.color }}>{team.name}</div>
            <div className="font-head text-pink-600">{score}점 · {members.length}명</div>
          </div>
        </div>
        <div className="mt-3 flex items-end gap-2">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-12 rounded" />
          <input className={`${inputCls} flex-1`} value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn-mini bg-pink-500 text-white" onClick={() => saveTeam(team.id, { name, color })}>팀 저장</button>
        </div>
      </Panel>

      <Panel>
        <h2 className="mb-2 font-head text-lg text-pink-600">팀원 ({members.length})</h2>
        <div className="space-y-1">
          {members.map((u) => {
            const isLeader = team.leaderId === u.name
            return (
              <div key={u.name} className="flex items-center gap-2 rounded-lg bg-pink-50 px-3 py-1.5">
                <span className="min-w-0 flex-1 truncate font-body text-sm">
                  {u.name}
                  {u.nickname && <span className="text-gray-400"> · {u.nickname}</span>}
                  {isLeader && <span className="ml-1 font-head text-xs text-pink-600">👑 팀장</span>}
                </span>
                <button
                  className={`btn-mini ${isLeader ? 'bg-pink-500 text-white' : ''}`}
                  onClick={() => setTeamLeader(team.id, u.name)}
                >
                  팀장
                </button>
                <button className="btn-mini" onClick={() => deleteUser(u.name)}>삭제</button>
              </div>
            )
          })}
          {members.length === 0 && <p className="font-body text-sm text-gray-400">팀원이 없어요</p>}
        </div>
        <div className="mt-2 flex gap-2">
          <input className={`${inputCls} flex-1`} value={newMember} onChange={(e) => setNewMember(e.target.value)} placeholder="팀원 이름" />
          <button className="btn-mini bg-pink-500 text-white" onClick={addMember}>+ 팀원 추가</button>
        </div>
      </Panel>

      <Panel>
        <h2 className="mb-2 font-head text-lg text-pink-600">점수 이력</h2>
        {history.length === 0 ? (
          <p className="font-body text-sm text-gray-400">아직 점수가 없어요</p>
        ) : (
          <div className="space-y-1">
            {history.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-lg bg-pink-50 px-3 py-1.5 font-body text-sm">
                <span>{games.find((g) => g.id === e.gameId)?.name ?? e.gameId}</span>
                <b className="text-pink-600">{e.points > 0 ? `+${e.points}` : e.points}</b>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}
