import { useState } from 'react'
import { newGameId, saveGame } from '../../lib/manage'
import type { EngineType, Game, GameEvent, ScoringType } from '../../types'
import { Field, Panel, inputCls } from './ui'

const ENGINES: EngineType[] = ['none', 'quiz', 'prompt']
const SCORINGS: ScoringType[] = ['rank', 'increment', 'free', 'quiz']

/** 게임 추가/편집 폼 */
export default function GameForm({
  game,
  nextOrder,
  onClose,
}: {
  game: Game | null
  nextOrder: number
  onClose: (savedId?: string) => void
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
  const [events, setEvents] = useState<GameEvent[]>(
    game?.events ?? game?.rounds?.map((name) => ({ name })) ?? [],
  )
  const [evName, setEvName] = useState('')
  const [evWin, setEvWin] = useState('')
  const [evSize, setEvSize] = useState('1')
  const [mvpPoints, setMvpPoints] = useState(game?.mvpPoints != null ? String(game.mvpPoints) : '')
  const [format, setFormat] = useState<'' | 'roster-team' | 'roster-event'>(game?.format ?? '')
  const [timerMode, setTimerMode] = useState(game?.timer?.mode ?? 'none')

  const addEvent = () => {
    const name = evName.trim()
    if (!name) return
    setEvents((arr) => [
      ...arr,
      { name, ...(evWin.trim() ? { winCondition: evWin.trim() } : {}), rosterSize: Number(evSize) || 1 },
    ])
    setEvName('')
    setEvWin('')
    setEvSize('1')
  }
  const removeEvent = (i: number) => setEvents((arr) => arr.filter((_, idx) => idx !== i))
  const moveEvent = (i: number, dir: -1 | 1) =>
    setEvents((arr) => {
      const j = i + dir
      if (j < 0 || j >= arr.length) return arr
      const c = [...arr]
      ;[c[i], c[j]] = [c[j], c[i]]
      return c
    })
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
      ...(game?.excluded ? { excluded: true } : {}),
    }
    if (scoringType === 'free' && totalPoints !== '') data.totalPoints = Number(totalPoints)
    if (scoringType === 'rank')
      data.rankPoints = { 1: Number(rank1) || 0, 2: Number(rank2) || 0, 3: Number(rank3) || 0 }
    if (scoringType === 'increment')
      data.incrementOptions = increment.split(',').map((s) => Number(s.trim())).filter((n) => !isNaN(n))
    if (events.length) data.events = events
    if (format) data.format = format
    // MVP 가능 게임(퀴즈 아님 + 종목 없음)만 mvpPoints 저장
    if (engineType !== 'quiz' && events.length === 0 && mvpPoints !== '')
      data.mvpPoints = Number(mvpPoints)
    if (timerMode !== 'none')
      data.timer = {
        mode: timerMode as 'countdown' | 'stopwatch',
        ...(timerMode === 'countdown' && timerDur ? { durationSec: Number(timerDur) } : {}),
      }

    const id = game?.id ?? newGameId()
    await saveGame(id, data)
    onClose(id)
  }

  return (
    <Panel>
      <h2 className="mb-2 font-head text-lg text-pink-600">{game ? '게임 편집' : '새 게임'}</h2>
      <div className="grid grid-cols-2 gap-2">
        <Field label="이름"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="순서"><input className={inputCls} type="number" value={order} onChange={(e) => setOrder(e.target.value)} /></Field>
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
        <div className="col-span-2"><Field label="규칙 설명 (줄바꿈 가능)"><textarea className={inputCls} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} /></Field></div>
        <div className="col-span-2"><Field label="점수 산정 방식 문구 (줄바꿈 가능)"><textarea className={inputCls} rows={3} value={explain} onChange={(e) => setExplain(e.target.value)} /></Field></div>

        {scoringType === 'rank' && (
          <div className="col-span-2 grid grid-cols-3 gap-2">
            <Field label="1등"><input className={inputCls} type="number" value={rank1} onChange={(e) => setRank1(e.target.value)} /></Field>
            <Field label="2등"><input className={inputCls} type="number" value={rank2} onChange={(e) => setRank2(e.target.value)} /></Field>
            <Field label="3등"><input className={inputCls} type="number" value={rank3} onChange={(e) => setRank3(e.target.value)} /></Field>
          </div>
        )}
        {scoringType === 'increment' && (
          <div className="col-span-2"><Field label="정답당 점수 (쉼표)"><input className={inputCls} value={increment} onChange={(e) => setIncrement(e.target.value)} placeholder="50" /></Field></div>
        )}
        {scoringType === 'free' && (
          <Field label="총배점 (옵션)"><input className={inputCls} type="number" value={totalPoints} onChange={(e) => setTotalPoints(e.target.value)} /></Field>
        )}
        <Field label="게임 구분 (로스터 출전)">
          <select className={inputCls} value={format} onChange={(e) => setFormat(e.target.value as '' | 'roster-team' | 'roster-event')}>
            <option value="">일반</option>
            <option value="roster-team">팀별 진행 (릴레이)</option>
            <option value="roster-event">종목별 진행</option>
          </select>
        </Field>

        <div className="col-span-2">
          <p className="mb-1 font-head text-xs text-gray-500">종목 (하나씩 등록 — 이름 · 승리 조건 · 참가 인원)</p>
          {events.length > 0 && (
            <ul className="mb-2 space-y-1">
              {events.map((ev, i) => (
                <li key={i} className="flex items-center gap-2 rounded-xl bg-pink-50 px-3 py-1.5">
                  <span className="font-head text-xs text-pink-400">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate font-body text-sm">
                    <b className="text-pink-600">{ev.name}</b>
                    {ev.winCondition && <span className="text-gray-500"> · {ev.winCondition}</span>}
                    <span className="text-gray-400"> · {ev.rosterSize ?? 1}명</span>
                  </span>
                  <button className="btn-mini" disabled={i === 0} onClick={() => moveEvent(i, -1)}>▲</button>
                  <button className="btn-mini" disabled={i === events.length - 1} onClick={() => moveEvent(i, 1)}>▼</button>
                  <button className="btn-mini shrink-0" onClick={() => removeEvent(i)}>삭제</button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap items-end gap-2">
            <input className={`${inputCls} min-w-[7rem] flex-1`} value={evName} onChange={(e) => setEvName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addEvent()} placeholder="종목 이름" />
            <input className={`${inputCls} min-w-[8rem] flex-1`} value={evWin} onChange={(e) => setEvWin(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addEvent()} placeholder="승리 조건 (선택)" />
            <input className={`${inputCls} w-20`} type="number" value={evSize} onChange={(e) => setEvSize(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addEvent()} placeholder="인원" />
            <button className="btn-mini bg-pink-500 text-white" onClick={addEvent}>+ 추가</button>
          </div>
        </div>

        {engineType !== 'quiz' && events.length === 0 && (
          <Field label="MVP 보너스 점수 (옵션)"><input className={inputCls} type="number" value={mvpPoints} onChange={(e) => setMvpPoints(e.target.value)} placeholder="50" /></Field>
        )}
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
        <button className="btn-mini flex-1" onClick={() => onClose()}>취소</button>
      </div>
    </Panel>
  )
}
