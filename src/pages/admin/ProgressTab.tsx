import { useMemo, useState } from 'react'
import { useGameState, useGames, useScoreLog, useTeams } from '../../lib/game'
import {
  awardFree,
  awardIncrement,
  awardRank,
  finishGame,
  pauseTimer,
  resetTimer,
  resumeTimer,
  setCurrentGame,
  setPhase,
  setVoided,
  startTimer,
} from '../../lib/admin'
import { elapsedSec, fmt, remainingSec, useNow } from '../../lib/timer'
import type { Game, GameState, Phase, ScoreLog, Team, TeamId } from '../../types'
import { Panel } from './ui'
import QuizEngine from './QuizEngine'
import PromptEngine from './PromptEngine'

const PHASES: Phase[] = ['intro', 'playing', 'result']
const PHASE_LABEL: Record<Phase, string> = { intro: '소개', playing: '진행', result: '결과' }

export default function ProgressTab() {
  const state = useGameState()
  const games = useGames()
  const teams = useTeams()
  const log = useScoreLog()
  const [view, setView] = useState<'list' | 'game'>('list')

  if (!state) return <p className="font-head text-white">불러오는 중…</p>
  const game = games.find((g) => g.id === state.currentGameId)

  if (view === 'list' || !game) {
    return (
      <GameList
        games={games}
        state={state}
        onStart={async (g) => {
          await setCurrentGame(g.id)
          setView('game')
        }}
        onResume={() => setView('game')}
      />
    )
  }

  return (
    <GameRunner
      game={game}
      state={state}
      teams={teams}
      log={log}
      games={games}
      onBack={() => setView('list')}
      onFinish={async () => {
        await finishGame(game.id)
        setView('list')
      }}
    />
  )
}

/* ---------- 게임 목록 ---------- */

function GameList({
  games,
  state,
  onStart,
  onResume,
}: {
  games: Game[]
  state: GameState
  onStart: (g: Game) => void
  onResume: () => void
}) {
  const finished = new Set(state.finishedGameIds ?? [])
  return (
    <div className="w-full max-w-2xl">
      <Panel>
        <h2 className="mb-2 font-head text-lg text-pink-600">게임 목록</h2>
        <ul className="space-y-1">
          {games.map((g) => {
            const isCurrent = g.id === state.currentGameId
            const done = finished.has(g.id)
            const status = done ? '완료' : isCurrent ? '진행중' : '예정'
            const badge = done
              ? 'bg-gray-200 text-gray-500'
              : isCurrent
                ? 'bg-pink-500 text-white'
                : 'bg-pink-100 text-pink-600'
            return (
              <li key={g.id} className="flex items-center gap-2 rounded-xl bg-pink-50 px-3 py-2">
                <span className="min-w-0 flex-1 truncate font-body">
                  <b className="text-pink-600">{g.order}.</b> {g.name}
                  <span className="ml-1 text-xs text-gray-400">({g.engineType}/{g.scoringType})</span>
                </span>
                <span className={`rounded-full px-2 py-0.5 font-head text-xs ${badge}`}>{status}</span>
                <button
                  className="btn-mini bg-pink-500 text-white"
                  onClick={() => (isCurrent ? onResume() : onStart(g))}
                >
                  {isCurrent ? '이어서 진행' : '게임 시작'}
                </button>
              </li>
            )
          })}
        </ul>
      </Panel>
    </div>
  )
}

/* ---------- 게임 진행 (가이드 단계) ---------- */

