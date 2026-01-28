import { useEffect, useState } from 'react'
import { isPasskeySupported } from '../utils/passkey'
import {
  authenticateSupabasePasskey,
  ensureSupabaseUser,
  fetchPasskeyAccountForUser,
  getSupabaseSession,
  isSupabaseConfigured,
  registerSupabasePasskey,
  signOutSupabase,
  upsertPasskeyAccount,
} from '../services/supabase'

export type PasskeyProfile = {
  username: string
  createdAt: string
}

export function useAuth() {
  const [profile, setProfile] = useState<PasskeyProfile | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  const [lastAuthError, setLastAuthError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    setIsSupported(isPasskeySupported())
    const loadSession = async () => {
      if (!isSupabaseConfigured) {
        setIsAuthenticated(false)
        return
      }
      try {
        const user = await ensureSupabaseUser()
        const session = await getSupabaseSession()
        setIsAuthenticated(Boolean(session))
        if (user) {
          const username =
            user.email ??
            (user.user_metadata?.username as string | undefined) ??
            'User'
          setProfile({
            username,
            createdAt: user.created_at,
          })
        }
      } catch (error) {
        setIsAuthenticated(false)
        setLastAuthError(
          error instanceof Error ? error.message : 'Supabase auth error',
        )
      }
    }
    void loadSession()
  }, [])

  const register = async (username: string) => {
    setLastAuthError(null)
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.')
    }
    await ensureSupabaseUser()
    console.info('[auth] register start', { username })
    await registerSupabasePasskey(username)
    await upsertPasskeyAccount({
      username,
      createdAt: new Date().toISOString(),
    })
    setProfile({
      username,
      createdAt: new Date().toISOString(),
    })
    console.info('[auth] register success')
  }

  const login = async () => {
    setLastAuthError(null)
    console.info('[auth] login start')
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.')
    }
    await ensureSupabaseUser()
    await authenticateSupabasePasskey()
    const account = await fetchPasskeyAccountForUser()
    if (account) {
      setProfile({
        username: account.username,
        createdAt: account.created_at,
      })
    }
    setIsAuthenticated(true)
    console.info('[auth] login success')
    return true
  }

  const logout = () => {
    if (isSupabaseConfigured) {
      void signOutSupabase()
    }
    setProfile(null)
    setIsAuthenticated(false)
  }

  return {
    profile,
    isSupported,
    isAuthenticated,
    register,
    login,
    logout,
    lastAuthError,
  }
}
