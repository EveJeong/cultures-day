import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGames, useGameState } from '../../lib/game'
import { loadPresetGames, setGameExcluded } from '../../lib/manage'
import { setWaiting } from '../../lib/admin'
import type { Game } from '../../types'
import { Panel } from './ui'
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
    </div>
  )
}
