import { useState } from 'react'
import { useQuestions } from '../../../lib/game'
import { addQuestion, deleteQuestion, updateQuestion } from '../../../lib/content'
import { isSignerConfigured } from '../../../lib/upload'
import type { MediaRef, Question, QuestionType } from '../../../types'
import { Field, Panel, inputCls } from '../ui'
import { MediaField, MultiMediaField } from './MediaField'

const CATEGORIES: Question['category'][] = ['과자이름', '초성', '확대샷', '노래', '영화']
const Q_TYPES: { v: QuestionType; label: string }[] = [
  { v: 'text', label: '텍스트' },
  { v: 'image', label: '사진 1개' },
  { v: 'images', label: '사진 N개' },
  { v: 'audio', label: '오디오' },
]

/** 게임별 퀴즈 문제 편집 (순서 조정 포함) */
export default function QuizContent({ gameId }: { gameId: string }) {
  const questions = useQuestions()
    .filter((q) => q.gameId === gameId)
    .sort((a, b) => a.order - b.order)

  const [category, setCategory] = useState<Question['category']>('초성')
  const [kind, setKind] = useState<'real' | 'practice'>('real')
  const [qType, setQType] = useState<QuestionType>('text')
  const [promptText, setPromptText] = useState('')
  const [promptMedia, setPromptMedia] = useState<MediaRef[]>([])
  const [answerText, setAnswerText] = useState('')
  const [answerMedia, setAnswerMedia] = useState<MediaRef | undefined>()
  const [points, setPoints] = useState('10')

  const needsMedia = qType !== 'text'
  const reset = () => {
    setPromptText('')
    setPromptMedia([])
    setAnswerText('')
    setAnswerMedia(undefined)
  }

  const submit = async () => {
    const hasPrompt = qType === 'text' ? !!promptText.trim() : promptMedia.length > 0
    const hasAnswer = !!answerText.trim() || !!answerMedia
    if (!hasPrompt || !hasAnswer) return
    await addQuestion({
      gameId,
      category,
      kind,
      qType,
      ...(promptText.trim() ? { promptText: promptText.trim() } : {}),
      ...(promptMedia.length ? { promptMedia } : {}),
      ...(answerText.trim() ? { answerText: answerText.trim() } : {}),
      ...(answerMedia ? { answerMedia } : {}),
      points: Number(points) || 10,
      used: false,
      order: questions.length,
    })
    reset()
  }

  // 위치 교환 후 전체 0..n-1 순번 재할당 (order 중복이어도 안전)
  const move = async (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= questions.length) return
    const arr = [...questions]
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    await Promise.all(
      arr.map((q, idx) => (q.order !== idx ? updateQuestion(q.id, { order: idx }) : Promise.resolve())),
    )
  }

  return (
    <Panel>
      <h2 className="mb-2 font-head text-lg text-pink-600">퀴즈 문제 ({questions.length}) — 순서대로 진행</h2>

      <div className="grid grid-cols-2 gap-2">
        <Field label="카테고리">
          <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value as Question['category'])}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="유형">
          <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value as 'real' | 'practice')}>
            <option value="real">본문제</option>
            <option value="practice">연습</option>
          </select>
        </Field>
        <Field label="문제 유형">
          <select className={inputCls} value={qType} onChange={(e) => { setQType(e.target.value as QuestionType); setPromptMedia([]) }}>
            {Q_TYPES.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
          </select>
        </Field>
        <Field label="배점">
          <input className={inputCls} type="number" value={points} onChange={(e) => setPoints(e.target.value)} />
        </Field>
      </div>

      <div className="mt-2">
        {qType === 'text' && (
          <Field label="문제">
            <input className={inputCls} value={promptText} onChange={(e) => setPromptText(e.target.value)} placeholder="예: ㄱㅅㅎㄷ" />
          </Field>
        )}
        {needsMedia && !isSignerConfigured && (
          <p className="font-body text-xs text-gray-400">※ 미디어 업로드는 서명서버(VITE_SIGNER_*) 설정 후 활성화</p>
        )}
        {qType === 'image' && isSignerConfigured && (
          <MediaField label="문제 사진" accept="image/*" value={promptMedia[0]} onChange={(m) => setPromptMedia(m ? [m] : [])} />
        )}
        {qType === 'audio' && isSignerConfigured && (
          <MediaField label="문제 오디오" accept="audio/*" value={promptMedia[0]} onChange={(m) => setPromptMedia(m ? [m] : [])} />
        )}
        {qType === 'images' && isSignerConfigured && (
          <MultiMediaField value={promptMedia} onChange={setPromptMedia} />
        )}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <Field label="정답 텍스트(선택)">
          <input className={inputCls} value={answerText} onChange={(e) => setAnswerText(e.target.value)} placeholder="예: 보노보노" />
        </Field>
        {isSignerConfigured && (
          <MediaField label="정답 이미지/영상(선택)" accept="image/*,video/*" value={answerMedia} onChange={setAnswerMedia} />
        )}
      </div>

      <button className="btn-mini mt-2 w-full bg-pink-500 text-white" onClick={submit}>문제 추가</button>

      <ul className="mt-3 space-y-1">
        {questions.map((q, i) => (
          <li key={q.id} className="flex items-center gap-2 rounded-xl bg-pink-50 px-3 py-1.5">
            <span className="font-head text-xs text-pink-400">{i + 1}</span>
            <span className="flex min-w-0 flex-1 items-center gap-2 font-body text-sm">
              <b className="text-pink-600">[{q.category}]</b>
              <span className="rounded bg-pink-200 px-1 text-xs text-pink-700">{qLabel(q.qType)}</span>
              <span className="truncate">{promptSummary(q)} → {q.answerText || (q.answerMedia ? mediaLabel(q.answerMedia) : '')}</span>
              {q.kind === 'practice' && <span className="text-gray-400">(연습)</span>}
            </span>
            <button className="btn-mini" disabled={i === 0} onClick={() => move(i, -1)}>▲</button>
            <button className="btn-mini" disabled={i === questions.length - 1} onClick={() => move(i, 1)}>▼</button>
            <button className="btn-mini shrink-0" onClick={() => deleteQuestion(q.id)}>삭제</button>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function qLabel(t: QuestionType): string {
  return Q_TYPES.find((x) => x.v === t)?.label ?? t
}
function mediaLabel(m: MediaRef): string {
  const c = m.contentType ?? ''
  return c.startsWith('video') ? '🎬영상' : c.startsWith('audio') ? '🔊오디오' : '🖼사진'
}
function promptSummary(q: Question): string {
  if (q.qType === 'text') return q.promptText ?? ''
  const n = q.promptMedia?.length ?? 0
  if (q.qType === 'images') return `사진 ${n}장`
  if (q.qType === 'audio') return '오디오'
  return '사진'
}
