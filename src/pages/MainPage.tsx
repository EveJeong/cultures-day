import { Link } from 'react-router-dom'
import RainbowScreen from '../components/RainbowScreen'
import { isFirebaseConfigured } from '../lib/firebase'

export default function MainPage() {
  return (
    <RainbowScreen>
      <img
        src="/bonobono.png"
        alt="보노보노"
        className="h-44 md:h-56 drop-shadow-2xl animate-bounce"
      />
      <h1 className="wordart wordart-yellow text-6xl md:text-8xl">바딧불이 야호</h1>
      <p className="wordart wordart-white text-3xl md:text-5xl">단합대회 한판*^^*</p>
      <p className="font-head text-white/80 text-lg drop-shadow">구독과 좋아요 해줄거지?</p>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <Link to="/login" className="btn-pop">
          참가하기
        </Link>
        <Link to="/spectator" className="btn-pop">
          관전 화면
        </Link>
        <Link to="/admin" className="btn-pop">
          운영
        </Link>
      </div>

      {!isFirebaseConfigured && (
        <p className="mt-6 font-head text-sm bg-black/40 text-white rounded-xl px-4 py-2">
          ⚠️ Firebase 미설정 — <code>.env.local</code> 에 config를 채워주세요
        </p>
      )}
    </RainbowScreen>
  )
}