export function GameRunner({
  game,
  state,
  teams,
  log,
  games,
  onBack,
  onFinish,
}: {
  game: Game
  state: GameState
  teams: Team[]
  log: ScoreLog[]
  games: Game[]
  onBack: () => void
  onFinish: () => void
}) {
  const phase = state.phase
  const i = PHASES.indexOf(phase)

  return (
    <div className="w-full max-w-2xl space-y-4">
      <Panel>
        <div className="flex items-center justify-between gap-2">
          <button className="btn-mini" onClick={onBack}>← 목록</button>
          <div className="text-center">
            <div className="font-display text-2xl text-pink-600">{game.name}</div>
            <div className="font-body text-xs text-gray-400">{game.engineType} · {game.scoringType}</div>
          </div>
          <span className="w-14" />
        </div>

        <div className="mt-3 flex items-center justify-center gap-2">
          {PHASES.map((p, idx) => (
            <span
              key={p}
              className={`rounded-full px-3 py-1 font-head text-sm ${
                p === phase ? 'bg-pink-500 text-white' : 'bg-pink-100 text-pink-500'
              }`}
            >
              {idx + 1}. {PHASE_LABEL[p]}
            </span>
          ))}
        </div>

        <div className="mt-3 flex justify-center gap-2">
          <button className="btn-mini" disabled={i <= 0} onClick={() => setPhase(PHASES[i - 1])}>
            ← 이전 단계
          </button>
          <button
            className="btn-mini bg-pink-500 text-white"
            disabled={i >= PHASES.length - 1}
            onClick={() => setPhase(PHASES[i + 1])}
          >
            다음 단계 →
          </button>
        </div>
      </Panel>

      {phase === 'intro' && (
        <>
          <Panel>
            <h2 className="mb-2 font-head text-lg text-pink-600">게임 소개</h2>
            {game.description && <p className="font-body text-gray-700">{game.description}</p>}
            {game.scoringExplanation && (
              <p className="mt-2 rounded-xl bg-pink-50 px-3 py-2 font-body text-sm text-pink-700">
                점수 산정: {game.scoringExplanation}
              </p>
            )}
          </Panel>
          <TimerPanel game={game} state={state} />
        </>
      )}

      {phase === 'playing' && (
        <>
          <TimerPanel game={game} state={state} />
          <Panel>
            <h2 className="mb-2 font-head text-lg text-pink-600">{playingTitle(game)}</h2>
            <ScorePanel game={game} teams={teams} />
          </Panel>
        </>
      )}

      {phase === 'result' && <ResultStage game={game} teams={teams} log={log} onFinish={onFinish} />}

      {(phase === 'playing' || phase === 'result') && (
        <Panel>
          <h2 className="mb-2 font-head text-lg text-pink-600">최근 점수 (되돌리기)</h2>
          <RecentScores log={log} teams={teams} games={games} />
        </Panel>
      )}
    </div>
  )
}

function playingTitle(game: Game): string {
  return game.engineType === 'quiz' ? '퀴즈 진행' : game.engineType === 'prompt' ? '제시어 진행' : '점수 배정'
}

function ResultStage({
  game,
  teams,
  log,
  onFinish,
}: {
  game: Game
  teams: Team[]
  log: ScoreLog[]
  onFinish: () => void
}) {
  const earned: Record<string, number> = {}
  for (const e of log) {
    if (e.voided || e.gameId !== game.id) continue
    earned[e.teamId] = (earned[e.teamId] ?? 0) + (e.points ?? 0)
  }
  return (
    <Panel>
      <h2 className="mb-2 font-head text-lg text-pink-600">결과 — 이 게임 획득 점수</h2>
      <div className="flex gap-2">
        {teams.map((t) => (
          <div key={t.id} className="flex-1 rounded-2xl px-3 py-3 text-center text-white" style={{ background: t.color }}>
            <div className="font-head">{t.name}</div>
            <div className="font-display text-2xl">+{earned[t.id] ?? 0}</div>
          </div>
        ))}
      </div>
      <button className="btn-mini mt-3 w-full bg-pink-500 text-white" onClick={onFinish}>
        게임 종료
      </button>
    </Panel>
  )
}

/* ---------- 점수 배정 (유형별) ---------- */

function ScorePanel({ game, teams }: { game: Game; teams: Team[] }) {
  if (game.engineType === 'quiz') return <QuizEngine game={game} />
  if (game.engineType === 'prompt') return <PromptEngine game={game} />

  if (game.scoringType === 'increment') {
    const opts = game.incrementOptions ?? [10]
    return (
      <div className="space-y-2">
        {teams.map((t) => (
          <div key={t.id} className="flex items-center gap-2">
            <span className="w-16 truncate font-head">{t.name}</span>
            {opts.map((n) => (
              <button key={n} className="btn-mini" onClick={() => awardIncrement(game, t.id, n)}>
                +{n}
              </button>
            ))}
          </div>
        ))}
      </div>
    )
  }
  if (game.scoringType === 'rank') return <RankControl game={game} teams={teams} />
  if (game.scoringType === 'free') return <FreeControl game={game} teams={teams} />
  return null
}

