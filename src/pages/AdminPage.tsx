import RainbowScreen from '../components/RainbowScreen'
import Logo from '../components/Logo'

// TODO(02-admin-design): 운영 페이지 — PIN/admin 진입 후 게임/점수/콘텐츠 제어
export default function AdminPage() {
  return (
    <RainbowScreen>
      <Logo size="sm" />
      <div className="mt-4 w-full max-w-md rounded-3xl bg-white/90 p-6 shadow-xl">
        <p className="font-head text-2xl text-pink-600">운영 페이지 (준비중)</p>
        <p className="mt-2 font-body text-gray-500">
          게임 진행 · 점수 배정 · 콘텐츠 관리 예정
        </p>
      </div>
    </RainbowScreen>
  )
}
