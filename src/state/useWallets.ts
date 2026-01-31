import { useEffect, useState } from 'react'
import { readStorage, subscribeStorage, writeStorage } from './storage'
import {
  deleteTrackedWallet,
  fetchTrackedWallets,
  isSupabaseConfigured,
  upsertTrackedWallet,
} from '../services/supabase'
import { getStoredCredentialId } from './authStorage'

export type TrackedWallet = {
  id: string
  label: string
  address: `0x${string}`
}

const WALLETS_KEY = 'factor-wallets'

const defaultWallets: TrackedWallet[] = []

export function useWallets() {
  const [wallets, setWallets] = useState<TrackedWallet[]>(() =>
    readStorage<TrackedWallet[]>(WALLETS_KEY, defaultWallets),
  )
  const [syncStatus, setSyncStatus] = useState<
    'idle' | 'syncing' | 'error' | 'success'
  >('idle')
  const [syncError, setSyncError] = useState<string | null>(null)

  useEffect(() => {
    return subscribeStorage(() => {
      setWallets(readStorage<TrackedWallet[]>(WALLETS_KEY, defaultWallets))
    })
  }, [])

  const syncFromSupabase = async () => {
    if (!isSupabaseConfigured) {
      return
    }
    setSyncStatus('syncing')
    setSyncError(null)
    console.info('[supabase] wallet sync start')
    try {
      const credentialId = getStoredCredentialId()
      const remote = await fetchTrackedWallets({
        credentialId: credentialId ?? undefined,
      })
      console.info('[supabase] wallet sync fetched', {
        count: remote.length,
      })
      if (remote.length > 0) {
        const mapped = remote.map((wallet) => ({
          id: wallet.wallet_id,
          label: wallet.label,
          address: wallet.address,
        }))
        setWallets(mapped)
        writeStorage(WALLETS_KEY, mapped)
        setSyncStatus('success')
        console.info('[supabase] wallet sync applied', { count: mapped.length })
        return
      }
      if (wallets.length > 0) {
        await Promise.all(
          wallets.map((wallet) =>
            upsertTrackedWallet({
              walletId: wallet.id,
              label: wallet.label,
              address: wallet.address,
              credentialId: credentialId ?? undefined,
            }),
          ),
        )
        console.info('[supabase] wallet sync pushed local', {
          count: wallets.length,
        })
      }
      setSyncStatus('success')
    } catch (error) {
      setSyncStatus('error')
      setSyncError(error instanceof Error ? error.message : 'Sync failed')
      console.error('[supabase] wallet sync error', error)
    }
  }

  useEffect(() => {
    void syncFromSupabase()
  }, [])

  const addWallet = (wallet: Omit<TrackedWallet, 'id'>) => {
    const next = [
      ...wallets,
      { ...wallet, id: crypto.randomUUID() },
    ] as TrackedWallet[]
    setWallets(next)
    writeStorage(WALLETS_KEY, next)
    console.info('[wallets] add', { id: next[next.length - 1].id })
    if (isSupabaseConfigured) {
      const created = next[next.length - 1]
      const credentialId = getStoredCredentialId()
      void upsertTrackedWallet({
        walletId: created.id,
        label: created.label,
        address: created.address,
        credentialId: credentialId ?? undefined,
      })
        .then(() => {
          console.info('[supabase] wallet upsert success', {
            id: created.id,
          })
        })
        .catch((error) => {
          console.error('[supabase] wallet upsert error', error)
        })
    }
  }

  const removeWallet = (walletId: string) => {
    const next = wallets.filter((wallet) => wallet.id !== walletId)
    setWallets(next)
    writeStorage(WALLETS_KEY, next)
    console.info('[wallets] remove', { id: walletId })
    if (isSupabaseConfigured) {
      const credentialId = getStoredCredentialId()
      void deleteTrackedWallet(walletId, credentialId ?? undefined)
        .then(() => {
          console.info('[supabase] wallet delete success', { id: walletId })
        })
        .catch((error) => {
          console.error('[supabase] wallet delete error', error)
        })
    }
  }

  return { wallets, addWallet, removeWallet, syncFromSupabase, syncStatus, syncError }
}
