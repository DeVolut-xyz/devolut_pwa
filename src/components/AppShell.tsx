import type { ReactNode } from 'react'
import { NavBar } from './NavBar'

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="glass-shell app-shell">
      <main className="page-content">{children}</main>
      <NavBar />
    </div>
  )
}
