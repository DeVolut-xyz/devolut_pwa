import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/useAuth'
import { isSupabaseConfigured, isSupabaseKeyValid } from '../services/supabase'
import { LiquidButton, LiquidCard, LiquidInput } from '../ui/liquid'

export function SignupPage() {
  const { register, isSupported, lastAuthError } = useAuth()
  const [username, setUsername] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const navigate = useNavigate()
  const isSecureContext = typeof window !== 'undefined' && window.isSecureContext

  const onRegister = async () => {
    try {
      setStatus('Creating passkey...')
      await register(username.trim())
      setStatus('Passkey saved. Redirecting...')
      navigate('/home')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to register')
    }
  }

  return (
    <div className="glass-shell">
      <LiquidCard>
        <div className="glass-title">Sign up</div>
        <p className="glass-subtitle">
          Create a passkey to secure your APY Screener account.
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
        <LiquidInput
          placeholder="Username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
        <div className="toolbar" style={{ marginTop: 16 }}>
          <LiquidButton
            onClick={onRegister}
            disabled={!isSupported || !isSecureContext || username.trim().length < 2}
          >
            Register passkey
          </LiquidButton>
          <Link className="glass-button secondary link" to="/login">
            Login
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
