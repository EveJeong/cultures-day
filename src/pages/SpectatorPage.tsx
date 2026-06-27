import DisplayView from '../components/display/DisplayView'
import { isFirebaseConfigured } from '../lib/firebase'

// 관전(중립) 진행 페이지 — 빔프로젝터용. 개인화 없음, QR 노출.
export default function SpectatorPage() {
  if (!isFirebaseConfigured) {
    return (
      <div className="rainbow-bg flex min-h-screen items-center justify-center">
        <p className="wordart wordart-white text-3xl">⚠️ Firebase 미설정</p>
      </div>
    )
  }
  return <DisplayView showQr />
}
