import { useCallback, useEffect, useMemo, useState } from 'react'
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

  const addressList = useMemo(
    () => wallets.map((wallet) => wallet.address),
    [wallets],
  )

  const refresh = useCallback(async () => {
    if (addressList.length === 0) {
      setError(null)
      setData({})
      return
    }
    if (!alchemyApiKey) {
      setError('Add an Alchemy API key in Settings to fetch portfolio data.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const results = await Promise.all(
        addressList.map((address) =>
          fetchWalletPortfolio({ address, chainIds, alchemyApiKey }),
        ),
      )
      const mapped: Record<string, WalletPortfolio> = {}
      results.forEach((portfolio) => {
        mapped[portfolio.address.toLowerCase()] = portfolio
      })
      setData(mapped)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch portfolio')
    } finally {
      setLoading(false)
    }
  }, [alchemyApiKey, addressList, chainIds])

  useEffect(() => {
    refresh()
    if (!alchemyApiKey || addressList.length === 0) {
      return
    }
    const timer = window.setInterval(refresh, refreshIntervalMs)
    return () => window.clearInterval(timer)
  }, [addressList, alchemyApiKey, refresh, refreshIntervalMs])

  return { data, loading, error, refresh }
}
