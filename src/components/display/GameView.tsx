import { useGames, useGameState, useScoreLog, useTeams } from '../../lib/game'
import { elapsedSec, fmt, remainingSec, useNow } from '../../lib/timer'
import type { Game, TeamId, TimerState } from '../../types'
import Leaderboard from '../Leaderboard'
import QuizScreen from './QuizScreen'
import PromptScreen from './PromptScreen'
import { RosterTeamView, RosterEventView } from './RosterView'

/** phase × engineType 디스패처 (designs/03 §3) */
export default function GameView({ myTeamId }: { myTeamId?: TeamId | null }) {
  const state = useGameState()
  const game = useGames().find((g) => g.id === state?.currentGameId)

  if (!state || !game) return <p className="wordart wordart-white text-4xl">불러오는 중…</p>

  if (state.phase === 'intro') return <IntroView game={game} />
  if (state.phase === 'result') return <ResultView game={game} myTeamId={myTeamId} />

  // playing
  return (
    <div className="flex h-full min-h-0 w-full flex-col items-center justify-center gap-3">
      {/* 로스터 게임은 자체 화면에서 표시(릴레이는 큰 스톱워치 포함) */}
      {!game.format && <TimerView timer={state.timer} />}
      <div className="flex min-h-0 w-full flex-1 items-center justify-center">
        {game.format === 'roster-team' ? (
          <RosterTeamView game={game} />
        ) : game.format === 'roster-event' ? (
          <RosterEventView game={game} />
        ) : game.engineType === 'quiz' ? (
          <QuizScreen />
        ) : game.engineType === 'prompt' ? (
          <PromptScreen />
        ) : (
          <GenericPlaying game={game} />
        )}
      </div>
    </div>
  )
}

function TimerView({ timer }: { timer: TimerState }) {
  const running = timer.status === 'running'
  const now = useNow(running)
  if (!timer.mode || timer.status === 'idle') return null
  const val = timer.mode === 'countdown' ? remainingSec(timer, now) : elapsedSec(timer, now)
  const danger = timer.mode === 'countdown' && val <= 60
  return (
    <div
      className={`wordart text-7xl ${danger ? 'wordart-blue' : 'wordart-white'} ${
        timer.status === 'finished' ? 'animate-pulse' : ''
      }`}
      style={danger ? { color: '#ff2d2d' } : undefined}
    >
      {fmt(val)}
    </div>
  )
}

function IntroView({ game }: { game: Game }) {
  return (
    <div className="flex max-w-3xl flex-col items-center gap-6 text-center">
      <h1 className="wordart wordart-yellow text-7xl">{game.name}</h1>
      {game.description && (
        <p className="whitespace-pre-line rounded-3xl bg-white/90 p-6 font-head text-2xl text-gray-700">
          {game.description}
        </p>
      )}
      {game.scoringExplanation && (
        <div className="rounded-3xl bg-white/80 px-6 py-4">
          <p className="font-head text-lg text-pink-600">점수 산정 방식</p>
          <p className="whitespace-pre-line font-body text-xl text-gray-700">{game.scoringExplanation}</p>
        </div>
      )}
    </div>
  )
}

function GenericPlaying({ game }: { game: Game }) {
  return (
    <div className="flex max-w-3xl flex-col items-center gap-5 text-center">
      <h1 className="wordart wordart-yellow text-6xl">{game.name}</h1>
      <p className="wordart wordart-white text-3xl">진행 중!</p>
      {game.scoringExplanation && (
        <p className="whitespace-pre-line rounded-3xl bg-white/85 px-6 py-3 font-body text-xl text-gray-700">
          {game.scoringExplanation}
        </p>
      )}
    </div>
  )
}

function ResultView({ game, myTeamId }: { game: Game; myTeamId?: TeamId | null }) {
  const teams = useTeams()
  const log = useScoreLog()

  const earned: Record<string, number> = {}
  for (const e of log) {
    if (e.voided || e.gameId !== game.id) continue
    earned[e.teamId] = (earned[e.teamId] ?? 0) + (e.points ?? 0)
  }

  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-5 text-center">
      <h1 className="wordart wordart-yellow text-5xl">{game.name} 결과</h1>
      <div className="flex gap-3">
        {teams.map((t) => (
          <div key={t.id} className="rounded-2xl px-5 py-3 shadow-lg" style={{ background: t.color }}>
            <div className="font-head text-white">{t.name}</div>
            <div className="font-display text-3xl text-white">+{earned[t.id] ?? 0}</div>
          </div>
        ))}
      </div>
      <p className="wordart wordart-white text-2xl">전체 순위</p>
      <Leaderboard myTeamId={myTeamId} />
    </div>
  )
}
