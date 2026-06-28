import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGames, useGameState } from '../../lib/game'
import { loadPresetGames, setGameExcluded } from '../../lib/manage'
import { resetProgress, setWaiting } from '../../lib/admin'
import { getUser, sha256 } from '../../lib/auth'
import type { Game } from '../../types'
import { Panel, inputCls } from './ui'
import GameForm from './GameForm'

export default function GamesPage() {
  const games = useGames()
  const state = useGameState()
  const nav = useNavigate()
  const [adding, setAdding] = useState(false)
  const [sel, setSel] = useState<Set<string>>(new Set())

  const finished = new Set(state?.finishedGameIds ?? [])
  const toggle = (id: string) =>
    setSel((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })

  const excludeSelected = async (excluded: boolean) => {
    await Promise.all([...sel].map((id) => setGameExcluded(id, excluded)))
    setSel(new Set())
  }

  const statusOf = (g: Game) => {
    if (g.excluded) return { label: '제외', cls: 'bg-gray-300 text-gray-600' }
    if (finished.has(g.id)) return { label: '종료', cls: 'bg-gray-200 text-gray-500' }
    if (!state?.waiting && state?.currentGameId === g.id) return { label: '진행중', cls: 'bg-pink-500 text-white' }
    return { label: '예정', cls: 'bg-pink-100 text-pink-600' }
  }

  return (
    <div className="w-full max-w-3xl space-y-4">
      <Panel>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-head text-lg text-pink-600">게임 관리 ({games.length})</h2>
          <div className="flex flex-wrap gap-2">
            {state?.waiting ? (
              <button className="btn-mini bg-pink-500 text-white" onClick={() => setWaiting(false)}>▶ 대기 해제</button>
            ) : (
              <button className="btn-mini" onClick={() => setWaiting(true)}>🛋️ 대기 화면</button>
            )}
            {sel.size > 0 ? (
              <>
                <button className="btn-mini" onClick={() => excludeSelected(true)}>선택 제외 ({sel.size})</button>
                <button className="btn-mini" onClick={() => excludeSelected(false)}>선택 복구</button>
              </>
            ) : (
              <button className="btn-mini" onClick={() => loadPresetGames()}>기본 9게임 불러오기</button>
            )}
            <button className="btn-mini bg-pink-500 text-white" onClick={() => setAdding(true)}>+ 게임 추가</button>
          </div>
        </div>
        {state?.waiting && (
          <p className="mb-2 rounded-xl bg-pink-100 px-3 py-1.5 font-head text-sm text-pink-600">
            🛋️ 대기 화면 표시 중 — 게임 진행 시 자동 해제
          </p>
        )}

        <ul className="space-y-1">
          {games.map((g) => {
            const st = statusOf(g)
            return (
              <li
                key={g.id}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 ${g.excluded ? 'bg-gray-100 opacity-70' : 'bg-pink-50'}`}
              >
                <input type="checkbox" checked={sel.has(g.id)} onChange={() => toggle(g.id)} className="h-4 w-4" />
                <button className="min-w-0 flex-1 truncate text-left font-body" onClick={() => nav(`/admin/games/${g.id}`)}>
                  <b className="text-pink-600">{g.order}.</b> {g.name}
                  <span className="ml-1 text-xs text-gray-400">({g.engineType}/{g.scoringType})</span>
                </button>
                <span className={`rounded-full px-2 py-0.5 font-head text-xs ${st.cls}`}>{st.label}</span>
                <button className="btn-mini" onClick={() => nav(`/admin/games/${g.id}`)}>상세</button>
              </li>
            )
          })}
        </ul>
      </Panel>

      {adding && (
        <GameForm
          game={null}
          nextOrder={games.length + 1}
          onClose={(id) => {
            setAdding(false)
            if (id) nav(`/admin/games/${id}`)
          }}
        />
      )}

      <ResetPanel />
    </div>
  )
}

/** 게임 진행 초기화 — 운영자 비밀번호 확인 후 점수/진행 상태만 리셋 */
function ResetPanel() {
  const [confirming, setConfirming] = useState(false)
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const doReset = async () => {
    setBusy(true)
    setErr('')
    try {
      const admin = await getUser('admin')
      const h = await sha256(pw)
      if (!admin || admin.passwordHash !== h) {
        setErr('운영자 비밀번호가 일치하지 않습니다.')
        return
      }
      await resetProgress()
      setConfirming(false)
      setPw('')
      setDone(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel>
      <h2 className="font-head text-lg text-red-500">게임 진행 초기화</h2>
      <p className="mt-1 font-body text-sm text-gray-500">
        모든 점수 이력과 진행/종료 상태를 초기화합니다.
        <br />
        <b>게임 설정·순서·콘텐츠·참가자는 그대로 유지</b>됩니다.
      </p>

      {!confirming ? (
        <button
          className="btn-mini mt-2 border-red-300 bg-red-100 text-red-600"
          onClick={() => {
            setConfirming(true)
            setDone(false)
            setErr('')
          }}
        >
          게임 진행 초기화
        </button>
      ) : (
        <div className="mt-2 space-y-2 rounded-2xl border-2 border-red-200 p-3">
          <p className="font-head text-sm text-red-500">
            정말 초기화할까요? 되돌릴 수 없습니다. 운영자 비밀번호를 입력하세요.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              className={`${inputCls} flex-1`}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="운영자 비밀번호"
              onKeyDown={(e) => e.key === 'Enter' && pw && doReset()}
            />
            <button className="btn-mini bg-red-500 text-white" disabled={busy || !pw} onClick={doReset}>
              초기화 확인
            </button>
            <button
              className="btn-mini"
              onClick={() => {
                setConfirming(false)
                setPw('')
                setErr('')
              }}
            >
              취소
            </button>
          </div>
          {err && <p className="font-body text-sm text-red-500">{err}</p>}
        </div>
      )}
      {done && <p className="mt-2 font-body text-sm text-green-600">✅ 초기화 완료!</p>}
    </Panel>
  )
}
