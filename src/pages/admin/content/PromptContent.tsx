import { useState } from 'react'
import { usePromptSets, usePrompts } from '../../../lib/game'
import { addPrompt, addPromptSet, deletePrompt, deletePromptSet } from '../../../lib/content'
import { Panel, inputCls } from '../ui'

/** 게임별 제시어 묶음 편집 */
export default function PromptContent({ gameId }: { gameId: string }) {
  const sets = usePromptSets()
    .filter((s) => s.gameId === gameId)
    .sort((a, b) => a.order - b.order)
  const prompts = usePrompts()

  return (
    <Panel>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-head text-lg text-pink-600">제시어 묶음 ({sets.length})</h2>
        <button className="btn-mini" onClick={() => addPromptSet(gameId, `묶음 ${sets.length + 1}`, sets.length)}>
          + 묶음 추가
        </button>
      </div>
      <p className="font-body text-xs text-gray-400">팀별로 묶음 1개씩 배정됩니다 (팀 수만큼 권장)</p>

      <div className="mt-2 space-y-3">
        {sets.map((s) => (
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
