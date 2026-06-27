import { useState } from 'react'
import Logo from '../components/Logo'
import { isFirebaseConfigured } from '../lib/firebase'
import ProgressTab from './admin/ProgressTab'
import ContentTab from './admin/ContentTab'
import SettingsTab from './admin/SettingsTab'

type Tab = 'progress' | 'content' | 'settings'

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('progress')

  return (
    <div className="rainbow-bg min-h-screen w-full flex flex-col items-center gap-4 p-4">
      <Logo size="sm" />

      {!isFirebaseConfigured ? (
        <p className="font-head text-white">⚠️ Firebase 미설정</p>
      ) : (
        <>
          <div className="flex gap-2">
            <button
              className={`btn-mini ${tab === 'progress' ? 'bg-pink-500 text-white' : ''}`}
              onClick={() => setTab('progress')}
            >
              진행
            </button>
            <button
              className={`btn-mini ${tab === 'content' ? 'bg-pink-500 text-white' : ''}`}
              onClick={() => setTab('content')}
            >
              콘텐츠
            </button>
            <button
              className={`btn-mini ${tab === 'settings' ? 'bg-pink-500 text-white' : ''}`}
              onClick={() => setTab('settings')}
            >
              설정
            </button>
          </div>

          {tab === 'progress' ? <ProgressTab /> : tab === 'content' ? <ContentTab /> : <SettingsTab />}
        </>
      )}
    </div>
  )
}
