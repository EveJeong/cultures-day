import { useState } from 'react'
import { useTeams, useUsers } from '../../lib/game'
import {
  addUsers,
  deleteUser,
  resetUserPassword,
  saveTeam,
  setAdminPassword,
  setUserTeam,
} from '../../lib/manage'
import { sha256 } from '../../lib/auth'
import type { Team, TeamId, User } from '../../types'
import { Field, Panel, inputCls } from './ui'

export default function UserTeamPanel() {
  return (
    <>
      <TeamPanel />
      <UserPanel />
      <AdminPanel />
    </>
  )
}

/* ---------- 팀 ---------- */

function TeamPanel() {
  const teams = useTeams()
  return (
    <Panel>
      <h2 className="mb-2 font-head text-lg text-pink-600">팀 관리</h2>
      <div className="space-y-2">
        {teams.map((t) => (
          <TeamRow key={t.id} team={t} />
        ))}
      </div>
    </Panel>
  )
}

function TeamRow({ team }: { team: Team }) {
  const [name, setName] = useState(team.name)
  const [color, setColor] = useState(team.color)
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-12 rounded" />
      <input className={`${inputCls} flex-1`} value={name} onChange={(e) => setName(e.target.value)} />
      <button className="btn-mini bg-pink-500 text-white" onClick={() => saveTeam(team.id, { name, color })}>
        저장
      </button>
    </div>
  )
}

/* ---------- 사용자 ---------- */

function UserPanel() {
  const teams = useTeams()
  const users = useUsers().filter((u) => !u.isAdmin)
  const [teamId, setTeamId] = useState<TeamId>('J')
  const [bulk, setBulk] = useState('')
  const [msg, setMsg] = useState('')

  const submit = async () => {
    const names = bulk.split('\n').map((s) => s.trim()).filter(Boolean)
    if (!names.length) return
    const { added, skipped } = await addUsers(names, teamId)
    setMsg(`${added}명 추가, ${skipped}명 중복 제외`)
    setBulk('')
  }

  return (
    <Panel>
      <h2 className="mb-2 font-head text-lg text-pink-600">사용자 관리 ({users.length})</h2>

      <div className="flex items-end gap-2">
        <Field label="팀">
          <select className={inputCls} value={teamId} onChange={(e) => setTeamId(e.target.value as TeamId)}>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </Field>
        <textarea
          className={`${inputCls} flex-1`}
          rows={3}
          value={bulk}
          onChange={(e) => setBulk(e.target.value)}
          placeholder="이름 한 줄에 하나씩 (일괄 등록)"
        />
      </div>
      <button className="btn-mini mt-2 w-full bg-pink-500 text-white" onClick={submit}>
        등록
      </button>
      {msg && <p className="mt-1 font-body text-xs text-gray-500">{msg}</p>}

      <div className="mt-3 space-y-1">
        {teams.map((t) => (
          <div key={t.id}>
            <p className="font-head text-sm" style={{ color: t.color }}>
              {t.name} ({users.filter((u) => u.teamId === t.id).length})
            </p>
            {users
              .filter((u) => u.teamId === t.id)
              .map((u) => (
                <UserRow key={u.name} user={u} teams={teams} />
              ))}
          </div>
        ))}
      </div>
    </Panel>
  )
}

function UserRow({ user, teams }: { user: User; teams: Team[] }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-pink-50 px-2 py-1">
      <span className="flex-1 truncate font-body text-sm">
        {user.name}
        {user.nickname && <span className="text-gray-400"> · {user.nickname}</span>}
        <span className={user.passwordHash ? 'text-green-600' : 'text-gray-400'}>
          {' '}
          {user.passwordHash ? '· 가입완료' : '· 미가입'}
        </span>
      </span>
      <select
        className="rounded-lg border border-pink-200 p-1 font-body text-xs"
        value={user.teamId}
        onChange={(e) => setUserTeam(user.name, e.target.value as TeamId)}
      >
        {teams.map((t) => (
          <option key={t.id} value={t.id}>{t.id}</option>
        ))}
      </select>
      <button className="btn-mini" onClick={() => resetUserPassword(user.name)}>비번초기화</button>
      <button className="btn-mini" onClick={() => deleteUser(user.name)}>삭제</button>
    </div>
  )
}

/* ---------- 운영자 비번 ---------- */

function AdminPanel() {
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState('')

  const save = async () => {
    if (pw.length < 4) {
      setMsg('4자 이상')
      return
    }
    await setAdminPassword(await sha256(pw))
    setPw('')
    setMsg('운영자 비밀번호 설정됨')
  }

  return (
    <Panel>
      <h2 className="mb-2 font-head text-lg text-pink-600">운영자 계정 (admin)</h2>
      <div className="flex items-end gap-2">
        <Field label="운영자 비밀번호">
          <input className={inputCls} type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </Field>
        <button className="btn-mini bg-pink-500 text-white" onClick={save}>설정</button>
      </div>
      {msg && <p className="mt-1 font-body text-xs text-gray-500">{msg}</p>}
      <p className="mt-1 font-body text-xs text-gray-400">
        이름 "admin" + 이 비밀번호로 로그인하면 운영 페이지 진입
      </p>
    </Panel>
  )
}
