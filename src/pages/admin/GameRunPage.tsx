import { useNavigate, useParams } from 'react-router-dom'
import { useGames, useGameState, useScoreLog, useTeams } from '../../lib/game'
import { finishGame, setCurrentGame } from '../../lib/admin'
import { Panel } from './ui'
import { GameRunner } from './ProgressTab'

/** 게임 진행 관리 — /admin/games/:id/run */
export default function GameRunPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const games = useGames()
  const state = useGameState()
  const teams = useTeams()
  const log = useScoreLog()

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

  // 현재 진행 게임이 아니면 시작 안내 (실수 리셋 방지)
  if (state.currentGameId !== game.id) {
    return (
      <Panel>
        <button className="btn-mini" onClick={() => nav(`/admin/games/${game.id}`)}>← 상세</button>
        <p className="my-3 text-center font-head text-pink-600">{game.name}</p>
        <button
          className="btn-mini w-full bg-pink-500 text-white"
          onClick={() => setCurrentGame(game.id)}
        >
          이 게임 진행 시작
        </button>
      </Panel>
    )
  }

  return (
    <GameRunner
      game={game}
      state={state}
      teams={teams}
      log={log}
      games={games}
      onBack={() => nav(`/admin/games/${game.id}`)}
      onFinish={async () => {
        await finishGame(game.id)
        nav(`/admin/games/${game.id}`)
      }}
    />
  )
}
