import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LiquidButton, LiquidCard } from '../ui/liquid'
import { useAuth } from '../state/useAuth'
import { useSettings } from '../state/useSettings'

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation()
  const { logout, profile } = useAuth()
  const { settings } = useSettings()

  return (
    <div className="glass-shell">
      <LiquidCard className="glass-header">
        <div>
          <div className="glass-title">Factor APY Screener</div>
          <div className="glass-subtitle">
            Liquid glass PWA • Chains {settings.chainIds.join(', ')}
          </div>
        </div>
        <div className="nav-actions">
          {profile && (
            <span className="status-pill">Passkey · {profile.username}</span>
          )}
          {location.pathname !== '/' && (
            <Link className="glass-button secondary link" to="/">
              Dashboard
            </Link>
          )}
          <LiquidButton variant="secondary" onClick={logout}>
            Logout
          </LiquidButton>
        </div>
      </LiquidCard>
      {children}
      <footer className="notice">
        Demo PWA uses passkey WebAuthn on-device and local storage. For
        production, add server-side verification.
      </footer>
    </div>
  )
}
