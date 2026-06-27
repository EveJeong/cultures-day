import { Navigate, Routes, Route } from 'react-router-dom'
import MainPage from './pages/MainPage'
import LoginPage from './pages/LoginPage'
import SpectatorPage from './pages/SpectatorPage'
import AdminPage from './pages/AdminPage'
import DisplayView from './components/display/DisplayView'
import { getSession } from './lib/auth'

/** 세션에 따라 분기: 미인증→랜딩, 참가자→개인화 진행, 운영자→/admin */
function Home() {
  const s = getSession()
  if (s?.role === 'admin') return <Navigate to="/admin" replace />
  if (s?.role === 'participant') return <DisplayView myTeamId={s.teamId} />
  return <MainPage />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/spectator" element={<SpectatorPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Home />} />
    </Routes>
  )
}
