import RainbowScreen from '../components/RainbowScreen'
import Logo from '../components/Logo'

// TODO(01-auth-design): 이름 입력 → 분기(A/B/C/D) → 메인/운영
export default function LoginPage() {
  return (
    <RainbowScreen>
      <Logo size="md" />
      <div className="mt-4 w-full max-w-sm rounded-3xl bg-white/90 p-6 shadow-xl">
        <p className="font-head text-2xl text-pink-600">로그인 (준비중)</p>
        <p className="mt-2 font-body text-gray-500">이름 기반 로그인 · 온보딩 예정</p>
      </div>
    </RainbowScreen>
  )
}
