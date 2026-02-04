import { formatCurrency, formatPercent } from '../services/portfolio'

type VaultCreditDebtProps = {
  creditTotalUsd: number
  debtTotalUsd: number
  baseSupplyApy?: number
  baseBorrowApy?: number
  creditProtocols: { protocol: string; valueUsd: number }[]
  debtProtocols: { protocol: string; valueUsd: number }[]
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
    <div className="vault-credit-debt">
      <div className="balance-sheet-label">VAULT CREDIT</div>
      <div className="wallet-meta">
        {formatCurrency(creditTotalUsd)}
        {baseSupplyApy !== undefined && (
          <> • Supply APY {formatPercent(baseSupplyApy)}</>
        )}
      </div>
      {creditProtocols.length > 0 && (
        <div className="protocol-breakdown">
          {creditProtocols.map(({ protocol, valueUsd }) => (
            <span key={protocol} className="chip-info">
              {protocol}: {formatCurrency(valueUsd)}
            </span>
          ))}
        </div>
      )}
      <div className="balance-sheet-label" style={{ marginTop: 12 }}>
        VAULT DEBTS
      </div>
      <div className="wallet-meta">
        {formatCurrency(debtTotalUsd)}
        {baseBorrowApy !== undefined && (
          <> • Borrow APY {formatPercent(baseBorrowApy)}</>
        )}
      </div>
      {debtProtocols.length > 0 && (
        <div className="protocol-breakdown">
          {debtProtocols.map(({ protocol, valueUsd }) => (
            <span key={protocol} className="chip-info">
              {protocol}: {formatCurrency(valueUsd)}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
