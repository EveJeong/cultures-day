import ScoreBar from '../components/display/ScoreBar'
import GameView from '../components/display/GameView'
import QrJoin from '../components/display/QrJoin'
import { isFirebaseConfigured } from '../lib/firebase'

// 관전(중립) 진행 페이지 — 빔프로젝터용. 개인화 없음.
export default function SpectatorPage() {
  if (!isFirebaseConfigured) {
    return (
      <div className="rainbow-bg flex min-h-screen items-center justify-center">
        <p className="wordart wordart-white text-3xl">⚠️ Firebase 미설정</p>
      </div>
    )
  }

  return (
    <div className="rainbow-bg flex min-h-screen w-full flex-col">
      <ScoreBar />
      <div className="flex flex-1 items-center justify-center p-6">
        <GameView />
      </div>
      <QrJoin />
    </div>
  )
}
