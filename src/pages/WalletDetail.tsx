import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useSettings } from '../state/useSettings'
import { usePortfolioData } from '../hooks/usePortfolioData'
import { formatCurrency, formatPercent, sumWalletValue } from '../services/portfolio'
import { VaultBalanceSheet } from '../components/VaultBalanceSheet'
import { LiquidCard } from '../ui/liquid'
import { copyToClipboard, shortenAddress } from '../utils/format'
import { Copy } from 'lucide-react'

export function WalletDetailPage() {
  const { address } = useParams<{ address: string }>()
  const { settings } = useSettings()
  const { data, loading } = usePortfolioData({
    wallets: address ? [{ id: 'detail', address: address as `0x${string}`, label: address }] : [],
    chainIds: settings.chainIds,
    alchemyApiKey: settings.alchemyApiKey,
  })
  const portfolio = address ? data[address.toLowerCase()] : null

  const assets =
    portfolio &&
    Object.entries(portfolio.deposits).reduce(
      (acc, [key, dep]) => {
        const next = acc.get(key) ?? {
          key,
          symbol: dep.metadata.symbol,
          amount: 0,
          valueUsd: 0,
          protocol: dep.protocol !== 'unknown' ? dep.protocol : undefined,
          logoUrl: undefined,
        }
        next.amount += dep.balance_fmt
        next.valueUsd += dep.value_usd
        acc.set(key, next)
        return acc
      },
      new Map<string, { key: string; symbol: string; amount: number; valueUsd: number; protocol?: string; logoUrl?: string }>(),
    )
  const assetList = assets ? Array.from(assets.values()).filter((a) => a.valueUsd > 0) : []
  const totalValueUsd = assetList.reduce((s, a) => s + a.valueUsd, 0)

  if (!address) {
    return (
      <div className="glass-grid">
        <p className="notice">Missing address.</p>
        <Link to="/home">Back to Home</Link>
      </div>
    )
  }

  return (
    <div className="glass-grid" style={{ gap: 24 }}>
      <section className="glass-grid" style={{ gap: 12 }}>
        <div className="glass-header">
          <Link
            className="glass-button secondary link header-chip"
            to="/home"
            aria-label="Back"
          >
            <ArrowLeft className="chip-icon" size={14} strokeWidth={1.8} />
          </Link>
          <div className="glass-title">Wallet</div>
        </div>
        <LiquidCard variant="dark">
          <div className="wallet-meta address-line">
            {shortenAddress(address)}
            <button
              className="copy-button"
              onClick={() => copyToClipboard(address)}
              title="Copy address"
              aria-label="Copy address"
            >
              <Copy size={14} strokeWidth={1.8} />
            </button>
          </div>
          {loading && !portfolio && (
            <div className="skeleton-block">
              <div className="skeleton-line wide" />
            </div>
          )}
          {portfolio && (
            <div className="wallet-summary">
              <div className="wallet-summary-item">
                <span className="wallet-summary-label">Balance</span>
                <span className="wallet-summary-value">
                  {formatCurrency(sumWalletValue(portfolio))}
                </span>
              </div>
              <div className="wallet-summary-item">
                <span className="wallet-summary-label">Net APY</span>
                <span className="wallet-summary-value">
                  {formatPercent(portfolio.stats.calculated_apy)}
                </span>
              </div>
            </div>
          )}
        </LiquidCard>
        {portfolio && (
          <VaultBalanceSheet
            assets={assetList}
            totalValueUsd={totalValueUsd}
            isLoading={loading}
            debankUrl={`https://debank.com/profile/${address}`}
          />
        )}
      </section>
    </div>
  )
}
