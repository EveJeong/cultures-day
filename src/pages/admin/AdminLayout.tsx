import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom'
import Logo from '../../components/Logo'
import { isFirebaseConfigured } from '../../lib/firebase'
import { clearSession, getSession } from '../../lib/auth'

/** 운영 페이지 셸 — 게이트 + 메뉴(게임 관리 / 참가자 관리) + Outlet */
export default function AdminLayout() {
  const nav = useNavigate()

  if (isFirebaseConfigured && getSession()?.role !== 'admin') {
    return <Navigate to="/login" replace />
  }

  const logout = () => {
    clearSession()
    nav('/login')
  }

  const menuCls = ({ isActive }: { isActive: boolean }) =>
    `btn-mini ${isActive ? 'bg-pink-500 text-white' : ''}`

  return (
    <div className="rainbow-bg min-h-screen w-full flex flex-col items-center gap-4 p-4">
      <div className="flex w-full max-w-3xl items-center justify-between">
        <Logo size="sm" />
        <button className="btn-mini" onClick={logout}>로그아웃</button>
      </div>

      {!isFirebaseConfigured ? (
        <p className="font-head text-white">⚠️ Firebase 미설정</p>
      ) : (
        <>
          <div className="flex gap-2">
            <NavLink to="/admin" end className={menuCls}>게임 관리</NavLink>
            <NavLink to="/admin/participants" className={menuCls}>참가자 관리</NavLink>
          </div>
          <Outlet />
        </>
      )}
    </div>
  )
}
