import { useCallback, useEffect, useMemo, useRef } from 'react'
import { ChainId } from '@factordao/tokenlist'
import type { TrackedWallet } from '../state/useWallets'
import { fetchWalletPortfolio } from '../services/portfolio'
import type { WalletPortfolio } from '../services/portfolio'
import {
  getPortfolioState,
  setPortfolioState,
  usePortfolioStore,
} from '../state/portfolioStore'

const DEFAULT_REFRESH_INTERVAL_MS = 5 * 60 * 1000

export function usePortfolioData({
  wallets,
  chainIds,
  alchemyApiKey,
  refreshIntervalMs = DEFAULT_REFRESH_INTERVAL_MS,
  autoRefresh = true,
  refreshOnMount,
}: {
  wallets: TrackedWallet[]
  chainIds: ChainId[]
  alchemyApiKey: string
  refreshIntervalMs?: number
  autoRefresh?: boolean
  refreshOnMount?: boolean
}) {
  const { data, loading, error, lastRefreshAt } = usePortfolioStore()
  const refreshInFlight = useRef(false)
  const minRefreshIntervalMs = 15000
  const batchSize = 2
  const batchDelayMs = 500

  const addressList = useMemo(
    () => wallets.map((wallet) => wallet.address),
    [wallets],
  )

  const refresh = useCallback(async (force = false) => {
    if (refreshInFlight.current) {
      return
    }
    const now = Date.now()
    const previousRefreshAt = getPortfolioState().lastRefreshAt
    if (!force && now - previousRefreshAt < minRefreshIntervalMs) {
      return
    }
    refreshInFlight.current = true
    setPortfolioState({ loading: true, error: null })
    if (addressList.length === 0) {
      setPortfolioState({
        data: {},
        loading: false,
        error: null,
        lastRefreshAt: now,
      })
      refreshInFlight.current = false
      return
    }
    if (!alchemyApiKey) {
      setPortfolioState({
        loading: false,
        error: 'Add an Alchemy API key in Settings to fetch portfolio data.',
      })
      refreshInFlight.current = false
      return
    }
    console.info('[portfolio] refresh start', {
      addresses: addressList,
      chainIds,
      refreshIntervalMs,
    })
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
      const previousData = getPortfolioState().data
      const nextData = { ...previousData, ...mapped }
      if (failures > 0) {
        setPortfolioState({
          data: nextData,
          error: `Some wallets failed to refresh (${failures}/${results.length}). Check network or Alchemy key.`,
          lastRefreshAt: now,
        })
      } else {
        setPortfolioState({
          data: nextData,
          error: null,
          lastRefreshAt: now,
        })
      }
      console.info('[portfolio] refresh success', {
        wallets: results.length,
        failures,
      })
    } catch (err) {
      console.error('[portfolio] refresh error', err)
      setPortfolioState({
        error: err instanceof Error ? err.message : 'Failed to fetch portfolio',
        lastRefreshAt: now,
      })
    } finally {
      setPortfolioState({ loading: false })
      refreshInFlight.current = false
    }
  }, [alchemyApiKey, addressList, chainIds])

  useEffect(() => {
    if (!autoRefresh) {
      return
    }
    const now = Date.now()
    const isStale =
      !lastRefreshAt || now - lastRefreshAt > refreshIntervalMs
    const shouldRefresh = refreshOnMount ?? isStale
    if (shouldRefresh) {
      refresh()
    }
    if (!alchemyApiKey || addressList.length === 0) {
      return
    }
    const intervalMs = Math.max(refreshIntervalMs, minRefreshIntervalMs)
    const timer = window.setInterval(refresh, intervalMs)
    return () => window.clearInterval(timer)
  }, [
    addressList,
    alchemyApiKey,
    autoRefresh,
    lastRefreshAt,
    refresh,
    refreshIntervalMs,
    refreshOnMount,
  ])

  return { data, loading, error, refresh }
}
