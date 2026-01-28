import { useEffect, useState } from 'react'
import { readStorage, subscribeStorage, writeStorage } from './storage'
import { AUTH_STORAGE_KEY } from './useAuth'
import type { PasskeyProfile } from './useAuth'
import { isSupabaseConfigured, upsertUserProfile } from '../services/supabase'

const PROFILE_KEY = 'factor-user-profile'

export type UserProfile = {
  nickname: string
  email: string
  bio: string
  avatarDataUrl?: string
  updatedAt: string
}

const defaultProfile: UserProfile = {
  nickname: '',
  email: '',
  bio: '',
  updatedAt: new Date(0).toISOString(),
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile>(() =>
    readStorage<UserProfile>(PROFILE_KEY, defaultProfile),
  )
  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'success' | 'error'
  >('idle')
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    return subscribeStorage(() => {
      setProfile(readStorage<UserProfile>(PROFILE_KEY, defaultProfile))
    })
  }, [])

  const updateProfile = (next: Partial<UserProfile>) => {
    const updated = {
      ...profile,
      ...next,
      updatedAt: new Date().toISOString(),
    }
    setProfile(updated)
    writeStorage<UserProfile>(PROFILE_KEY, updated)
  }

  const saveToSupabase = async () => {
    if (!isSupabaseConfigured) {
      return
    }
    setSaveStatus('saving')
    setSaveError(null)
    const authProfile = readStorage<PasskeyProfile | null>(
      AUTH_STORAGE_KEY,
      null,
    )
    const credentialId = authProfile?.credentialId
    try {
      await upsertUserProfile({
        nickname: profile.nickname,
        email: profile.email,
        bio: profile.bio,
        avatarDataUrl: profile.avatarDataUrl,
        credentialId,
      })
      setSaveStatus('success')
    } catch (error) {
      setSaveStatus('error')
      setSaveError(
        error instanceof Error ? error.message : 'Profile save failed',
      )
    }
  }

  return {
    profile,
    updateProfile,
    saveToSupabase,
    saveStatus,
    saveError,
  }
}
