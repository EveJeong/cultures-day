import type { ReactNode } from 'react'

/** 무지개 배경 전체화면 래퍼 */
export default function RainbowScreen({ children }: { children: ReactNode }) {
  return (
    <div className="rainbow-bg min-h-screen w-full flex flex-col items-center justify-center gap-6 p-6 text-center">
      {children}
    </div>
  )
}
