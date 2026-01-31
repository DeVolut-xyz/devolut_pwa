import { useMemo } from 'react'
import { formatCurrency } from '../services/portfolio'
import { AssetBadge } from './AssetBadge'

type VaultAsset = {
  key: string
  symbol: string
  amount: number
  valueUsd: number
  protocol?: string
  logoUrl?: string
}

type VaultBalanceSheetProps = {
  assets: VaultAsset[]
  totalValueUsd: number
  debankUrl?: string
  isLoading?: boolean
}

const MAX_DISPLAYED_ASSETS = 6

function formatTokenAmount(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k`
  }
  if (value < 1) {
    return value.toFixed(6)
  }
  return value.toFixed(2)
}

export function VaultBalanceSheet({
  assets,
  totalValueUsd,
  debankUrl,
  isLoading = false,
}: VaultBalanceSheetProps) {
  const { displayedAssets, otherAssets } = useMemo(() => {
    const sorted = [...assets].sort((a, b) => b.valueUsd - a.valueUsd)
    const displayed = sorted.slice(0, MAX_DISPLAYED_ASSETS)
    const others = sorted.slice(MAX_DISPLAYED_ASSETS)
    const otherValueUsd = others.reduce((sum, asset) => sum + asset.valueUsd, 0)
    const otherPercent =
      totalValueUsd > 0 ? (otherValueUsd / totalValueUsd) * 100 : 0
    return {
      displayedAssets: displayed,
      otherAssets:
        others.length > 0
          ? `${otherPercent.toFixed(1)}% = ${formatCurrency(otherValueUsd)} USD`
          : null,
    }
  }, [assets, totalValueUsd])

  return (
    <div className="balance-sheet">
      {debankUrl && (
        <div className="balance-sheet-header">
          <a
            className="balance-sheet-link"
            href={debankUrl}
            target="_blank"
            rel="noreferrer"
          >
            See More on Debank
          </a>
        </div>
      )}
      <div className="balance-sheet-label">Asset Distribution:</div>
      {isLoading ? (
        <>
          <div className="skeleton-chip-row" style={{ marginTop: 4 }}>
            {Array.from({ length: 6 }).map((_, index) => (
              <span key={index} className="skeleton-pill" />
            ))}
          </div>
          <div className="balance-sheet-other">
            <span className="skeleton-pill" style={{ width: 160 }} />
          </div>
        </>
      ) : (
        <>
          <div className="balance-sheet-assets">
            {displayedAssets.length === 0 ? (
              <span className="notice">No assets found.</span>
            ) : (
              displayedAssets.map((asset) => {
                const percentage =
                  totalValueUsd > 0
                    ? `${((asset.valueUsd / totalValueUsd) * 100).toFixed(1)}%`
                    : '0.0%'
                return (
                  <AssetBadge
                    key={asset.key}
                    symbol={asset.symbol}
                    amount={formatTokenAmount(asset.amount)}
                    percentage={percentage}
                    valueUsd={asset.valueUsd}
                    protocol={asset.protocol}
                    logoUrl={asset.logoUrl}
                  />
                )
              })
            )}
          </div>
          {otherAssets && (
            <div className="balance-sheet-other">Other assets: {otherAssets}</div>
          )}
        </>
      )}
    </div>
  )
}
