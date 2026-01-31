import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSettings } from '../state/useSettings'
import { useWallets } from '../state/useWallets'
import { usePortfolioData } from '../hooks/usePortfolioData'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { formatCurrency, formatPercent, sumWalletValue } from '../services/portfolio'
import { buildTokenLogoKey, useTokenLogos } from '../data/tokenLogos'
import { LiquidCard } from '../ui/liquid'
import { copyToClipboard, shortenAddress } from '../utils/format'
import { Copy } from 'lucide-react'

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
    refreshOnMount: false,
  })

  const portfolio = wallet
    ? data[wallet.address.toLowerCase()]
    : undefined

  usePullToRefresh({
    enabled: Boolean(wallet),
    onRefresh: () => refresh(true),
  })

  const tokens = useMemo(() => {
    if (!portfolio) {
      return []
    }
    return Object.entries(portfolio.deposits)
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => b.value_usd - a.value_usd)
  }, [portfolio, tokenLogoVersion])

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
      <section>
        <LiquidCard>
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
          <div className="glass-grid three" style={{ marginTop: 16 }}>
            <LiquidCard variant="dark">
              <div className="wallet-meta">Total value</div>
              <div className="wallet-balance">
                {portfolio ? formatCurrency(sumWalletValue(portfolio)) : '—'}
              </div>
            </LiquidCard>
            <LiquidCard variant="dark">
              <div className="wallet-meta">Net APY</div>
              <div className="wallet-balance">
                {portfolio ? formatPercent(portfolio.stats.calculated_apy) : '—'}
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
          {error && (
            <p className="notice" style={{ marginTop: 12 }}>
              {error}
            </p>
          )}
        </LiquidCard>
      </section>

      <section>
        <LiquidCard>
          <div className="glass-header">
            <div>
              <h3>Token breakdown</h3>
              <p className="notice">
                Balance, APY, and protocol exposures for this wallet.
              </p>
            </div>
          </div>
          <LiquidCard variant="dark" style={{ marginTop: 16 }}>
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
        </LiquidCard>
      </section>
    </div>
  )
}
