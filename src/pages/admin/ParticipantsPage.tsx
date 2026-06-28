import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { teamTotals, useScoreLog, useTeams, useUsers } from '../../lib/game'
import { addTeam, addUsers, deleteTeam, deleteUser, setAdminPassword } from '../../lib/manage'
import { awardBonus } from '../../lib/admin'
import { sha256 } from '../../lib/auth'
import type { Team } from '../../types'
import { Field, Panel, inputCls } from './ui'

export default function ParticipantsPage() {
  return (
    <div className="w-full max-w-2xl space-y-4">
      <TeamsSection />
      <ParticipantsSection />
      <AdminPasswordPanel />
    </div>
  )
}

function AdminPasswordPanel() {
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState('')
  const save = async () => {
    if (pw.length < 4) return setMsg('4자 이상')
    await setAdminPassword(await sha256(pw))
    setPw('')
    setMsg('운영자 비밀번호 설정됨')
  }
  return (
    <Panel>
      <h2 className="mb-2 font-head text-lg text-pink-600">운영자 계정 (admin)</h2>
      <div className="flex items-end gap-2">
        <input className={`${inputCls} flex-1`} type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="운영자 비밀번호" />
        <button className="btn-mini bg-pink-500 text-white" onClick={save}>설정</button>
      </div>
      {msg && <p className="mt-1 font-body text-xs text-gray-500">{msg}</p>}
    </Panel>
  )
}

/* ---------- 팀 ---------- */

function TeamsSection() {
  const teams = useTeams()
  const users = useUsers().filter((u) => !u.isAdmin)
  const totals = teamTotals(useScoreLog())
  const nav = useNavigate()

  const [name, setName] = useState('')
  const [color, setColor] = useState('#e84393')

  const add = async () => {
    if (!name.trim()) return
    await addTeam(name.trim(), color)
    setName('')
  }

  return (
    <Panel>
      <h2 className="mb-2 font-head text-lg text-pink-600">팀 ({teams.length})</h2>

      <div className="space-y-1">
        {teams.map((t) => (
          <TeamRow
            key={t.id}
            team={t}
            count={users.filter((u) => u.teamId === t.id).length}
            score={totals[t.id] ?? 0}
            onDetail={() => nav(`/admin/teams/${t.id}`)}
          />
        ))}
      </div>

      <div className="mt-3 flex items-end gap-2">
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 w-12 rounded" />
        <input className={`${inputCls} flex-1`} value={name} onChange={(e) => setName(e.target.value)} placeholder="새 팀 이름" />
        <button className="btn-mini bg-pink-500 text-white" onClick={add}>+ 팀 추가</button>
      </div>
    </Panel>
  )
}

/** 팀 한 줄 — 상세/삭제 + 보너스 점수(사유·배점) 입력 */
function TeamRow({
  team,
  count,
  score,
  onDetail,
}: {
  team: Team
  count: number
  score: number
  onDetail: () => void
}) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [pts, setPts] = useState('')
  const [busy, setBusy] = useState(false)

  const apply = async () => {
    const n = Number(pts)
    if (!n) return
    setBusy(true)
    try {
      await awardBonus(team.id, n, reason.trim())
      setReason('')
      setPts('')
      setOpen(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl bg-pink-50 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="h-5 w-5 rounded-full" style={{ background: team.color }} />
        <button className="min-w-0 flex-1 truncate text-left font-head" onClick={onDetail}>
          {team.name}
        </button>
        <span className="font-body text-sm text-gray-500">{count}명 · {score}점</span>
        <button className={`btn-mini ${open ? 'bg-yellow-300' : ''}`} onClick={() => setOpen((v) => !v)}>
          보너스
        </button>
        <button className="btn-mini" onClick={onDetail}>상세</button>
        <button className="btn-mini" onClick={() => deleteTeam(team.id)}>삭제</button>
      </div>

      {open && (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border-2 border-yellow-200 bg-white p-2">
          <input
            className={`${inputCls} min-w-0 flex-1`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="사유 (예: 응원상)"
          />
          <input
            type="number"
            className={`${inputCls} w-24`}
            value={pts}
            onChange={(e) => setPts(e.target.value)}
            placeholder="배점"
            onKeyDown={(e) => e.key === 'Enter' && apply()}
          />
          <button className="btn-mini bg-pink-500 text-white" disabled={busy || !pts} onClick={apply}>
            부여
          </button>
        </div>
      )}
    </div>
  )
}

/* ---------- 참여자 ---------- */

function ParticipantsSection() {
  const teams = useTeams()
  const users = useUsers().filter((u) => !u.isAdmin)
  const teamName = (id: string) => teams.find((t) => t.id === id)?.name ?? id

  const [name, setName] = useState('')
  const [teamId, setTeamId] = useState('')
  const effectiveTeam = teams.some((t) => t.id === teamId) ? teamId : (teams[0]?.id ?? '')

  const add = async () => {
    if (!name.trim() || !effectiveTeam) return
    await addUsers([name.trim()], effectiveTeam)
    setName('')
  }

  return (
    <Panel>
      <h2 className="mb-2 font-head text-lg text-pink-600">참여자 ({users.length})</h2>

      <div className="flex items-end gap-2">
        <input className={`${inputCls} flex-1`} value={name} onChange={(e) => setName(e.target.value)} placeholder="참여자 이름" />
        <Field label="팀">
          <select className={inputCls} value={effectiveTeam} onChange={(e) => setTeamId(e.target.value)}>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>
        <button className="btn-mini bg-pink-500 text-white" onClick={add}>+ 추가</button>
      </div>

      <ul className="mt-3 space-y-1">
        {users.map((u) => (
          <li key={u.name} className="flex items-center gap-2 rounded-lg bg-pink-50 px-3 py-1.5">
            <span className="min-w-0 flex-1 truncate font-body text-sm">
              {u.name}
              {u.nickname && <span className="text-gray-400"> · {u.nickname}</span>}
              <span className="ml-1 text-xs text-pink-500">[{teamName(u.teamId)}]</span>
              {!u.passwordHash && <span className="ml-1 text-xs text-gray-400">미가입</span>}
            </span>
            <button className="btn-mini" onClick={() => deleteUser(u.name)}>삭제</button>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
