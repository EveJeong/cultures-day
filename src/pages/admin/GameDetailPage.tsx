import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useGames, useGameState } from '../../lib/game'
import { finishGame, reopenGame, setCurrentGame } from '../../lib/admin'
import { Panel } from './ui'
import GameForm from './GameForm'
import QuizContent from './content/QuizContent'
import PromptContent from './content/PromptContent'

/** 게임 상세 — 편집(설정·콘텐츠) 전용. 진행은 상단 [게임 진행] → /run */
export default function GameDetailPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const games = useGames()
  const state = useGameState()
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

  const finished = (state.finishedGameIds ?? []).includes(game.id)

  const run = async () => {
    await setCurrentGame(game.id)
    nav(`/admin/games/${game.id}/run`)
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

        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {game.excluded ? (
            <span className="font-head text-sm text-gray-500">제외된 게임 — 목록에서 복구하세요</span>
          ) : (
            <>
              <button className="btn-mini bg-pink-500 text-white" onClick={run}>
                {finished ? '배점 수정 (진행)' : '게임 진행'}
              </button>
              {finished ? (
                <button className="btn-mini" onClick={() => reopenGame(game.id)}>종료 취소</button>
              ) : (
                <button className="btn-mini" onClick={() => finishGame(game.id)}>종료</button>
              )}
            </>
          )}
        </div>
        {finished && (
          <p className="mt-2 text-center font-body text-xs text-gray-400">
            종료된 게임 — 콘텐츠는 잠기고 배점만 수정 가능
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
          <div className="mt-2 space-y-1 font-body text-sm text-gray-600">
            <div className="whitespace-pre-line">규칙: {game.description || '—'}</div>
            <div className="whitespace-pre-line">점수 산정: {game.scoringExplanation || '—'}</div>
          </div>
        )}
      </Panel>

      {/* 콘텐츠 — 종료 게임은 잠금 */}
      {!finished && game.engineType === 'quiz' && <QuizContent gameId={game.id} />}
      {!finished && game.engineType === 'prompt' && <PromptContent gameId={game.id} />}
    </div>
  )
}
