import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChainId } from '@factordao/tokenlist'
import type { TrackedWallet } from '../state/useWallets'
import { fetchWalletPortfolio } from '../services/portfolio'
import type { WalletPortfolio } from '../services/portfolio'

export function usePortfolioData({
  wallets,
  chainIds,
  alchemyApiKey,
  refreshIntervalMs,
}: {
  wallets: TrackedWallet[]
  chainIds: ChainId[]
  alchemyApiKey: string
  refreshIntervalMs: number
}) {
  const [data, setData] = useState<Record<string, WalletPortfolio>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const refreshInFlight = useRef(false)
  const lastRefreshAt = useRef(0)
  const minRefreshIntervalMs = 15000
  const batchSize = 2
  const batchDelayMs = 500

  const addressList = useMemo(
    () => wallets.map((wallet) => wallet.address),
    [wallets],
  )

  const refresh = useCallback(async () => {
    if (refreshInFlight.current) {
      return
    }
    const now = Date.now()
    if (now - lastRefreshAt.current < minRefreshIntervalMs) {
      return
    }
    refreshInFlight.current = true
    lastRefreshAt.current = now
    if (addressList.length === 0) {
      setError(null)
      setData({})
      refreshInFlight.current = false
      return
    }
    if (!alchemyApiKey) {
      setError('Add an Alchemy API key in Settings to fetch portfolio data.')
      refreshInFlight.current = false
      return
    }
    console.info('[portfolio] refresh start', {
      addresses: addressList,
      chainIds,
      refreshIntervalMs,
    })
    setLoading(true)
    setError(null)
    try {
      const results: PromiseSettledResult<WalletPortfolio>[] = []
      for (let i = 0; i < addressList.length; i += batchSize) {
        const batch = addressList.slice(i, i + batchSize)
        const batchResults = await Promise.allSettled(
          batch.map((address) =>
            fetchWalletPortfolio({ address, chainIds, alchemyApiKey }),
          ),
        )
        results.push(...batchResults)
        if (i + batchSize < addressList.length) {
          await new Promise((resolve) => {
            window.setTimeout(resolve, batchDelayMs)
          })
        }
      }
      const mapped: Record<string, WalletPortfolio> = {}
      let failures = 0
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          mapped[result.value.address.toLowerCase()] = result.value
          return
        }
        failures += 1
        console.error('[portfolio] wallet fetch failed', result.reason)
      })
      setData(mapped)
      if (failures > 0) {
        setError(
          `Some wallets failed to refresh (${failures}/${results.length}). Check network or Alchemy key.`,
        )
      }
      console.info('[portfolio] refresh success', {
        wallets: results.length,
        failures,
      })
    } catch (err) {
      console.error('[portfolio] refresh error', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch portfolio')
    } finally {
      setLoading(false)
      refreshInFlight.current = false
    }
  }, [alchemyApiKey, addressList, chainIds])

  useEffect(() => {
    refresh()
    if (!alchemyApiKey || addressList.length === 0) {
      return
    }
    const intervalMs = Math.max(refreshIntervalMs, minRefreshIntervalMs)
    const timer = window.setInterval(refresh, intervalMs)
    return () => window.clearInterval(timer)
  }, [addressList, alchemyApiKey, refresh, refreshIntervalMs])

  return { data, loading, error, refresh }
}
