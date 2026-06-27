import { useState } from 'react'
import { useGames, usePromptSets, usePrompts, useQuestions } from '../../lib/game'
import {
  addPrompt,
  addPromptSet,
  addQuestion,
  deletePrompt,
  deletePromptSet,
  deleteQuestion,
} from '../../lib/content'
import { isSignerConfigured, uploadMedia } from '../../lib/upload'
import type { MediaRef, Question, QuestionType } from '../../types'
import { Field, Panel, inputCls } from './ui'

const CATEGORIES: Question['category'][] = ['과자이름', '초성', '확대샷', '노래', '영화']
const Q_TYPES: { v: QuestionType; label: string }[] = [
  { v: 'text', label: '텍스트' },
  { v: 'image', label: '사진 1개' },
  { v: 'images', label: '사진 N개' },
  { v: 'audio', label: '오디오' },
]

export default function ContentTab() {
  return (
    <div className="w-full max-w-2xl space-y-4">
      <QuizQuestions />
      <PromptManager />
    </div>
  )
}

/* ---------- 퀴즈 문제 ---------- */

function QuizQuestions() {
  const questions = useQuestions()
    .filter((q) => q.gameId === 'quiz')
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
      gameId: 'quiz',
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

  return (
    <Panel>
      <h2 className="mb-2 font-head text-lg text-pink-600">퀴즈 문제 ({questions.length})</h2>

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

      {/* 문제 콘텐츠 (유형별) */}
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

      {/* 정답 */}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Field label="정답 텍스트(선택)">
          <input className={inputCls} value={answerText} onChange={(e) => setAnswerText(e.target.value)} placeholder="예: 보노보노" />
        </Field>
        {isSignerConfigured && (
          <MediaField label="정답 이미지/영상(선택)" accept="image/*,video/*" value={answerMedia} onChange={setAnswerMedia} />
        )}
      </div>

      <button className="btn-mini mt-2 w-full bg-pink-500 text-white" onClick={submit}>
        문제 추가
      </button>

      <ul className="mt-3 space-y-1">
        {questions.map((q) => (
          <li key={q.id} className="flex items-center justify-between gap-2 rounded-xl bg-pink-50 px-3 py-1.5">
            <span className="flex min-w-0 items-center gap-2 font-body text-sm">
              <b className="text-pink-600">[{q.category}]</b>
              <span className="rounded bg-pink-200 px-1 text-xs text-pink-700">{qTypeLabel(q.qType)}</span>
              <span className="truncate">{promptSummary(q)} → {q.answerText || (q.answerMedia ? mediaLabel(q.answerMedia) : '')}</span>
              {q.kind === 'practice' && <span className="text-gray-400">(연습)</span>}
            </span>
            <button className="btn-mini shrink-0" onClick={() => deleteQuestion(q.id)}>삭제</button>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function qTypeLabel(t: QuestionType): string {
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

/* ---------- 미디어 업로드 필드 ---------- */

function MediaPreview({ media, className }: { media: MediaRef; className?: string }) {
  const c = media.contentType ?? ''
  if (c.startsWith('video')) return <video src={media.url} controls className={className ?? 'h-16 rounded'} />
  if (c.startsWith('audio')) return <audio src={media.url} controls className="w-40" />
  return <img src={media.url} alt="" className={className ?? 'h-12 w-12 rounded-lg object-cover'} />
}

function MediaField({
  label,
  accept,
  value,
  onChange,
}: {
  label: string
  accept: string
  value?: MediaRef
  onChange: (v?: MediaRef) => void
}) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const handle = async (file?: File) => {
    if (!file) return
    setBusy(true)
    setErr('')
    try {
      onChange(await uploadMedia(file))
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Field label={label}>
      {value ? (
        <div className="flex items-center gap-2">
          <MediaPreview media={value} />
          <button className="btn-mini" onClick={() => onChange(undefined)}>제거</button>
        </div>
      ) : (
        <input type="file" accept={accept} disabled={busy} className="font-body text-sm" onChange={(e) => handle(e.target.files?.[0])} />
      )}
      {busy && <span className="font-body text-xs text-gray-400">업로드 중…</span>}
      {err && <span className="font-body text-xs text-red-500">{err}</span>}
    </Field>
  )
}

function MultiMediaField({ value, onChange }: { value: MediaRef[]; onChange: (v: MediaRef[]) => void }) {
  const [busy, setBusy] = useState(false)
  const handle = async (file?: File) => {
    if (!file) return
    setBusy(true)
    try {
      onChange([...value, await uploadMedia(file)])
    } finally {
      setBusy(false)
    }
  }
  return (
    <Field label={`문제 사진 (${value.length}장)`}>
      <div className="flex flex-wrap items-center gap-2">
        {value.map((m, i) => (
          <div key={m.s3Key} className="relative">
            <MediaPreview media={m} className="h-14 w-14 rounded-lg object-cover" />
            <button
              className="absolute -right-1 -top-1 rounded-full bg-pink-500 px-1 text-xs text-white"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
            >
              ×
            </button>
          </div>
        ))}
        <input type="file" accept="image/*" disabled={busy} className="font-body text-sm" onChange={(e) => handle(e.target.files?.[0])} />
      </div>
    </Field>
  )
}

/* ---------- 제시어 ---------- */

function PromptManager() {
  const promptGames = useGames().filter((g) => g.engineType === 'prompt')
  const sets = usePromptSets()
  const prompts = usePrompts()

  const [gameId, setGameId] = useState('')
  // 게임 목록이 비동기 로드되므로, 선택값이 유효하지 않으면 첫 제시어 게임으로 폴백
  const effectiveGameId = promptGames.some((g) => g.id === gameId)
    ? gameId
    : (promptGames[0]?.id ?? '')
  const gameSets = sets
    .filter((s) => s.gameId === effectiveGameId)
    .sort((a, b) => a.order - b.order)

  return (
    <Panel>
      <h2 className="mb-2 font-head text-lg text-pink-600">제시어 묶음</h2>

      <select
        className={`${inputCls} w-full`}
        value={effectiveGameId}
        onChange={(e) => setGameId(e.target.value)}
      >
        {promptGames.map((g) => (
          <option key={g.id} value={g.id}>{g.name}</option>
        ))}
      </select>

      <div className="mt-2 flex items-center justify-between">
        <span className="font-body text-sm text-gray-500">묶음 {gameSets.length}개 (3개 권장)</span>
        <button
          className="btn-mini"
          disabled={!effectiveGameId}
          onClick={() => addPromptSet(effectiveGameId, `묶음 ${gameSets.length + 1}`, gameSets.length)}
        >
          + 묶음 추가
        </button>
      </div>

      <div className="mt-2 space-y-3">
        {gameSets.map((s) => (
          <SetCard
            key={s.id}
            setId={s.id}
            label={s.label ?? '묶음'}
            prompts={prompts.filter((p) => p.setId === s.id).sort((a, b) => a.order - b.order)}
          />
        ))}
      </div>
    </Panel>
  )
}

function SetCard({
  setId,
  label,
  prompts,
}: {
  setId: string
  label: string
  prompts: { id: string; text: string; category: string }[]
}) {
  const [text, setText] = useState('')
  const [category, setCategory] = useState('')

  const submit = async () => {
    if (!text.trim()) return
    await addPrompt({ setId, text: text.trim(), category: category.trim(), order: prompts.length })
    setText('')
    setCategory('')
  }

  return (
    <div className="rounded-2xl border-2 border-pink-100 p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-head text-pink-600">{label} ({prompts.length})</span>
        <button className="btn-mini" onClick={() => deletePromptSet(setId)}>묶음 삭제</button>
      </div>
      <ul className="space-y-1">
        {prompts.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-2 rounded-lg bg-pink-50 px-2 py-1">
            <span className="truncate font-body text-sm">{p.text}{p.category && <span className="ml-1 text-gray-400">· {p.category}</span>}</span>
            <button className="btn-mini" onClick={() => deletePrompt(p.id)}>삭제</button>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex gap-2">
        <input className={`${inputCls} flex-1`} value={text} onChange={(e) => setText(e.target.value)} placeholder="제시어" />
        <input className={`${inputCls} w-24`} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="카테고리" />
        <button className="btn-mini bg-pink-500 text-white" onClick={submit}>추가</button>
      </div>
    </div>
  )
}
