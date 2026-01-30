import { useEffect, useState } from 'react'
import { subscribeStorage } from './storage'
import {
  isPasskeySupported,
  loginWithAnyPasskey,
  loginWithPasskey,
  registerPasskey,
} from '../utils/passkey'
import {
  ensureSupabaseUser,
  fetchPasskeyAccountByCredentialId,
  isSupabaseConfigured,
  upsertPasskeyAccount,
  upsertUserProfile,
} from '../services/supabase'
import type { PasskeyProfile } from './authStorage'
import {
  getStoredPasskeyProfile,
  setStoredPasskeyProfile,
} from './authStorage'

export function useAuth() {
  const [profile, setProfile] = useState<PasskeyProfile | null>(() =>
    getStoredPasskeyProfile(),
  )
  const [isSupported, setIsSupported] = useState(false)
  const [lastAuthError, setLastAuthError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    setIsSupported(isPasskeySupported())
    setIsAuthenticated(Boolean(profile))
    return subscribeStorage(() => {
      const nextProfile = getStoredPasskeyProfile()
      setProfile(nextProfile)
      setIsAuthenticated(Boolean(nextProfile))
    })
  }, [])

  const register = async (username: string) => {
    setLastAuthError(null)
    console.info('[auth] register start', { username })
    const credentialId = await registerPasskey(username)
    const nextProfile: PasskeyProfile = {
      username,
      credentialId,
      createdAt: new Date().toISOString(),
    }
    setStoredPasskeyProfile(nextProfile)
    setProfile(nextProfile)
    setIsAuthenticated(true)
    if (isSupabaseConfigured) {
      try {
        await ensureSupabaseUser()
        await upsertPasskeyAccount({
          username,
          createdAt: nextProfile.createdAt,
          credentialId,
        })
        await upsertUserProfile({
          nickname: username,
          email: '',
          bio: '',
          avatarDataUrl: '',
          credentialId,
        })
        console.info('[auth] supabase passkey saved', { credentialId })
      } catch (error) {
        console.error('[auth] supabase passkey save error', error)
      }
    }
    console.info('[auth] register success', { credentialId })
  }

  const login = async () => {
    setLastAuthError(null)
    console.info('[auth] login start')
    if (profile?.credentialId) {
      await loginWithPasskey(profile.credentialId)
      if (isSupabaseConfigured) {
        try {
          await ensureSupabaseUser()
          await upsertPasskeyAccount({
            username: profile.username,
            createdAt: profile.createdAt,
            credentialId: profile.credentialId,
          })
        } catch (error) {
          console.error('[auth] supabase passkey sync error', error)
        }
      }
      setIsAuthenticated(true)
      return true
    }
    const credentialId = await loginWithAnyPasskey()
    let username = 'User'
    if (isSupabaseConfigured) {
      try {
        await ensureSupabaseUser()
        const account = await fetchPasskeyAccountByCredentialId(credentialId)
        if (account?.username) {
          username = account.username
        }
        if (!account) {
          await upsertPasskeyAccount({
            username,
            createdAt: new Date().toISOString(),
            credentialId,
          })
        }
      } catch (error) {
        console.error('[auth] supabase lookup error', error)
      }
    }
    const nextProfile: PasskeyProfile = {
      username,
      credentialId,
      createdAt: new Date().toISOString(),
    }
    setStoredPasskeyProfile(nextProfile)
    setProfile(nextProfile)
    setIsAuthenticated(true)
    console.info('[auth] login success', { credentialId })
    return true
  }

  const logout = () => {
    setStoredPasskeyProfile(null)
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