function RankControl({ game, teams }: { game: Game; teams: Team[] }) {
  const [ranks, setRanks] = useState<Record<TeamId, 1 | 2 | 3>>({})
  const [round, setRound] = useState(game.rounds?.[0] ?? 'main')
  const rp = game.rankPoints

  return (
    <div className="space-y-2">
      {game.rounds && game.rounds.length > 0 && (
        <select className="w-full rounded-xl border-2 border-pink-200 p-2 font-body" value={round} onChange={(e) => setRound(e.target.value)}>
          {game.rounds.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      )}
      {teams.map((t) => (
        <div key={t.id} className="flex items-center gap-2">
          <span className="w-16 truncate font-head">{t.name}</span>
          {([1, 2, 3] as const).map((r) => (
            <button
              key={r}
              className={`btn-mini ${ranks[t.id] === r ? 'bg-pink-500 text-white' : ''}`}
              onClick={() => setRanks((prev) => ({ ...prev, [t.id]: r }))}
            >
              {r}등{rp ? ` (${rp[r]})` : ''}
            </button>
          ))}
        </div>
      ))}
      <button className="btn-mini w-full bg-pink-500 text-white" onClick={() => awardRank(game, ranks, round)}>
        순위 확정 ({round})
      </button>
    </div>
  )
}

function FreeControl({ game, teams }: { game: Game; teams: Team[] }) {
  const [pts, setPts] = useState<Record<TeamId, string>>({})
  const val = (id: TeamId) => pts[id] ?? ''
  const sum = teams.reduce((s, t) => s + (Number(val(t.id)) || 0), 0)
  const total = game.totalPoints
  const mismatch = total != null && sum !== total

  return (
    <div className="space-y-2">
      {teams.map((t) => (
        <div key={t.id} className="flex items-center gap-2">
          <span className="w-16 truncate font-head">{t.name}</span>
          <input
            type="number"
            className="flex-1 rounded-xl border-2 border-pink-200 p-2 font-body"
            value={val(t.id)}
            onChange={(e) => setPts((prev) => ({ ...prev, [t.id]: e.target.value }))}
          />
        </div>
      ))}
      {total != null && (
        <p className={`font-body text-sm ${mismatch ? 'text-red-500' : 'text-green-600'}`}>
          합계 {sum} / 총배점 {total} {mismatch ? '— 불일치' : '✓'}
        </p>
      )}
      <button
        className="btn-mini w-full bg-pink-500 text-white disabled:opacity-40"
        disabled={mismatch}
        onClick={() =>
          awardFree(
            game,
            Object.fromEntries(teams.map((t) => [t.id, Number(val(t.id)) || 0])) as Partial<Record<TeamId, number>>,
          )
        }
      >
        배분
      </button>
    </div>
  )
}

/* ---------- 타이머 ---------- */

function TimerPanel({ game, state }: { game: Game; state: GameState }) {
  return (
    <Panel>
      <h2 className="mb-2 font-head text-lg text-pink-600">타이머</h2>
      <TimerControl game={game} state={state} />
    </Panel>
  )
}

function TimerControl({ game, state }: { game: Game; state: GameState }) {
  const timer = state.timer
  const running = timer.status === 'running'
  const now = useNow(running)
  const defMode = game.timer?.mode
  const defDur = game.timer?.durationSec
  const display = timer.mode
    ? timer.mode === 'countdown'
      ? remainingSec(timer, now)
      : elapsedSec(timer, now)
    : null

  return (
    <div className="space-y-2">
      <div className="text-center font-display text-3xl text-pink-600">
        {display != null ? fmt(display) : '—'}
        <span className="ml-2 font-body text-sm text-gray-400">{timer.status}</span>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {defMode && (
          <button className="btn-mini bg-pink-500 text-white" onClick={() => startTimer(defMode, defDur)}>
            시작 ({defMode === 'countdown' ? fmt(defDur ?? 0) : '스톱워치'})
          </button>
        )}
        <button className="btn-mini" onClick={() => startTimer('countdown', 60)}>1분</button>
        <button className="btn-mini" onClick={() => startTimer('stopwatch')}>스톱워치</button>
        {running && (
          <button className="btn-mini" onClick={() => pauseTimer(elapsedSec(timer, Date.now()))}>일시정지</button>
        )}
        {timer.status === 'paused' && (
          <button className="btn-mini" onClick={() => resumeTimer()}>재개</button>
        )}
        <button className="btn-mini" onClick={() => resetTimer(defMode ?? null)}>리셋</button>
      </div>
    </div>
  )
}

/* ---------- 되돌리기 ---------- */

function RecentScores({ log, teams, games }: { log: ScoreLog[]; teams: Team[]; games: Game[] }) {
  const recent = useMemo(() => {
    const ts = (e: ScoreLog) => (e.createdAt as { seconds?: number })?.seconds ?? 0
    return [...log].sort((a, b) => ts(b) - ts(a)).slice(0, 8)
  }, [log])

  if (recent.length === 0) return <p className="font-body text-sm text-gray-400">아직 부여된 점수가 없어요</p>

  return (
    <div className="space-y-1">
      {recent.map((e) => {
        const team = teams.find((t) => t.id === e.teamId)
        const game = games.find((g) => g.id === e.gameId)
        return (
          <div
            key={e.id}
            className={`flex items-center justify-between gap-2 rounded-xl px-3 py-1.5 ${
              e.voided ? 'bg-gray-100 line-through opacity-50' : 'bg-pink-50'
            }`}
          >
            <span className="font-body text-sm">
              {game?.name} · {team?.name} <b>{e.points > 0 ? `+${e.points}` : e.points}</b>
            </span>
            <button className="btn-mini" onClick={() => setVoided(e.id, !e.voided)}>
              {e.voided ? '복구' : '취소'}
            </button>
          </div>
        )
      })}
    </div>
  )
}
