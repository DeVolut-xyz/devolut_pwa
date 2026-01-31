import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/useAuth'
import { isSupabaseConfigured, isSupabaseKeyValid } from '../services/supabase'
import { LiquidButton, LiquidCard } from '../ui/liquid'

export function LoginPage() {
  const { login, isSupported, lastAuthError } = useAuth()
  const [status, setStatus] = useState<string | null>(null)
  const navigate = useNavigate()
  const isSecureContext = typeof window !== 'undefined' && window.isSecureContext

  const onLogin = async () => {
    try {
      setStatus('Authenticating...')
      await login()
      navigate('/home')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to login')
    }
  }

  return (
    <div className="glass-shell">
      <LiquidCard>
        <div className="glass-title">Login</div>
        <p className="glass-subtitle">
          Tap to login. Your device will prompt if a passkey is available.
        </p>
        <p className="notice">
          Cloud sync is {isSupabaseConfigured ? 'enabled' : 'disabled'}.
          {!isSupabaseKeyValid && ' Check URL + anon key match.'}
        </p>
        {!isSecureContext && (
          <p className="notice">
            Passkeys require HTTPS or localhost. Open the app on
            <code>https://</code> or <code>http://localhost</code>.
          </p>
        )}
        {!isSupported && (
          <p className="notice">
            Passkeys are not supported on this device. Use a modern browser
            with WebAuthn enabled.
          </p>
        )}
        <div className="toolbar" style={{ marginTop: 16 }}>
          <LiquidButton
            variant="secondary"
            onClick={onLogin}
            disabled={!isSupported || !isSecureContext}
          >
            Login with passkey
          </LiquidButton>
          <Link className="glass-button link" to="/signup">
            Sign up
          </Link>
        </div>
        {status && <p className="notice" style={{ marginTop: 16 }}>{status}</p>}
        {lastAuthError && (
          <p className="notice" style={{ marginTop: 8 }}>
            {lastAuthError}
          </p>
        )}
      </LiquidCard>
    </div>
  )
}
