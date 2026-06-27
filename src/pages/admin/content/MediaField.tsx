import { useState } from 'react'
import { uploadMedia } from '../../../lib/upload'
import type { MediaRef } from '../../../types'
import { Field } from '../ui'

export function MediaPreview({ media, className }: { media: MediaRef; className?: string }) {
  const c = media.contentType ?? ''
  if (c.startsWith('video')) return <video src={media.url} controls className={className ?? 'h-16 rounded'} />
  if (c.startsWith('audio')) return <audio src={media.url} controls className="w-40" />
  return <img src={media.url} alt="" className={className ?? 'h-12 w-12 rounded-lg object-cover'} />
}

export function MediaField({
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

export function MultiMediaField({ value, onChange }: { value: MediaRef[]; onChange: (v: MediaRef[]) => void }) {
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
