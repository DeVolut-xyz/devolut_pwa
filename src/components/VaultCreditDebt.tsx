import { formatCurrency, formatPercent } from '../services/portfolio'
import { ProtocolLogo } from './ProtocolLogo'

type ProtocolExposure = {
  protocol: string
  valueUsd: number
}

type VaultCreditDebtProps = {
  creditTotalUsd: number
  debtTotalUsd: number
  baseSupplyApy?: number
  baseBorrowApy?: number
  creditProtocols: ProtocolExposure[]
  debtProtocols: ProtocolExposure[]
}

function formatCompactUsd(value: number) {
  const useDecimals = Math.abs(value) < 1
  return value.toLocaleString(undefined, {
    minimumFractionDigits: useDecimals ? 2 : 0,
    maximumFractionDigits: useDecimals ? 2 : 0,
  })
}

export function VaultCreditDebt({
  creditTotalUsd,
  debtTotalUsd,
  baseSupplyApy,
  baseBorrowApy,
  creditProtocols,
  debtProtocols,
}: VaultCreditDebtProps) {
  return (
    <div className="credit-debt-grid">
      <div className="credit-card">
        <div className="credit-header">
          <span>VAULT CREDIT</span>
          <strong>{formatCurrency(creditTotalUsd)}</strong>
        </div>
        <div className="credit-row">
          <span>BASE SUPPLY APY</span>
          <strong>
            {baseSupplyApy !== undefined
              ? formatPercent(baseSupplyApy)
              : '—'}
          </strong>
        </div>
        <div className="exposure-title">CREDIT EXPOSURE</div>
        <div className="exposure-list">
          {creditProtocols.length === 0 ? (
            <span className="notice">No credit exposure.</span>
          ) : (
            creditProtocols.map((protocol) => (
              <div key={protocol.protocol} className="exposure-chip credit">
                <span className="exposure-logo">
                  <ProtocolLogo protocol={protocol.protocol} />
                </span>
                <span className="exposure-label">{protocol.protocol}</span>
                <span className="exposure-value">
                  ${formatCompactUsd(protocol.valueUsd)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="debt-card">
        <div className="debt-header">
          <span>VAULT DEBTS</span>
          <strong>{formatCurrency(debtTotalUsd)}</strong>
        </div>
        <div className="debt-row">
          <span>BASE BORROW APY</span>
          <strong>
            {baseBorrowApy !== undefined
              ? formatPercent(baseBorrowApy)
              : '—'}
          </strong>
        </div>
        <div className="exposure-title">DEBT EXPOSURE</div>
        <div className="exposure-list">
          {debtProtocols.length === 0 ? (
            <span className="notice">No debt exposure.</span>
          ) : (
            debtProtocols.map((protocol) => (
              <div key={protocol.protocol} className="exposure-chip debt">
                <span className="exposure-logo">
                  <ProtocolLogo protocol={protocol.protocol} />
                </span>
                <span className="exposure-label">{protocol.protocol}</span>
                <span className="exposure-value">
                  ${formatCompactUsd(protocol.valueUsd)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
