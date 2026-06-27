import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RainbowScreen from '../components/RainbowScreen'
import Logo from '../components/Logo'
import { getUser, registerParticipant, setSession, sha256 } from '../lib/auth'
import { isFirebaseConfigured } from '../lib/firebase'
import type { User } from '../types'

type Step = 'name' | 'password' | 'register'

export default function LoginPage() {
  const nav = useNavigate()
  const [step, setStep] = useState<Step>('name')
  const [name, setName] = useState('')
  const [user, setUser] = useState<User | null>(null)
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [nickname, setNickname] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  if (!isFirebaseConfigured) {
    return (
      <RainbowScreen>
        <Logo size="md" />
        <p className="font-head text-white">⚠️ Firebase 미설정</p>
      </RainbowScreen>
    )
  }

  const next = async () => {
    const n = name.trim()
    if (!n) return
    setBusy(true)
    setErr('')
    try {
      const u = await getUser(n)
      if (!u) {
        setErr('등록되지 않은 이름입니다. 운영자에게 문의하세요.')
        return
      }
      setUser(u)
      setStep(u.passwordHash == null && !u.isAdmin ? 'register' : 'password')
    } finally {
      setBusy(false)
    }
  }

  const login = async () => {
    if (!user) return
    setBusy(true)
    setErr('')
    try {
      const h = await sha256(pw)
      if (h !== user.passwordHash) {
        setErr('비밀번호가 일치하지 않습니다.')
        return
      }
      const role = user.isAdmin ? 'admin' : 'participant'
      setSession({ userId: name.trim(), role, teamId: user.teamId, nickname: user.nickname })
      nav(user.isAdmin ? '/admin' : '/')
    } finally {
      setBusy(false)
    }
  }

  const register = async () => {
    if (pw.length < 4) return setErr('비밀번호는 4자 이상')
    if (pw !== pw2) return setErr('비밀번호 확인이 일치하지 않습니다.')
    if (!nickname.trim()) return setErr('닉네임을 입력하세요.')
    setBusy(true)
    setErr('')
    try {
      const n = name.trim()
      await registerParticipant(n, pw, nickname.trim())
      setSession({ userId: n, role: 'participant', teamId: user!.teamId, nickname: nickname.trim() })
      nav('/')
    } finally {
      setBusy(false)
    }
  }

  return (
    <RainbowScreen>
      <Logo size="md" />
      <div className="w-full max-w-sm space-y-3 rounded-3xl bg-white/90 p-6 shadow-xl">
        {step === 'name' && (
          <>
            <p className="font-head text-xl text-pink-600">이름을 입력하세요</p>
            <input
              className="w-full rounded-xl border-2 border-pink-200 p-3 font-body"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && next()}
              placeholder="이름"
              autoFocus
            />
            <button className="btn-pop w-full" disabled={busy} onClick={next}>
              다음
            </button>
          </>
        )}

        {step === 'password' && (
          <>
            <p className="font-head text-xl text-pink-600">
              {user?.isAdmin ? '운영자 로그인' : `${name}님, 비밀번호`}
            </p>
            <input
              className="w-full rounded-xl border-2 border-pink-200 p-3 font-body"
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && login()}
              placeholder="비밀번호"
              autoFocus
            />
            <button className="btn-pop w-full" disabled={busy} onClick={login}>
              로그인
            </button>
          </>
        )}

        {step === 'register' && (
          <>
            <p className="font-head text-xl text-pink-600">{name}님, 처음이네요! 설정해주세요</p>
            <input
              className="w-full rounded-xl border-2 border-pink-200 p-3 font-body"
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="비밀번호 (4자 이상)"
            />
            <input
              className="w-full rounded-xl border-2 border-pink-200 p-3 font-body"
              type="password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              placeholder="비밀번호 확인"
            />
            <input
              className="w-full rounded-xl border-2 border-pink-200 p-3 font-body"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임"
            />
            <button className="btn-pop w-full" disabled={busy} onClick={register}>
              가입하고 시작
            </button>
          </>
        )}

        {err && <p className="font-body text-sm text-red-500">{err}</p>}
      </div>
    </RainbowScreen>
  )
}
