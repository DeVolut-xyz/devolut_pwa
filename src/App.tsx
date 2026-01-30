import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import './App.css'
import { AppShell } from './components/AppShell'
import { InstallGate } from './components/InstallGate'
import { WelcomePage } from './pages/Welcome'
import { LoginPage } from './pages/Login'
import { SignupPage } from './pages/Signup'
import { HomePage } from './pages/Home'
import { SettingsPage } from './pages/Settings'
import { ProfilePage } from './pages/Profile'
import { WalletDetailPage } from './pages/WalletDetail'
import { useAuth } from './state/useAuth'

export default function App() {
  const { isAuthenticated } = useAuth()

  return (
    <BrowserRouter>
      <InstallGate>
        <Routes>
          <Route
            path="/welcome"
            element={
              isAuthenticated ? <Navigate to="/home" replace /> : <WelcomePage />
            }
          />
          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/home" replace /> : <LoginPage />
            }
          />
          <Route
            path="/signup"
            element={
              isAuthenticated ? <Navigate to="/home" replace /> : <SignupPage />
            }
          />
          <Route
            path="/home"
            element={
              isAuthenticated ? (
                <AppShell>
                  <HomePage />
                </AppShell>
              ) : (
                <Navigate to="/welcome" replace />
              )
            }
          />
          <Route
            path="/settings"
            element={
              isAuthenticated ? (
                <AppShell>
                  <SettingsPage />
                </AppShell>
              ) : (
                <Navigate to="/welcome" replace />
              )
            }
          />
          <Route
            path="/profile"
            element={
              isAuthenticated ? (
                <AppShell>
                  <ProfilePage />
                </AppShell>
              ) : (
                <Navigate to="/welcome" replace />
              )
            }
          />
          <Route
            path="/address/:address"
            element={
              isAuthenticated ? (
                <AppShell>
                  <WalletDetailPage />
                </AppShell>
              ) : (
                <Navigate to="/welcome" replace />
              )
            }
          />
          <Route
            path="/wallet/:address"
            element={<WalletRedirect />}
          />
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/home" replace />
              ) : (
                <Navigate to="/welcome" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </InstallGate>
    </BrowserRouter>
  )
}

function WalletRedirect() {
  const { address } = useParams()
  return <Navigate to={address ? `/address/${address}` : '/home'} replace />
}
