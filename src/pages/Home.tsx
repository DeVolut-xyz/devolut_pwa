import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useSettings } from '../state/useSettings'
import { useWallets } from '../state/useWallets'
import { usePortfolioData } from '../hooks/usePortfolioData'
import {
  getSupabaseAuthStatus,
  isSupabaseConfigured,
  isSupabaseKeyValid,
} from '../services/supabase'
import { formatCurrency, formatPercent, sumWalletValue } from '../services/portfolio'
import { getTokenLogo } from '../data/tokenLogos'
import { LiquidButton, LiquidCard } from '../ui/liquid'
import { copyToClipboard, shortenAddress } from '../utils/format'
import { Activity, Copy, Database, RefreshCw, Wallet } from 'lucide-react'

type TopPosition = {
  address: string
  sourceWallet: string
  value_usd: number
  metadata: {
    symbol: string
  }
}

export function HomePage() {
  const { settings } = useSettings()
  const { wallets, syncFromSupabase, syncStatus, syncError } = useWallets()
  const supabaseConfigured = isSupabaseConfigured
  const supabaseAuthStatus = getSupabaseAuthStatus()
  const { data, loading, error, refresh } = usePortfolioData({
    wallets,
    chainIds: settings.chainIds,
    alchemyApiKey: settings.alchemyApiKey,
    refreshIntervalMs: settings.refreshIntervalMs,
  })

  const totals = useMemo(() => {
    let totalValue = 0
    let totalNetReturn = 0
    let updatedAt = ''

    wallets.forEach((wallet) => {
      const portfolio = data[wallet.address.toLowerCase()]
      if (!portfolio) {
        return
      }
      totalValue += sumWalletValue(portfolio)
      totalNetReturn += portfolio.stats.net_return
      if (!updatedAt || portfolio.updatedAt > updatedAt) {
        updatedAt = portfolio.updatedAt
      }
    })

    return {
      totalValue,
      netApy: totalValue > 0 ? (totalNetReturn / totalValue) * 100 : 0,
      updatedAt,
    }
  }, [data, wallets])

  const topPositions = useMemo(() => {
    const positions: TopPosition[] = []
    Object.values(data).forEach((portfolio) => {
      Object.entries(portfolio.deposits).forEach(([tokenAddress, deposit]) => {
        positions.push({
          ...deposit,
          address: tokenAddress,
          sourceWallet: portfolio.address,
        })
      })
    })
    return positions
      .filter((position) => position.value_usd > 0)
      .sort((a, b) => b.value_usd - a.value_usd)
      .slice(0, 6)
  }, [data])

  const statusTone = (status: 'idle' | 'syncing' | 'error' | 'success') => {
    switch (status) {
      case 'success':
        return 'chip-success'
      case 'error':
        return 'chip-error'
      case 'syncing':
        return 'chip-info'
      default:
        return 'chip-warn'
    }
  }

  const supabaseIssue =
    !supabaseConfigured ||
    !isSupabaseKeyValid ||
    supabaseAuthStatus.disabled ||
    Boolean(supabaseAuthStatus.error)
  const supabaseMessage = !supabaseConfigured
    ? 'Supabase not configured.'
    : !isSupabaseKeyValid
      ? 'Supabase key mismatch.'
      : supabaseAuthStatus.disabled
        ? 'Anonymous sign-in disabled.'
        : supabaseAuthStatus.error
          ? `Supabase auth error: ${supabaseAuthStatus.error}`
          : null

  return (
    <div className="glass-grid" style={{ gap: 24 }}>
      <section>
        <LiquidCard>
          <div className="glass-header">
            <div>
              <div className="glass-title">Portfolio Overview</div>
              <div className="glass-subtitle">
                Real-time wallet balances, exposures, and APY.
              </div>
            </div>
            <div className="toolbar">
              <span
                className={`status-pill header-chip ${
                  loading ? 'chip-info' : 'chip-success'
                }`}
              >
                <Activity className="chip-icon" size={14} strokeWidth={1.8} />
                {loading ? 'Updating...' : 'Live'}
              </span>
              <LiquidButton variant="secondary" className="header-chip" onClick={refresh}>
                <RefreshCw className="chip-icon" size={14} strokeWidth={1.8} />
                Refresh now
              </LiquidButton>
            </div>
          </div>
          <div className="glass-grid two" style={{ marginTop: 16 }}>
            <LiquidCard variant="dark">
              <div className="wallet-meta">Total Portfolio Value</div>
              <div className="wallet-balance">{formatCurrency(totals.totalValue)}</div>
              <div className="wallet-meta">
                Net APY {formatPercent(totals.netApy)} •{' '}
                {totals.updatedAt
                  ? `Updated ${new Date(totals.updatedAt).toLocaleTimeString()}`
                  : 'No data yet'}
              </div>
            </LiquidCard>
            <LiquidCard variant="dark">
              <div className="wallet-meta">Top exposures</div>
              <div className="chip-row" style={{ marginTop: 10 }}>
                {topPositions.length === 0 && (
                  <span className="notice">No positions yet.</span>
                )}
                {topPositions.map((position) => (
                  <span
                    key={`${position.sourceWallet}-${position.address}`}
                    className="glass-chip"
                  >
                    {getTokenLogo(position.metadata.symbol) && (
                      <img
                        src={getTokenLogo(position.metadata.symbol)}
                        alt={position.metadata.symbol}
                      />
                    )}
                    {position.metadata.symbol} · {formatCurrency(position.value_usd)}
                  </span>
                ))}
              </div>
            </LiquidCard>
          </div>
          {error && (
            <p className="notice error-log" style={{ marginTop: 12 }}>
              {error}
            </p>
          )}
        </LiquidCard>
      </section>

      <section>
        <LiquidCard>
          <div className="glass-header">
            <div>
              <h3>Tracked wallets</h3>
            </div>
            <div className="toolbar">
              <span className="status-pill header-chip chip-info">
                <Wallet className="chip-icon" size={14} strokeWidth={1.8} />
                {wallets.length} wallets
              </span>
              <span
                className={`status-pill header-chip ${
                  supabaseConfigured ? statusTone(syncStatus) : 'chip-warn'
                }`}
              >
                <Database className="chip-icon" size={14} strokeWidth={1.8} />
                Supabase {supabaseConfigured ? syncStatus : 'offline'}
              </span>
              <LiquidButton
                variant="secondary"
                className="header-chip"
                onClick={syncFromSupabase}
                disabled={!supabaseConfigured}
              >
                <RefreshCw className="chip-icon" size={14} strokeWidth={1.8} />
                Sync now
              </LiquidButton>
              <Link className="glass-button secondary link header-chip" to="/settings">
                <Wallet className="chip-icon" size={14} strokeWidth={1.8} />
                Manage wallets
              </Link>
            </div>
          </div>
          {syncError && (
            <p className="notice error-log" style={{ marginTop: 8 }}>
              {syncError}
            </p>
          )}
          {supabaseIssue && supabaseMessage && (
            <p className="notice error-log" style={{ marginTop: 8 }}>
              {supabaseMessage}
            </p>
          )}
          <div className="glass-grid" style={{ gap: 12 }}>
            {wallets.length === 0 && (
              <p className="notice">No wallets yet. Add your first address.</p>
            )}
            {wallets.map((wallet) => (
                <LiquidCard
                  key={wallet.id}
                  variant="dark"
                  className="wallet-card compact"
                >
                  <div className="wallet-title">
                    <div>
                      <strong>{wallet.label}</strong>
                      <div className="wallet-meta address-line">
                        {shortenAddress(wallet.address)}
                        <button
                          className="copy-button"
                          onClick={() => copyToClipboard(wallet.address)}
                          title="Copy address"
                          aria-label="Copy address"
                        >
                          <Copy size={14} strokeWidth={1.8} />
                        </button>
                      </div>
                    </div>
                    <div className="nav-actions">
                      <Link className="glass-button secondary link" to={`/address/${wallet.address}`}>
                        View
                      </Link>
                    </div>
                  </div>
                </LiquidCard>
            ))}
          </div>
        </LiquidCard>
      </section>
    </div>
  )
}
