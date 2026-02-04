import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSettings } from '../state/useSettings'
import { useWallets } from '../state/useWallets'
import { usePortfolioData } from '../hooks/usePortfolioData'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { isSupabaseConfigured } from '../services/supabase'
import { formatCurrency, formatPercent, sumWalletValue } from '../services/portfolio'
import { buildTokenLogoKey, useTokenLogos } from '../data/tokenLogos'
import { VaultBalanceSheet } from '../components/VaultBalanceSheet'
import { VaultCreditDebt } from '../components/VaultCreditDebt'
import { VaultFundsHealth } from '../components/VaultFundsHealth'
import { LiquidButton, LiquidCard } from '../ui/liquid'
import { copyToClipboard, shortenAddress } from '../utils/format'
import { Copy, RefreshCw, Wallet } from 'lucide-react'

type AggregatedAsset = {
  key: string
  symbol: string
  amount: number
  valueUsd: number
  protocol?: string
  logoUrl?: string
}

export function HomePage() {
  const { settings } = useSettings()
  const { wallets, syncFromSupabase, syncError } = useWallets()
  const navigate = useNavigate()
  const supabaseConfigured = isSupabaseConfigured
  const { getLogo, version: tokenLogoVersion } = useTokenLogos()
  const { data, loading, error, refresh } = usePortfolioData({
    wallets,
    chainIds: settings.chainIds,
    alchemyApiKey: settings.alchemyApiKey,
  })
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

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

  const aggregated = useMemo(() => {
    const assets = new Map<string, AggregatedAsset>()
    const allTokens: Array<{
      value_usd: number
      apy: number
      type: string
      protocol: string
    }> = []
    Object.values(data).forEach((portfolio) => {
      Object.entries(portfolio.deposits).forEach(([tokenKey, deposit]) => {
        const normalizedKey = buildTokenLogoKey({
          chainId: deposit.chainId,
          address: deposit.metadata.address,
          tokenKey,
        })
        allTokens.push({
          value_usd: deposit.value_usd,
          apy: deposit.apy,
          type: deposit.type,
          protocol: deposit.protocol,
        })
        const logoUrl =
          (normalizedKey ? getLogo(normalizedKey) : undefined) ??
          getLogo(deposit.metadata.symbol)
        if (!logoUrl && deposit.value_usd > 0) {
          console.info('[tokenLogos] missing logo', {
            normalizedKey,
            tokenKey,
            chainId: deposit.chainId,
            address: deposit.metadata.address,
            symbol: deposit.metadata.symbol,
          })
        }
        const next = assets.get(tokenKey) ?? {
          key: tokenKey,
          symbol: deposit.metadata.symbol,
          amount: 0,
          valueUsd: 0,
          protocol:
            deposit.protocol && deposit.protocol !== 'unknown'
              ? deposit.protocol
              : undefined,
          logoUrl,
        }
        next.amount += deposit.balance_fmt
        next.valueUsd += deposit.value_usd
        assets.set(tokenKey, next)
      })
    })
    const assetList = Array.from(assets.values()).filter(
      (asset) => asset.valueUsd > 0,
    )
    const totalValueUsd = assetList.reduce(
      (sum, asset) => sum + asset.valueUsd,
      0,
    )
    const creditTokens = allTokens.filter(
      (token) => token.type === 'credit' || token.type === 'supply',
    )
    const debtTokens = allTokens.filter((token) => token.type === 'debt')
    const creditTotalUsd = creditTokens.reduce(
      (sum, token) => sum + token.value_usd,
      0,
    )
    const debtTotalUsd = debtTokens.reduce(
      (sum, token) => sum + token.value_usd,
      0,
    )
    const baseSupplyApy =
      creditTotalUsd > 0
        ? creditTokens.reduce(
            (sum, token) => sum + token.apy * token.value_usd,
            0,
          ) / creditTotalUsd
        : undefined
    const baseBorrowApy =
      debtTotalUsd > 0
        ? debtTokens.reduce(
            (sum, token) => sum + token.apy * token.value_usd,
            0,
          ) / debtTotalUsd
        : undefined
    const creditProtocols = creditTokens.reduce(
      (acc, token) => {
        const key = token.protocol || 'unknown'
        acc.set(key, (acc.get(key) ?? 0) + token.value_usd)
        return acc
      },
      new Map<string, number>(),
    )
    const debtProtocols = debtTokens.reduce(
      (acc, token) => {
        const key = token.protocol || 'unknown'
        acc.set(key, (acc.get(key) ?? 0) + token.value_usd)
        return acc
      },
      new Map<string, number>(),
    )
    const totalCreditUsd = Object.values(data).reduce(
      (sum, portfolio) => sum + portfolio.stats.total_credit_usd,
      0,
    )
    const totalDebtUsd = Object.values(data).reduce(
      (sum, portfolio) => sum + portfolio.stats.total_debt_usd,
      0,
    )
    const totalIdleUsd = Object.values(data).reduce(
      (sum, portfolio) => sum + portfolio.stats.total_idle_usd,
      0,
    )
    return {
      assets: assetList,
      totalValueUsd,
      creditTotalUsd: totalCreditUsd,
      debtTotalUsd: totalDebtUsd,
      baseSupplyApy,
      baseBorrowApy,
      creditProtocols: Array.from(creditProtocols.entries()).map(
        ([protocol, valueUsd]) => ({ protocol, valueUsd }),
      ),
      debtProtocols: Array.from(debtProtocols.entries()).map(
        ([protocol, valueUsd]) => ({
          protocol,
          valueUsd,
        }),
      ),
      totalIdleUsd,
      hasCreditOrDebt:
        totalCreditUsd > 0 ||
        totalDebtUsd > 0 ||
        baseSupplyApy !== undefined ||
        baseBorrowApy !== undefined ||
        creditProtocols.size > 0 ||
        debtProtocols.size > 0,
      hasFundsHealth:
        totals.netApy > 0 ||
        totalCreditUsd > 0 ||
        totalIdleUsd > 0 ||
        totalDebtUsd > 0,
    }
  }, [data, getLogo, tokenLogoVersion, totals.netApy])

  const annualRevenue = totals.totalValue * (totals.netApy / 100)
  const monthlyRevenue = annualRevenue / 12

  useEffect(() => {
    if (loading) {
      return
    }
    if (wallets.length === 0) {
      setHasLoadedOnce(true)
      return
    }
    if (Object.keys(data).length > 0) {
      setHasLoadedOnce(true)
    }
  }, [loading, data, wallets.length])

  const showSkeleton = loading && !hasLoadedOnce

  usePullToRefresh({
    enabled: wallets.length > 0,
    onRefresh: () => refresh(true),
  })

  return (
    <div className="glass-grid" style={{ gap: 24 }}>
      <section className="glass-grid" style={{ gap: 16 }}>
        <div className="glass-grid two">
          <LiquidCard variant="dark">
            <div className="wallet-meta">Total Portfolio Value</div>
            {showSkeleton ? (
              <div className="skeleton-block">
                <div className="skeleton-line wide" />
                <div className="skeleton-line" />
              </div>
            ) : (
              <>
                <div className="wallet-balance">
                  {formatCurrency(totals.totalValue)}
                </div>
                <div className="wallet-meta">
                  Net APY {formatPercent(totals.netApy)} •{' '}
                  {totals.updatedAt
                    ? `Updated ${new Date(totals.updatedAt).toLocaleTimeString()}`
                    : 'No data yet'}
                </div>
                <div className="wallet-meta">
                  Annual {formatCurrency(annualRevenue)} • Monthly{' '}
                  {formatCurrency(monthlyRevenue)}
                </div>
              </>
            )}
          </LiquidCard>
        </div>
        <div className="glass-grid">
          <LiquidCard variant="dark">
            <VaultBalanceSheet
              assets={aggregated.assets}
              totalValueUsd={aggregated.totalValueUsd}
              isLoading={loading}
              debankUrl={
                wallets.length === 1
                  ? `https://debank.com/profile/${wallets[0].address}`
                  : undefined
              }
            />
            {aggregated.hasCreditOrDebt && (
              <VaultCreditDebt
                creditTotalUsd={aggregated.creditTotalUsd}
                debtTotalUsd={aggregated.debtTotalUsd}
                baseSupplyApy={aggregated.baseSupplyApy}
                baseBorrowApy={aggregated.baseBorrowApy}
                creditProtocols={aggregated.creditProtocols}
                debtProtocols={aggregated.debtProtocols}
              />
            )}
            {aggregated.hasFundsHealth && (
              <VaultFundsHealth
                netStrategyApy={totals.netApy}
                inUseFunds={aggregated.creditTotalUsd}
                availableFunds={aggregated.totalIdleUsd}
                healthFactor={
                  aggregated.debtTotalUsd > 0
                    ? aggregated.creditTotalUsd / aggregated.debtTotalUsd
                    : undefined
                }
              />
            )}
          </LiquidCard>
        </div>
        {error && (
          <p className="notice error-log" style={{ marginTop: 12 }}>
            {error}
          </p>
        )}
      </section>

      <section className="glass-grid" style={{ gap: 10 }}>
        <div className="glass-header">
          <div className="glass-title">Wallets</div>
          <div className="toolbar">
            <span className="status-pill header-chip chip-info">
              <Wallet className="chip-icon" size={14} strokeWidth={1.8} />
              {wallets.length} {wallets.length === 1 ? 'wallet' : 'wallets'}
            </span>
            <LiquidButton
              variant="secondary"
              className="header-chip"
              onClick={syncFromSupabase}
              disabled={!supabaseConfigured}
              title="Sync"
              aria-label="Sync"
            >
              <RefreshCw className="chip-icon" size={14} strokeWidth={1.8} />
            </LiquidButton>
            <Link
              className="glass-button secondary link header-chip"
              to="/settings"
              title="Manage"
              aria-label="Manage"
            >
              <Wallet className="chip-icon" size={14} strokeWidth={1.8} />
            </Link>
          </div>
        </div>
        <div className="wallet-header-spacer" />
        {syncError && (
          <p className="notice error-log" style={{ marginTop: 8 }}>
            {syncError}
          </p>
        )}
        <div className="glass-grid wallet-list" style={{ gap: 10 }}>
          {wallets.length === 0 && (
            <p className="notice">No wallets yet. Add your first address.</p>
          )}
          {wallets.map((wallet) => {
            const portfolio = data[wallet.address.toLowerCase()]
            const healthFactor =
              portfolio && portfolio.stats.total_debt_usd > 0
                ? portfolio.stats.total_credit_usd / portfolio.stats.total_debt_usd
                : undefined
            return (
              <LiquidCard
                key={wallet.id}
                variant="dark"
                className="wallet-card compact clickable"
                onClick={() => navigate(`/address/${wallet.address}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    navigate(`/address/${wallet.address}`)
                  }
                }}
              >
                <div className="wallet-title">
                  <div>
                    <strong>{wallet.label}</strong>
                    <div className="wallet-meta address-line">
                      {shortenAddress(wallet.address)}
                      <button
                        className="copy-button"
                        onClick={(event) => {
                          event.stopPropagation()
                          copyToClipboard(wallet.address)
                        }}
                        title="Copy address"
                        aria-label="Copy address"
                      >
                        <Copy size={14} strokeWidth={1.8} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="wallet-summary">
                  <div className="wallet-summary-item">
                    <span className="wallet-summary-label">Balance</span>
                    <span className="wallet-summary-value">
                      {portfolio ? formatCurrency(sumWalletValue(portfolio)) : '—'}
                    </span>
                  </div>
                  <div className="wallet-summary-item">
                    <span className="wallet-summary-label">Net APY</span>
                    <span className="wallet-summary-value">
                      {portfolio
                        ? formatPercent(portfolio.stats.calculated_apy)
                        : '—'}
                    </span>
                  </div>
                  <div className="wallet-summary-item">
                    <span className="wallet-summary-label">Health</span>
                    <span className="wallet-summary-value">
                      {healthFactor !== undefined ? healthFactor.toFixed(2) : '—'}
                    </span>
                  </div>
                </div>
              </LiquidCard>
            )
          })}
        </div>
      </section>
    </div>
  )
}
