import { Routes, Route } from 'react-router-dom'
import MainPage from './pages/MainPage'
import LoginPage from './pages/LoginPage'
import SpectatorPage from './pages/SpectatorPage'
import AdminPage from './pages/AdminPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/spectator" element={<SpectatorPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<MainPage />} />
    </Routes>
  )
}
