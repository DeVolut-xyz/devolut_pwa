import { useEffect, useState } from 'react'
import { readStorage, subscribeStorage, writeStorage } from './storage'
import {
  isPasskeySupported,
  loginWithAnyPasskey,
  loginWithPasskey,
  registerPasskey,
} from '../utils/passkey'

export type PasskeyProfile = {
  username: string
  credentialId: string
  createdAt: string
}

export const AUTH_STORAGE_KEY = 'factor-auth'

export function useAuth() {
  const [profile, setProfile] = useState<PasskeyProfile | null>(() =>
    readStorage<PasskeyProfile | null>(AUTH_STORAGE_KEY, null),
  )
  const [isSupported, setIsSupported] = useState(false)
  const [lastAuthError, setLastAuthError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    setIsSupported(isPasskeySupported())
    setIsAuthenticated(Boolean(profile))
    return subscribeStorage(() => {
      const nextProfile = readStorage<PasskeyProfile | null>(
        AUTH_STORAGE_KEY,
        null,
      )
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
    writeStorage(AUTH_STORAGE_KEY, nextProfile)
    setProfile(nextProfile)
    setIsAuthenticated(true)
    console.info('[auth] register success')
  }

  const login = async () => {
    setLastAuthError(null)
    console.info('[auth] login start')
    if (profile?.credentialId) {
      await loginWithPasskey(profile.credentialId)
      setIsAuthenticated(true)
      return true
    }
    const credentialId = await loginWithAnyPasskey()
    const username = 'User'
    const nextProfile: PasskeyProfile = {
      username,
      credentialId,
      createdAt: new Date().toISOString(),
    }
    writeStorage(AUTH_STORAGE_KEY, nextProfile)
    setProfile(nextProfile)
    setIsAuthenticated(true)
    console.info('[auth] login success')
    return true
  }

  const logout = () => {
    writeStorage<PasskeyProfile | null>(AUTH_STORAGE_KEY, null)
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
