import { ChainId } from '@factordao/tokenlist'
import { FactorVaultAnalytics } from '@factordao/vault-analytics'

/** Matches @factordao/vault-analytics VaultTokenMetadata for type compatibility */
export type VaultTokenMetadata = {
  balance: bigint
  balance_fmt: number
  chainId: ChainId
  type: 'unknown' | 'idle' | 'debt' | 'credit' | 'supply'
  protocol: 'unknown' | 'aave' | 'compound' | 'pendle' | 'silo' | 'morpho' | 'reth'
  value_usd: number
  reward_apy: number
  apy: number
  apr: number
  metadata: {
    symbol: string
    name: string
    decimals: number
    address: `0x${string}`
    underlying: `0x${string}`
  }
}

export type VaultDepositsWithMetadata = Record<string, VaultTokenMetadata>

export type VaultStats = {
  total_idle_usd: number
  total_debt_usd: number
  total_credit_usd: number
  weighted_apy_credit: number
  weighted_apy_debt: number
  credit_return: number
  debt_interests: number
  net_return: number
  calculated_apy: number
}

export type WalletPortfolio = {
  address: `0x${string}`
  deposits: VaultDepositsWithMetadata
  stats: VaultStats
  updatedAt: string
}

export async function fetchWalletPortfolio({
  address,
  chainIds,
  alchemyApiKey,
}: {
  address: `0x${string}`
  chainIds: ChainId[]
  alchemyApiKey: string
}): Promise<WalletPortfolio> {
  const deposits: VaultDepositsWithMetadata = {}
  for (const chainId of chainIds) {
    try {
      const analytics = new FactorVaultAnalytics(chainId, alchemyApiKey)
      const chainDeposits = await analytics.getVaultDeposits(address)
      for (const [tokenAddress, deposit] of Object.entries(chainDeposits)) {
        const key = `${chainId}:${tokenAddress}`
        deposits[key] = deposit
      }
    } catch (error) {
      console.error('[portfolio] chain fetch error', { address, chainId, error })
    }
  }
  const rawStats = await new FactorVaultAnalytics(
    chainIds[0] ?? ChainId.ETHEREUM,
    alchemyApiKey,
  ).calculateVaultStats(deposits as Parameters<FactorVaultAnalytics['calculateVaultStats']>[0])

  const totalValue =
    rawStats.total_idle_usd + rawStats.total_credit_usd - rawStats.total_debt_usd
  const calculated_apy =
    totalValue > 0 ? (rawStats.net_return / totalValue) * 100 : 0

  const stats: VaultStats = {
    ...rawStats,
    calculated_apy,
  }

  return {
    address,
    deposits,
    stats,
    updatedAt: new Date().toISOString(),
  }
}

export function sumWalletValue(portfolio?: WalletPortfolio) {
  if (!portfolio) {
    return 0
  }
  return Object.values(portfolio.deposits).reduce(
    (acc, item) => acc + item.value_usd,
    0,
  )
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value)
}

export function formatPercent(value: number) {
  const n = Number(value)
  if (n !== n || !Number.isFinite(n)) return '0.00%'
  return `${n.toFixed(2)}%`
}
