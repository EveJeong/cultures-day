import type { ReactNode } from 'react'

export function Panel({ children }: { children: ReactNode }) {
  return <div className="w-full rounded-3xl bg-white/90 p-4 shadow-xl">{children}</div>
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-head text-xs text-gray-500">{label}</span>
      {children}
    </label>
  )
}

export const inputCls =
  'rounded-xl border-2 border-pink-200 p-2 font-body focus:outline-none focus:border-pink-400'
