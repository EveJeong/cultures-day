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
import { isSignerConfigured, uploadImage } from '../../lib/upload'
import type { ImageRef, Question } from '../../types'
import { Field, Panel, inputCls } from './ui'

const CATEGORIES: Question['category'][] = ['과자이름', '초성', '확대샷', '노래', '영화']

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
  const [promptText, setPromptText] = useState('')
  const [answerText, setAnswerText] = useState('')
  const [promptImage, setPromptImage] = useState<ImageRef | undefined>()
  const [answerImage, setAnswerImage] = useState<ImageRef | undefined>()
  const [points, setPoints] = useState('10')

  const submit = async () => {
    const hasPrompt = promptText.trim() || promptImage
    const hasAnswer = answerText.trim() || answerImage
    if (!hasPrompt || !hasAnswer) return
    await addQuestion({
      gameId: 'quiz',
      category,
      kind,
      ...(promptText.trim() ? { promptText: promptText.trim() } : {}),
      ...(promptImage ? { promptImage } : {}),
      ...(answerText.trim() ? { answerText: answerText.trim() } : {}),
      ...(answerImage ? { answerImage } : {}),
      points: Number(points) || 10,
      used: false,
      order: questions.length,
    })
    setPromptText('')
    setAnswerText('')
    setPromptImage(undefined)
    setAnswerImage(undefined)
  }

  return (
    <Panel>
      <h2 className="mb-2 font-head text-lg text-pink-600">퀴즈 문제 ({questions.length})</h2>

      <div className="grid grid-cols-2 gap-2">
        <Field label="카테고리">
          <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value as Question['category'])}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="유형">
          <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value as 'real' | 'practice')}>
            <option value="real">본문제</option>
            <option value="practice">연습</option>
          </select>
        </Field>
        <Field label="문제">
          <input className={inputCls} value={promptText} onChange={(e) => setPromptText(e.target.value)} placeholder="예: ㄱㅅㅎㄷ" />
        </Field>
        <Field label="정답">
          <input className={inputCls} value={answerText} onChange={(e) => setAnswerText(e.target.value)} placeholder="예: 감사합니다" />
        </Field>
        <Field label="배점">
          <input className={inputCls} type="number" value={points} onChange={(e) => setPoints(e.target.value)} />
        </Field>
      </div>
      {isSignerConfigured ? (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <ImageField label="문제 이미지(선택)" value={promptImage} onChange={setPromptImage} />
          <ImageField label="정답 이미지(선택)" value={answerImage} onChange={setAnswerImage} />
        </div>
      ) : (
        <p className="mt-1 font-body text-xs text-gray-400">
          ※ 이미지 업로드는 서명서버(VITE_SIGNER_*) 설정 후 활성화
        </p>
      )}

      <button className="btn-mini mt-2 w-full bg-pink-500 text-white" onClick={submit}>
        문제 추가
      </button>

      <ul className="mt-3 space-y-1">
        {questions.map((q) => (
          <li key={q.id} className="flex items-center justify-between gap-2 rounded-xl bg-pink-50 px-3 py-1.5">
            <span className="flex min-w-0 items-center gap-2 font-body text-sm">
              <b className="text-pink-600">[{q.category}]</b>
              {q.promptImage && <img src={q.promptImage.url} alt="" className="h-8 w-8 rounded object-cover" />}
              <span className="truncate">{q.promptText} → {q.answerText}</span>
              {q.answerImage && <img src={q.answerImage.url} alt="" className="h-8 w-8 rounded object-cover" />}
              {q.kind === 'practice' && <span className="text-gray-400">(연습)</span>}
            </span>
            <button className="btn-mini shrink-0" onClick={() => deleteQuestion(q.id)}>삭제</button>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function ImageField({
  label,
  value,
  onChange,
}: {
  label: string
  value?: ImageRef
  onChange: (v?: ImageRef) => void
}) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const handle = async (file?: File) => {
    if (!file) return
    setBusy(true)
    setErr('')
    try {
      onChange(await uploadImage(file))
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
          <img src={value.url} alt="" className="h-12 w-12 rounded-lg object-cover" />
          <button className="btn-mini" onClick={() => onChange(undefined)}>제거</button>
        </div>
      ) : (
        <input
          type="file"
          accept="image/*"
          disabled={busy}
          className="font-body text-sm"
          onChange={(e) => handle(e.target.files?.[0])}
        />
      )}
      {busy && <span className="font-body text-xs text-gray-400">업로드 중…</span>}
      {err && <span className="font-body text-xs text-red-500">{err}</span>}
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
