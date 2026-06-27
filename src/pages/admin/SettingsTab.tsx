import { useState } from 'react'
import { useGames } from '../../lib/game'
import { deleteGame, loadPresetGames, newGameId, saveGame } from '../../lib/manage'
import type { EngineType, Game, ScoringType } from '../../types'
import { Field, Panel, inputCls } from './ui'

const ENGINES: EngineType[] = ['none', 'quiz', 'prompt']
const SCORINGS: ScoringType[] = ['rank', 'increment', 'free', 'quiz']

export default function SettingsTab() {
  const games = useGames()
  const [editing, setEditing] = useState<Game | 'new' | null>(null)

  const swap = async (a: Game, b: Game) => {
    await saveGame(a.id, { ...stripId(a), order: b.order })
    await saveGame(b.id, { ...stripId(b), order: a.order })
  }

  return (
    <div className="w-full max-w-2xl space-y-4">
      <Panel>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-head text-lg text-pink-600">게임 관리 ({games.length})</h2>
          <div className="flex gap-2">
            <button className="btn-mini" onClick={() => loadPresetGames()}>
              기본 9게임 불러오기
            </button>
            <button className="btn-mini bg-pink-500 text-white" onClick={() => setEditing('new')}>
              + 새 게임
            </button>
          </div>
        </div>

        <ul className="space-y-1">
          {games.map((g, i) => (
            <li key={g.id} className="flex items-center gap-2 rounded-xl bg-pink-50 px-3 py-1.5">
              <span className="flex-1 truncate font-body text-sm">
                <b className="text-pink-600">{g.order}.</b> {g.name}{' '}
                <span className="text-gray-400">
                  ({g.engineType}/{g.scoringType})
                </span>
              </span>
              <button className="btn-mini" disabled={i === 0} onClick={() => swap(g, games[i - 1])}>
                ▲
              </button>
              <button
                className="btn-mini"
                disabled={i === games.length - 1}
                onClick={() => swap(g, games[i + 1])}
              >
                ▼
              </button>
              <button className="btn-mini" onClick={() => setEditing(g)}>
                편집
              </button>
              <button className="btn-mini" onClick={() => deleteGame(g.id)}>
                삭제
              </button>
            </li>
          ))}
        </ul>
      </Panel>

      {editing && (
        <GameForm
          game={editing === 'new' ? null : editing}
          nextOrder={games.length + 1}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function stripId(g: Game): Omit<Game, 'id'> {
  const { id: _id, ...rest } = g
  return rest
}

function GameForm({
  game,
  nextOrder,
  onClose,
}: {
  game: Game | null
  nextOrder: number
  onClose: () => void
}) {
  const [name, setName] = useState(game?.name ?? '')
  const [description, setDescription] = useState(game?.description ?? '')
  const [explain, setExplain] = useState(game?.scoringExplanation ?? '')
  const [engineType, setEngineType] = useState<EngineType>(game?.engineType ?? 'none')
  const [scoringType, setScoringType] = useState<ScoringType>(game?.scoringType ?? 'free')
  const [order, setOrder] = useState(String(game?.order ?? nextOrder))
  const [totalPoints, setTotalPoints] = useState(game?.totalPoints != null ? String(game.totalPoints) : '')
  const [rank1, setRank1] = useState(String(game?.rankPoints?.[1] ?? ''))
  const [rank2, setRank2] = useState(String(game?.rankPoints?.[2] ?? ''))
  const [rank3, setRank3] = useState(String(game?.rankPoints?.[3] ?? ''))
  const [increment, setIncrement] = useState(game?.incrementOptions?.join(', ') ?? '')
  const [rounds, setRounds] = useState(game?.rounds?.join(', ') ?? '')
  const [timerMode, setTimerMode] = useState(game?.timer?.mode ?? 'none')
  const [timerDur, setTimerDur] = useState(game?.timer?.durationSec != null ? String(game.timer.durationSec) : '')

  const save = async () => {
    if (!name.trim()) return
    const data: Omit<Game, 'id'> = {
      name: name.trim(),
      description: description.trim(),
      scoringExplanation: explain.trim(),
      engineType,
      scoringType,
      order: Number(order) || nextOrder,
    }
    if (scoringType === 'free' && totalPoints !== '') data.totalPoints = Number(totalPoints)
    if (scoringType === 'rank')
      data.rankPoints = { 1: Number(rank1) || 0, 2: Number(rank2) || 0, 3: Number(rank3) || 0 }
    if (scoringType === 'increment')
      data.incrementOptions = increment.split(',').map((s) => Number(s.trim())).filter((n) => !isNaN(n))
    const roundsArr = rounds.split(',').map((s) => s.trim()).filter(Boolean)
    if (roundsArr.length) data.rounds = roundsArr
    if (timerMode !== 'none')
      data.timer = {
        mode: timerMode as 'countdown' | 'stopwatch',
        ...(timerMode === 'countdown' && timerDur ? { durationSec: Number(timerDur) } : {}),
      }

    await saveGame(game?.id ?? newGameId(), data)
    onClose()
  }

  return (
    <Panel>
      <h2 className="mb-2 font-head text-lg text-pink-600">{game ? '게임 편집' : '새 게임'}</h2>
      <div className="grid grid-cols-2 gap-2">
        <Field label="이름">
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="순서">
          <input className={inputCls} type="number" value={order} onChange={(e) => setOrder(e.target.value)} />
        </Field>
        <Field label="진행 방식 (engineType)">
          <select className={inputCls} value={engineType} onChange={(e) => setEngineType(e.target.value as EngineType)}>
            {ENGINES.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </Field>
        <Field label="점수 방식 (scoringType)">
          <select className={inputCls} value={scoringType} onChange={(e) => setScoringType(e.target.value as ScoringType)}>
            {SCORINGS.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </Field>
        <div className="col-span-2">
          <Field label="규칙 설명">
            <input className={inputCls} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </div>
        <div className="col-span-2">
          <Field label="점수 산정 방식 문구">
            <input className={inputCls} value={explain} onChange={(e) => setExplain(e.target.value)} />
          </Field>
        </div>

        {scoringType === 'rank' && (
          <div className="col-span-2 grid grid-cols-3 gap-2">
            <Field label="1등"><input className={inputCls} type="number" value={rank1} onChange={(e) => setRank1(e.target.value)} /></Field>
            <Field label="2등"><input className={inputCls} type="number" value={rank2} onChange={(e) => setRank2(e.target.value)} /></Field>
            <Field label="3등"><input className={inputCls} type="number" value={rank3} onChange={(e) => setRank3(e.target.value)} /></Field>
          </div>
        )}
        {scoringType === 'increment' && (
          <div className="col-span-2">
            <Field label="정답당 점수 (쉼표)"><input className={inputCls} value={increment} onChange={(e) => setIncrement(e.target.value)} placeholder="50" /></Field>
          </div>
        )}
        {scoringType === 'free' && (
          <Field label="총배점 (옵션)"><input className={inputCls} type="number" value={totalPoints} onChange={(e) => setTotalPoints(e.target.value)} /></Field>
        )}
        <div className="col-span-2">
          <Field label="세부 라운드 (쉼표, 옵션)"><input className={inputCls} value={rounds} onChange={(e) => setRounds(e.target.value)} placeholder="루미큐브, 로보77" /></Field>
        </div>
        <Field label="타이머">
          <select className={inputCls} value={timerMode} onChange={(e) => setTimerMode(e.target.value as 'none' | 'countdown' | 'stopwatch')}>
            <option value="none">없음</option>
            <option value="countdown">카운트다운</option>
            <option value="stopwatch">스톱워치</option>
          </select>
        </Field>
        {timerMode === 'countdown' && (
          <Field label="제한시간(초)"><input className={inputCls} type="number" value={timerDur} onChange={(e) => setTimerDur(e.target.value)} placeholder="1800" /></Field>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <button className="btn-mini flex-1 bg-pink-500 text-white" onClick={save}>저장</button>
        <button className="btn-mini flex-1" onClick={onClose}>취소</button>
      </div>
    </Panel>
  )
}
