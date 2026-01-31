import { formatCurrency, formatPercent } from '../services/portfolio'

type VaultFundsHealthProps = {
  netStrategyApy: number
  inUseFunds: number
  availableFunds: number
  healthFactor?: number
}

function getHealthStatus(healthFactor?: number) {
  if (healthFactor === undefined || !isFinite(healthFactor)) {
    return undefined
  }
  if (healthFactor >= 1.6) return 'Safe'
  if (healthFactor >= 1.3) return 'Warning'
  return 'Danger'
}

export function VaultFundsHealth({
  netStrategyApy,
  inUseFunds,
  availableFunds,
  healthFactor,
}: VaultFundsHealthProps) {
  const status = getHealthStatus(healthFactor)
  const healthValue =
    healthFactor !== undefined && isFinite(healthFactor)
      ? `${healthFactor.toFixed(2)} (${status})`
      : '—'
  const healthClass =
    status === 'Safe'
      ? 'metric-safe'
      : status === 'Warning'
        ? 'metric-warning'
        : status === 'Danger'
          ? 'metric-danger'
          : ''

  return (
    <div className="funds-health-grid">
      <div className="metric-card">
        <span className="metric-title">NET STRATEGY APY</span>
        <span className="metric-value">{formatPercent(netStrategyApy)}</span>
      </div>
      <div className="metric-card">
        <span className="metric-title">IN USE FUNDS</span>
        <span className="metric-value">{formatCurrency(inUseFunds)}</span>
      </div>
      <div className="metric-card">
        <span className="metric-title">AVAILABLE FUNDS</span>
        <span className="metric-value">{formatCurrency(availableFunds)}</span>
      </div>
      <div className="metric-card">
        <span className="metric-title">HEALTH FACTOR</span>
        <span className={`metric-value ${healthClass}`}>{healthValue}</span>
      </div>
    </div>
  )
}
