import { ChainId } from '@factordao/tokenlist'
import { FactorVaultAnalytics } from '@factordao/vault-analytics'

export type VaultTokenMetadata = {
  balance_fmt: number
  chainId: ChainId
  type: string
  protocol: string
  value_usd: number
  reward_apy: number
  apy: number
  apr: number
  metadata: {
    symbol: string
    name: string
    decimals: number
    address: string
    underlying: string
  }
}

export type VaultStats = {
  total_idle_usd: number
  total_debt_usd: number
  total_credit_usd: number
  net_return: number
  calculated_apy: number
}

export type WalletPortfolio = {
  address: string
  deposits: Record<string, VaultTokenMetadata>
  stats: VaultStats
  updatedAt: string
}

const OPTIMISM = 10 as ChainId
const chainIdsFilter = (ids: ChainId[]) =>
  ids.filter((id) => id !== OPTIMISM) as ChainId[]

export async function fetchWalletPortfolio({
  address,
  chainIds,
  alchemyApiKey,
}: {
  address: string
  chainIds: ChainId[]
  alchemyApiKey: string
}): Promise<WalletPortfolio> {
  const ids = chainIdsFilter(chainIds)
  if (ids.length === 0) {
    return {
      address,
      deposits: {},
      stats: {
        total_idle_usd: 0,
        total_debt_usd: 0,
        total_credit_usd: 0,
        net_return: 0,
        calculated_apy: 0,
      },
      updatedAt: new Date().toISOString(),
    }
  }
  const analytics = new FactorVaultAnalytics(ids[0], alchemyApiKey)
  const deposits = await analytics.getVaultDeposits(address as `0x${string}`)
  const stats = await analytics.calculateVaultStats(deposits, 0)
  const normalized: Record<string, VaultTokenMetadata> = {}
  for (const [k, v] of Object.entries(deposits)) {
    normalized[k] = {
      balance_fmt: v.balance_fmt,
      chainId: v.chainId,
      type: v.type,
      protocol: v.protocol,
      value_usd: v.value_usd,
      reward_apy: v.reward_apy,
      apy: v.apy,
      apr: v.apr,
      metadata: {
        symbol: v.metadata.symbol,
        name: v.metadata.name,
        decimals: v.metadata.decimals,
        address: v.metadata.address,
        underlying: v.metadata.underlying,
      },
    }
  }
  return {
    address,
    deposits: normalized,
    stats: {
      total_idle_usd: stats.total_idle_usd,
      total_debt_usd: stats.total_debt_usd,
      total_credit_usd: stats.total_credit_usd,
      net_return: stats.net_return,
      calculated_apy: stats.calculated_apy,
    },
    updatedAt: new Date().toISOString(),
  }
}

export function sumWalletValue(portfolio: WalletPortfolio): number {
  return (
    portfolio.stats.total_idle_usd +
    portfolio.stats.total_credit_usd -
    portfolio.stats.total_debt_usd
  )
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value)
}

export function formatPercent(value: number): string {
  const n = Number(value)
  if (n !== n || !isFinite(n)) return '0.00%'
  return `${n.toFixed(2)}%`
}
