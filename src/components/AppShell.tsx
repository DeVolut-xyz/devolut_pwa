import type { ReactNode } from 'react'
import { KeyRound, LogOut } from 'lucide-react'
import { LiquidButton, LiquidCard } from '../ui/liquid'
import { useAuth } from '../state/useAuth'
import { useSettings } from '../state/useSettings'
import { NavBar } from './NavBar'

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { logout, profile } = useAuth()
  const { settings } = useSettings()

  return (
    <div className="glass-shell app-shell">
      <LiquidCard className="glass-header">
        <div>
          <div className="glass-title">APY Screener</div>
          <div className="glass-subtitle">
            Liquid glass PWA • Chains {settings.chainIds.join(', ')}
          </div>
        </div>
        <div className="nav-actions">
          {profile && (
            <span className="status-pill header-chip">
              <KeyRound className="chip-icon" size={14} strokeWidth={1.8} />
              Passkey · {profile.username}
            </span>
          )}
          <LiquidButton variant="secondary" className="header-chip" onClick={logout}>
            <LogOut className="chip-icon" size={14} strokeWidth={1.8} />
            Logout
          </LiquidButton>
        </div>
      </LiquidCard>
      <main className="page-content">{children}</main>
      <NavBar />
    </div>
  )
}
