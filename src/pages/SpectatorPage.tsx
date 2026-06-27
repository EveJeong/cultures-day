import RainbowScreen from '../components/RainbowScreen'
import Logo from '../components/Logo'
import Leaderboard from '../components/Leaderboard'
import { isFirebaseConfigured } from '../lib/firebase'

// TODO(03-display-design): 관전(중립) 진행 페이지 — 현재 게임 진행 뷰 추가 예정
export default function SpectatorPage() {
  return (
    <RainbowScreen>
      <Logo size="md" />
      <p className="wordart wordart-white mt-2 text-3xl">실시간 점수</p>
      <Leaderboard />
      {!isFirebaseConfigured && (
        <p className="mt-2 rounded-xl bg-black/40 px-4 py-2 font-head text-sm text-white">
          ⚠️ Firebase 미설정
        </p>
      )}
    </RainbowScreen>
  )
}
