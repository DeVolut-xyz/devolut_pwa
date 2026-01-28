import { useEffect, useState } from 'react'
import { ChainId } from '@factordao/tokenlist'
import { readStorage, subscribeStorage, writeStorage } from './storage'
import {
  fetchUserSettings,
  getSupabaseSession,
  isSupabaseConfigured,
  upsertUserSettings,
} from '../services/supabase'

const SETTINGS_KEY = 'factor-settings'

export type AppSettings = {
  chainIds: ChainId[]
  alchemyApiKey: string
  refreshIntervalMs: number
}

const defaultSettings: AppSettings = {
  chainIds: [ChainId.ETHEREUM],
  alchemyApiKey: '',
  refreshIntervalMs: 30000,
}

function normalizeSettings(input: AppSettings | Record<string, unknown>) {
  const asAny = input as AppSettings & { chainId?: ChainId }
  if (Array.isArray(asAny.chainIds) && asAny.chainIds.length > 0) {
    return asAny
  }
  if (asAny.chainId) {
    return { ...asAny, chainIds: [asAny.chainId] } as AppSettings
  }
  return defaultSettings
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() =>
    normalizeSettings(readStorage<AppSettings>(SETTINGS_KEY, defaultSettings)),
  )
  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'success' | 'error'
  >('idle')
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    return subscribeStorage(() => {
      setSettings(
        normalizeSettings(
          readStorage<AppSettings>(SETTINGS_KEY, defaultSettings),
        ),
      )
    })
  }, [])

  useEffect(() => {
    const loadFromSupabase = async () => {
      if (!isSupabaseConfigured) {
        return
      }
      const session = await getSupabaseSession()
      if (!session) {
        return
      }
      try {
        const remote = await fetchUserSettings()
        if (!remote) {
          return
        }
        const next: AppSettings = {
          chainIds:
            remote.chain_ids && remote.chain_ids.length > 0
              ? (remote.chain_ids as ChainId[])
              : remote.chain_id
                ? ([remote.chain_id] as ChainId[])
                : defaultSettings.chainIds,
          alchemyApiKey: remote.alchemy_api_key ?? '',
          refreshIntervalMs: remote.refresh_interval_ms ?? 30000,
        }
        setSettings(next)
        writeStorage<AppSettings>(SETTINGS_KEY, next)
        console.info('[settings] loaded from supabase', {
          chainIds: next.chainIds,
          refreshIntervalMs: next.refreshIntervalMs,
        })
      } catch (error) {
        console.error('[settings] supabase load error', error)
      }
    }
    void loadFromSupabase()
  }, [])

  const updateSettings = (next: Partial<AppSettings>) => {
    const updated = { ...settings, ...next }
    setSettings(updated)
    writeStorage<AppSettings>(SETTINGS_KEY, updated)
    const maskedKey =
      updated.alchemyApiKey.length > 6
        ? `${updated.alchemyApiKey.slice(0, 4)}...${updated.alchemyApiKey.slice(
            -4,
          )}`
        : updated.alchemyApiKey
    console.info('[settings] update', {
      chainIds: updated.chainIds,
      refreshIntervalMs: updated.refreshIntervalMs,
      alchemyApiKey: maskedKey || 'empty',
    })
  }

  const saveToSupabase = async () => {
    if (!isSupabaseConfigured) {
      return
    }
    setSaveStatus('saving')
    setSaveError(null)
    const maskedKey =
      settings.alchemyApiKey.length > 6
        ? `${settings.alchemyApiKey.slice(0, 4)}...${settings.alchemyApiKey.slice(
            -4,
          )}`
        : settings.alchemyApiKey
    console.info('[settings] supabase save start', {
      chainIds: settings.chainIds,
      refreshIntervalMs: settings.refreshIntervalMs,
      alchemyApiKey: maskedKey || 'empty',
    })
    try {
      await upsertUserSettings({
        chainIds: settings.chainIds,
        refreshIntervalMs: settings.refreshIntervalMs,
        alchemyApiKey: settings.alchemyApiKey,
      })
      setSaveStatus('success')
      console.info('[settings] supabase save success')
    } catch (error) {
      setSaveStatus('error')
      setSaveError(
        error instanceof Error ? error.message : 'Supabase save failed',
      )
      console.error('[settings] supabase save error', error)
    }
  }

  return { settings, updateSettings, saveToSupabase, saveStatus, saveError }
}
