import { useEffect, useState } from 'react'
import { readStorage, subscribeStorage, writeStorage } from './storage'
import {
  isPasskeySupported,
  loginWithPasskey,
  loginWithAnyPasskey,
  registerPasskey,
} from '../utils/passkey'
import {
  fetchPasskeyAccountByCredential,
  isSupabaseConfigured,
  upsertPasskeyAccount,
} from '../services/supabase'

export const AUTH_STORAGE_KEY = 'factor-auth'
const PASSKEY_INDEX_KEY = 'factor-passkey-index'

export type PasskeyProfile = {
  username: string
  credentialId: string
  createdAt: string
}

export function useAuth() {
  const [profile, setProfile] = useState<PasskeyProfile | null>(() =>
    readStorage<PasskeyProfile | null>(AUTH_STORAGE_KEY, null),
  )
  const [isSupported, setIsSupported] = useState(false)
  const [lastAuthError, setLastAuthError] = useState<string | null>(null)

  const savePasskeyIndex = (credentialId: string, username: string) => {
    const current = readStorage<Record<string, string>>(
      PASSKEY_INDEX_KEY,
      {},
    )
    const next = { ...current, [credentialId]: username }
    writeStorage(PASSKEY_INDEX_KEY, next)
  }

  const lookupPasskeyUsername = (credentialId: string) => {
    const current = readStorage<Record<string, string>>(
      PASSKEY_INDEX_KEY,
      {},
    )
    return current[credentialId]
  }

  useEffect(() => {
    setIsSupported(isPasskeySupported())
    return subscribeStorage(() => {
      setProfile(readStorage<PasskeyProfile | null>(AUTH_STORAGE_KEY, null))
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
    savePasskeyIndex(credentialId, username)
    if (isSupabaseConfigured) {
      console.info('[auth] register supabase sync')
      await upsertPasskeyAccount({
        username,
        credentialId,
        createdAt: nextProfile.createdAt,
      })
    }
    console.info('[auth] register success', nextProfile)
  }

  const login = async () => {
    setLastAuthError(null)
    console.info('[auth] login start', { hasProfile: Boolean(profile) })
    if (profile) {
      try {
        await loginWithPasskey(profile.credentialId)
      } catch (error) {
        const credentialId = await loginWithAnyPasskey()
        const localUsername = lookupPasskeyUsername(credentialId)
        if (localUsername) {
          const nextProfile: PasskeyProfile = {
            username: localUsername,
            credentialId,
            createdAt: new Date().toISOString(),
          }
          writeStorage(AUTH_STORAGE_KEY, nextProfile)
          setProfile(nextProfile)
          console.info('[auth] login success (local index)', nextProfile)
          return true
        }
        if (!isSupabaseConfigured) {
          setLastAuthError(
            error instanceof Error ? error.message : 'Login failed',
          )
          throw error
        }
        const account = await fetchPasskeyAccountByCredential(credentialId)
        if (!account) {
          setLastAuthError('Passkey not found on Supabase.')
          throw new Error('Passkey not found on Supabase.')
        }
        const nextProfile: PasskeyProfile = {
          username: account.username,
          credentialId,
          createdAt: account.created_at,
        }
          writeStorage(AUTH_STORAGE_KEY, nextProfile)
        setProfile(nextProfile)
        savePasskeyIndex(credentialId, account.username)
        console.info('[auth] login success (supabase)', nextProfile)
        return true
      }
      if (isSupabaseConfigured) {
        const account = await fetchPasskeyAccountByCredential(
          profile.credentialId,
        )
        if (account && account.username !== profile.username) {
          const nextProfile = {
            ...profile,
            username: account.username,
          }
            writeStorage(AUTH_STORAGE_KEY, nextProfile)
          setProfile(nextProfile)
        }
      }
      console.info('[auth] login success (local)', profile)
      return true
    }

    const credentialId = await loginWithAnyPasskey()
    const localUsername = lookupPasskeyUsername(credentialId)
    if (localUsername) {
      const nextProfile: PasskeyProfile = {
        username: localUsername,
        credentialId,
        createdAt: new Date().toISOString(),
      }
      writeStorage(AUTH_STORAGE_KEY, nextProfile)
      setProfile(nextProfile)
      console.info('[auth] login success (local index, new profile)', nextProfile)
      return true
    }
    if (!isSupabaseConfigured) {
      setLastAuthError('No passkey registered yet.')
      throw new Error('No passkey registered yet.')
    }
    const account = await fetchPasskeyAccountByCredential(credentialId)
    if (!account) {
      setLastAuthError('Passkey not found on Supabase.')
      throw new Error('Passkey not found on Supabase.')
    }
    const nextProfile: PasskeyProfile = {
      username: account.username,
      credentialId,
      createdAt: account.created_at,
    }
    writeStorage(AUTH_STORAGE_KEY, nextProfile)
    setProfile(nextProfile)
    savePasskeyIndex(credentialId, account.username)
    console.info('[auth] login success (supabase, new profile)', nextProfile)
    return true
  }

  const logout = () => {
    writeStorage<PasskeyProfile | null>(AUTH_STORAGE_KEY, null)
    setProfile(null)
  }

  return {
    profile,
    isSupported,
    isAuthenticated: Boolean(profile),
    register,
    login,
    logout,
    lastAuthError,
  }
}
