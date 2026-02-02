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
        <span className="asset-amount">
          <span>{amount}</span>
          <span className="asset-amount-usd">{formatCurrency(valueUsd)} USD</span>
        </span>
      </div>
      <div className="asset-divider" />
      <div className="asset-stats">
        <span className="asset-percent">{percentage}</span>
      </div>
    </div>
  )
}
