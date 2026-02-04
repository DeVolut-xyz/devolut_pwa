import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useParams, useLocation } from 'react-router-dom'
import './App.css'
import { AppShell } from './components/AppShell'
import { InstallGate } from './components/InstallGate'
import { useAuth } from './state/useAuth'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

const WelcomePage = lazy(() =>
  import('./pages/Welcome').then((module) => ({ default: module.WelcomePage })),
)
const LoginPage = lazy(() =>
  import('./pages/Login').then((module) => ({ default: module.LoginPage })),
)
const SignupPage = lazy(() =>
  import('./pages/Signup').then((module) => ({ default: module.SignupPage })),
)
const HomePage = lazy(() =>
  import('./pages/Home').then((module) => ({ default: module.HomePage })),
)
const SettingsPage = lazy(() =>
  import('./pages/Settings').then((module) => ({ default: module.SettingsPage })),
)
const ProfilePage = lazy(() =>
  import('./pages/Profile').then((module) => ({ default: module.ProfilePage })),
)
const WalletDetailPage = lazy(() =>
  import('./pages/WalletDetail').then((module) => ({
    default: module.WalletDetailPage,
  })),
)

export default function App() {
  const { isAuthenticated } = useAuth()

  return (
    <BrowserRouter>
      <ScrollToTop />
      <InstallGate>
        <Suspense fallback={<div className="notice">Loading...</div>}>
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
            <Route path="/wallet/:address" element={<WalletRedirect />} />
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
        </Suspense>
      </InstallGate>
    </BrowserRouter>
  )
}

function WalletRedirect() {
  const { address } = useParams()
  return <Navigate to={address ? `/address/${address}` : '/home'} replace />
}
