import { Link } from 'react-router-dom'
import { LiquidCard } from '../ui/liquid'

export function WelcomePage() {
  return (
    <div className="glass-shell">
      <LiquidCard>
        <div className="glass-title">Welcome to APY Screener</div>
        <p className="glass-subtitle">
          Monitor live balances, exposures, and APY across your wallets with a
          liquid-glass experience.
        </p>
        <div className="welcome-actions">
          <Link className="glass-button link" to="/login">
            Login
          </Link>
          <Link className="glass-button link" to="/signup">
            Sign up
          </Link>
        </div>
        <p className="notice" style={{ marginTop: 12 }}>
          Passkey sign-in keeps your account secured on-device.
        </p>
      </LiquidCard>
    </div>
  )
}
