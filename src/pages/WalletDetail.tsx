import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSettings } from '../state/useSettings'
import { useWallets } from '../state/useWallets'
import { usePortfolioData } from '../hooks/usePortfolioData'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { formatCurrency, formatPercent, sumWalletValue } from '../services/portfolio'
import { buildTokenLogoKey, useTokenLogos } from '../data/tokenLogos'
import { VaultBalanceSheet } from '../components/VaultBalanceSheet'
import { VaultCreditDebt } from '../components/VaultCreditDebt'
import { VaultFundsHealth } from '../components/VaultFundsHealth'
import { LiquidCard } from '../ui/liquid'
import { copyToClipboard, shortenAddress } from '../utils/format'
import { Copy } from 'lucide-react'

type AggregatedAsset = {
  key: string
  symbol: string
  amount: number
  valueUsd: number
  protocol?: string
  logoUrl?: string
}

export function WalletDetailPage() {
  const params = useParams()
  const { settings } = useSettings()
  const { wallets } = useWallets()
  const { getLogo, version: tokenLogoVersion } = useTokenLogos()
  const wallet = wallets.find(
    (entry) => entry.address.toLowerCase() === params.address?.toLowerCase(),
  )

  const { data, error, refresh } = usePortfolioData({
    wallets: wallet ? [wallet] : [],
    chainIds: settings.chainIds,
    alchemyApiKey: settings.alchemyApiKey,
    autoRefresh: false,
    refreshOnMount: false,
  })

  const portfolio = wallet
    ? data[wallet.address.toLowerCase()]
    : undefined

  usePullToRefresh({
    enabled: Boolean(wallet),
    onRefresh: () => refresh(true),
  })

  const netApy = useMemo(() => {
    if (!portfolio) {
      return 0
    }
    const totalValue = sumWalletValue(portfolio)
    if (totalValue <= 0) {
      return 0
    }
    return (portfolio.stats.net_return / totalValue) * 100
  }, [portfolio])

  const tokens = useMemo(() => {
    if (!portfolio) {
      return []
    }
    return Object.entries(portfolio.deposits)
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => b.value_usd - a.value_usd)
  }, [portfolio, tokenLogoVersion])

  const aggregated = useMemo(() => {
    if (!portfolio) {
      return {
        assets: [] as AggregatedAsset[],
        totalValueUsd: 0,
        creditTotalUsd: 0,
        debtTotalUsd: 0,
        baseSupplyApy: undefined as number | undefined,
        baseBorrowApy: undefined as number | undefined,
        creditProtocols: [] as Array<{ protocol: string; valueUsd: number }>,
        debtProtocols: [] as Array<{ protocol: string; valueUsd: number }>,
        totalIdleUsd: 0,
        hasCreditOrDebt: false,
        hasFundsHealth: false,
      }
    }

    const assets = new Map<string, AggregatedAsset>()
    const allTokens: Array<{
      value_usd: number
      apy: number
      type: string
      protocol: string
    }> = []
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

    const assetList = Array.from(assets.values()).filter(
      (asset) => asset.valueUsd > 0,
    )
    const totalValueUsd = sumWalletValue(portfolio)
    const creditTokens = allTokens.filter(
      (token) => token.type === 'credit' || token.type === 'supply',
    )
    const debtTokens = allTokens.filter((token) => token.type === 'debt')
    const creditTotalUsd = portfolio.stats.total_credit_usd
    const debtTotalUsd = portfolio.stats.total_debt_usd
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
    const totalIdleUsd = portfolio.stats.total_idle_usd

    return {
      assets: assetList,
      totalValueUsd,
      creditTotalUsd,
      debtTotalUsd,
      baseSupplyApy,
      baseBorrowApy,
      creditProtocols: Array.from(creditProtocols.entries()).map(
        ([protocol, valueUsd]) => ({ protocol, valueUsd }),
      ),
      debtProtocols: Array.from(debtProtocols.entries()).map(
        ([protocol, valueUsd]) => ({ protocol, valueUsd }),
      ),
      totalIdleUsd,
      hasCreditOrDebt:
        creditTotalUsd > 0 ||
        debtTotalUsd > 0 ||
        baseSupplyApy !== undefined ||
        baseBorrowApy !== undefined ||
        creditProtocols.size > 0 ||
        debtProtocols.size > 0,
      hasFundsHealth:
        portfolio.stats.calculated_apy > 0 ||
        creditTotalUsd > 0 ||
        totalIdleUsd > 0 ||
        debtTotalUsd > 0,
    }
  }, [portfolio, getLogo, tokenLogoVersion])

  if (!wallet) {
    return (
      <LiquidCard>
        <h3>Wallet not found</h3>
        <p className="notice">Return to home to add it first.</p>
        <Link className="glass-button secondary link" to="/home">
          Back to home
        </Link>
      </LiquidCard>
    )
  }

  return (
    <div className="glass-grid" style={{ gap: 24 }}>
      <section className="glass-grid" style={{ gap: 16 }}>
        <div className="glass-header">
          <div>
            <div className="glass-title">{wallet.label}</div>
            <div className="glass-subtitle address-line">
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
        </div>
        <div className="glass-grid three">
          <LiquidCard variant="dark">
            <div className="wallet-meta">Total value</div>
            <div className="wallet-balance">
              {portfolio ? formatCurrency(sumWalletValue(portfolio)) : '—'}
            </div>
          </LiquidCard>
          <LiquidCard variant="dark">
            <div className="wallet-meta">Net APY</div>
            <div className="wallet-balance">
              {portfolio ? formatPercent(netApy) : '—'}
            </div>
            <div className="wallet-meta">Annualized net return</div>
          </LiquidCard>
          <LiquidCard variant="dark">
            <div className="wallet-meta">Exposure mix</div>
            <div className="wallet-meta">
              Credit {formatCurrency(portfolio?.stats.total_credit_usd ?? 0)}
            </div>
            <div className="wallet-meta">
              Debt {formatCurrency(portfolio?.stats.total_debt_usd ?? 0)}
            </div>
            <div className="wallet-meta">
              Idle {formatCurrency(portfolio?.stats.total_idle_usd ?? 0)}
            </div>
          </LiquidCard>
        </div>
        <div className="glass-grid">
          <LiquidCard variant="dark">
            <VaultBalanceSheet
              assets={aggregated.assets}
              totalValueUsd={aggregated.totalValueUsd}
              debankUrl={`https://debank.com/profile/${wallet.address}`}
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
                netStrategyApy={portfolio?.stats.calculated_apy ?? 0}
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
          <p className="notice" style={{ marginTop: 12 }}>
            {error}
          </p>
        )}
      </section>

      <section className="glass-grid" style={{ gap: 12 }}>
        <div className="glass-header">
          <div>
            <h3>Token breakdown</h3>
            <p className="notice">
              Balance, APY, and protocol exposures for this wallet.
            </p>
          </div>
        </div>
        <LiquidCard variant="dark">
          <div className="token-row muted" style={{ fontWeight: 600 }}>
            <div>Token</div>
            <div>Value</div>
            <div>APY</div>
            <div>Protocol</div>
          </div>
          {tokens.length === 0 && (
            <p className="notice" style={{ padding: '16px 0' }}>
              No positions yet. Add an Alchemy key and refresh.
            </p>
          )}
          {tokens.map((token) => {
            const tokenKey = buildTokenLogoKey({
              chainId: token.chainId,
              address: token.metadata.address,
              tokenKey: token.key,
            })
            const logoUrl =
              (tokenKey ? getLogo(tokenKey) : undefined) ??
              getLogo(token.metadata.symbol)
            return (
              <div
                key={`${token.chainId ?? 'unknown'}-${token.metadata.address}`}
                className="token-row"
              >
                <div className="token-cell">
                  {logoUrl && (
                    <img src={logoUrl} alt={token.metadata.symbol} />
                  )}
                  <div>
                    <strong>{token.metadata.symbol}</strong>
                    <div className="wallet-meta">{token.metadata.name}</div>
                  </div>
                </div>
                <div>{formatCurrency(token.value_usd)}</div>
                <div>{formatPercent(token.apy)}</div>
                <div className="wallet-meta">{token.protocol}</div>
              </div>
            )
          })}
        </LiquidCard>
      </section>
    </div>
  )
}
