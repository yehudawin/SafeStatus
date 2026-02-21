import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/auth'
import LoginPage from './pages/LoginPage'
import OtpPage from './pages/OtpPage'
import CitySelectPage from './pages/CitySelectPage'
import ContactSyncPage from './pages/ContactSyncPage'
import ReadyPage from './pages/ReadyPage'
import HomePage from './pages/HomePage'
import SettingsPage from './pages/SettingsPage'
import AlertsMapPage from './pages/AlertsMapPage'
import NotificationsPage from './pages/NotificationsPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-dvh bg-black flex items-center justify-center"><div className="spinner" /></div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireGuest({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-dvh bg-black flex items-center justify-center"><div className="spinner" /></div>
  if (user) return <Navigate to="/home" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<RequireGuest><LoginPage /></RequireGuest>} />
      <Route path="/otp" element={<RequireGuest><OtpPage /></RequireGuest>} />
      <Route path="/onboarding/city" element={<RequireAuth><CitySelectPage /></RequireAuth>} />
      <Route path="/onboarding/sync" element={<RequireAuth><ContactSyncPage /></RequireAuth>} />
      <Route path="/onboarding/ready" element={<RequireAuth><ReadyPage /></RequireAuth>} />
      <Route path="/home" element={<RequireAuth><HomePage /></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
      <Route path="/map" element={<RequireAuth><AlertsMapPage /></RequireAuth>} />
      <Route path="/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  )
}
