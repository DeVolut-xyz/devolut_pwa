import { useEffect, useState } from 'react'
import { readStorage, subscribeStorage, writeStorage } from './storage'
import {
  fetchUserProfile,
  isSupabaseConfigured,
  upsertUserProfile,
} from '../services/supabase'
import { getStoredCredentialId } from './authStorage'

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

  useEffect(() => {
    const loadFromSupabase = async () => {
      if (!isSupabaseConfigured) {
        return
      }
      try {
        const credentialId = getStoredCredentialId()
        const remote = await fetchUserProfile({ credentialId: credentialId ?? undefined })
        if (!remote) {
          return
        }
        const next: UserProfile = {
          nickname: remote.nickname ?? '',
          email: remote.email ?? '',
          bio: remote.bio ?? '',
          avatarDataUrl: remote.avatar_data_url ?? '',
          updatedAt: remote.updated_at ?? new Date().toISOString(),
        }
        setProfile(next)
        writeStorage<UserProfile>(PROFILE_KEY, next)
        console.info('[profile] loaded from supabase', {
          nickname: next.nickname,
        })
      } catch (error) {
        console.error('[profile] supabase load error', error)
      }
    }
    void loadFromSupabase()
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
    try {
      const credentialId = getStoredCredentialId()
      await upsertUserProfile({
        nickname: profile.nickname,
        email: profile.email,
        bio: profile.bio,
        avatarDataUrl: profile.avatarDataUrl,
        credentialId: credentialId ?? undefined,
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
