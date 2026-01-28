import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../state/useAuth'
import { isSupabaseConfigured, isSupabaseKeyValid } from '../services/supabase'
import { LiquidButton, LiquidCard, LiquidInput } from '../ui/liquid'

export function LoginPage() {
  const { register, login, profile, isSupported, lastAuthError } = useAuth()
  const [username, setUsername] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const navigate = useNavigate()
  const isSecureContext = typeof window !== 'undefined' && window.isSecureContext

  const onRegister = async () => {
    try {
      setStatus('Creating passkey...')
      await register(username.trim())
      setStatus('Passkey saved. Redirecting...')
      navigate('/')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to register')
    }
  }

  const onLogin = async () => {
    try {
      setStatus('Authenticating...')
      await login()
      navigate('/')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to login')
    }
  }

  return (
    <div className="glass-shell">
      <LiquidCard>
        <div className="glass-title">Login with Passkey</div>
        <p className="glass-subtitle">
          Use Face ID, Touch ID, or Android passkey to access your portfolio.
        </p>
        <p className="notice">
          Supabase sync is {isSupabaseConfigured ? 'enabled' : 'disabled'}.
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
        <div className="glass-grid two" style={{ marginTop: 20 }}>
          <LiquidCard variant="dark">
            <h3>Create account</h3>
            <p className="notice">
              Your passkey stays on this device. No password required.
            </p>
            <LiquidInput
              placeholder="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
            <div style={{ marginTop: 12 }}>
              <LiquidButton
                onClick={onRegister}
                disabled={!isSupported || !isSecureContext || username.trim().length < 2}
              >
                Register passkey
              </LiquidButton>
            </div>
          </LiquidCard>
          <LiquidCard variant="dark">
            <h3>Login</h3>
            <p className="notice">
              Tap to login. Your device will prompt if a passkey is available.
            </p>
            {profile && (
              <div className="chip-row" style={{ marginTop: 12 }}>
                <span className="status-pill">Saved: {profile.username}</span>
              </div>
            )}
            <div style={{ marginTop: 12 }}>
              <LiquidButton
                variant="secondary"
                onClick={onLogin}
                disabled={!isSupported || !isSecureContext}
              >
                Login with passkey
              </LiquidButton>
            </div>
          </LiquidCard>
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
