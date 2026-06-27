import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useGames, useGameState, useScoreLog, useTeams } from '../../lib/game'
import { finishGame, setCurrentGame } from '../../lib/admin'
import { Panel } from './ui'
import GameForm from './GameForm'
import { GameRunner } from './ProgressTab'

export default function GameDetailPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const games = useGames()
  const state = useGameState()
  const teams = useTeams()
  const log = useScoreLog()
  const [editing, setEditing] = useState(false)

  const game = games.find((g) => g.id === id)
  if (!state) return <p className="font-head text-white">불러오는 중…</p>
  if (!game) {
    return (
      <Panel>
        <p className="font-body text-gray-500">게임을 찾을 수 없어요.</p>
        <button className="btn-mini mt-2" onClick={() => nav('/admin')}>← 목록</button>
      </Panel>
    )
  }

  const isRunning = state.currentGameId === game.id
  const finished = (state.finishedGameIds ?? []).includes(game.id)

  // 진행 중이면 GameRunner 화면(자체 헤더 포함)
  if (isRunning) {
    return (
      <GameRunner
        game={game}
        state={state}
        teams={teams}
        log={log}
        games={games}
        onBack={() => nav('/admin')}
        onFinish={async () => {
          await finishGame(game.id)
          nav('/admin')
        }}
      />
    )
  }

  return (
    <div className="w-full max-w-2xl space-y-4">
      <Panel>
        <div className="flex items-center justify-between gap-2">
          <button className="btn-mini" onClick={() => nav('/admin')}>← 목록</button>
          <div className="text-center">
            <div className="font-display text-2xl text-pink-600">{game.name}</div>
            <div className="font-body text-xs text-gray-400">{game.engineType} · {game.scoringType}</div>
          </div>
          <span className="w-14" />
        </div>

        <div className="mt-3 flex justify-center gap-2">
          {game.excluded ? (
            <span className="font-head text-sm text-gray-500">제외된 게임 (목록에서 복구하세요)</span>
          ) : (
            <button className="btn-mini bg-pink-500 text-white" onClick={() => setCurrentGame(game.id)}>
              {finished ? '배점 수정 (다시 진행)' : '게임 진행'}
            </button>
          )}
        </div>
        {finished && (
          <p className="mt-2 text-center font-body text-xs text-gray-400">
            종료된 게임 — 진행 시 배점 수정 위주로 사용하세요
          </p>
        )}
      </Panel>

      <Panel>
        <div className="flex items-center justify-between">
          <h2 className="font-head text-lg text-pink-600">게임 설정</h2>
          <button className="btn-mini" onClick={() => setEditing((v) => !v)}>{editing ? '닫기' : '편집'}</button>
        </div>
        {editing ? (
          <div className="mt-2">
            <GameForm game={game} nextOrder={game.order} onClose={() => setEditing(false)} />
          </div>
        ) : (
          <div className="mt-2 font-body text-sm text-gray-600">
            <div>규칙: {game.description || '—'}</div>
            <div>점수 산정: {game.scoringExplanation || '—'}</div>
          </div>
        )}
      </Panel>

      <Panel>
        <h2 className="mb-1 font-head text-lg text-pink-600">콘텐츠</h2>
        <p className="font-body text-sm text-gray-400">
          문제·제시어·이미지 편집은 이 페이지로 통합 예정입니다. (다음 단계)
        </p>
      </Panel>
    </div>
  )
}
