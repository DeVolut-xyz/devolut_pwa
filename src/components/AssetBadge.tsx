import { formatCurrency } from '../services/portfolio'

type AssetBadgeProps = {
  symbol: string
  amount: string
  percentage: string
  valueUsd: number
  protocol?: string
  logoUrl?: string
}

export function AssetBadge({
  symbol,
  amount,
  percentage,
  valueUsd,
  protocol,
  logoUrl,
}: AssetBadgeProps) {
  return (
    <div className="asset-badge">
      <div className="asset-left">
        <div className="asset-icon">
          {logoUrl ? <img src={logoUrl} alt={symbol} /> : symbol.slice(0, 2)}
        </div>
        <div className="asset-meta">
          <span className="asset-symbol">{symbol}</span>
          {protocol && <span className="asset-protocol">{protocol}</span>}
        </div>
        <span className="asset-amount">{amount}</span>
      </div>
      <div className="asset-divider" />
      <div className="asset-stats">
        <span className="asset-percent">{percentage}</span>
        <span className="asset-value">{formatCurrency(valueUsd)} USD</span>
      </div>
    </div>
  )
}
