import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChainId } from '@factordao/tokenlist'
import { useSettings } from '../state/useSettings'
import { useWallets } from '../state/useWallets'
import { usePortfolioData } from '../hooks/usePortfolioData'
import { formatCurrency, formatPercent, sumWalletValue } from '../services/portfolio'
import { useTokenLogos } from '../data/tokenLogos'
import { LiquidButton, LiquidCard, LiquidInput } from '../ui/liquid'
import {
  getSupabaseAuthStatus,
  isSupabaseConfigured,
  isSupabaseKeyValid,
  getSupabaseSession,
  signOutSupabase,
} from '../services/supabase'
import { copyToClipboard, shortenAddress } from '../utils/format'
import { Copy } from 'lucide-react'
import { useProfile } from '../state/useProfile'

const chainOptions = [
  { label: 'Ethereum', value: ChainId.ETHEREUM },
  { label: 'Arbitrum', value: ChainId.ARBITRUM_ONE },
  { label: 'Optimism', value: ChainId.OPTIMISM },
  { label: 'Base', value: ChainId.BASE },
  { label: 'Sonic', value: ChainId.SONIC },
]

type TopPosition = {
  address: string
  sourceWallet: string
  value_usd: number
  metadata: {
    symbol: string
  }
}

export function DashboardPage() {
  const { settings, updateSettings, saveToSupabase, saveStatus, saveError } =
    useSettings()
  const { wallets, addWallet, removeWallet, syncFromSupabase, syncStatus, syncError } = useWallets()
  const { data, loading, error, refresh } = usePortfolioData({
    wallets,
    chainIds: settings.chainIds,
    alchemyApiKey: settings.alchemyApiKey,
    refreshIntervalMs: settings.refreshIntervalMs,
  })
  const [label, setLabel] = useState('')
  const [address, setAddress] = useState('')
  const isAddressValid = /^0x[a-fA-F0-9]{40}$/.test(address.trim())
  const { getLogo } = useTokenLogos()
  const supabaseAuthStatus = getSupabaseAuthStatus()
  const [supabaseSessionActive, setSupabaseSessionActive] = useState(false)

  useEffect(() => {
    void refreshSupabaseSession()
  }, [])

  const refreshSupabaseSession = async () => {
    const session = await getSupabaseSession()
    setSupabaseSessionActive(Boolean(session))
  }
  const {
    profile,
    updateProfile,
    saveToSupabase: saveProfileToSupabase,
    saveStatus: profileSaveStatus,
    saveError: profileSaveError,
  } = useProfile()

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

  const onAddWallet = () => {
    if (!isAddressValid) {
      return
    }
    if (
      wallets.some(
        (wallet) =>
          wallet.address.toLowerCase() === address.trim().toLowerCase(),
      )
    ) {
      return
    }
    addWallet({
      label: label.trim() || 'Wallet',
      address: address.trim() as `0x${string}`,
    })
    setLabel('')
    setAddress('')
  }

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
            <span className="status-pill">
              {loading ? 'Updating...' : 'Live'}
            </span>
            <span className="status-pill">
              Supabase {isSupabaseConfigured ? 'connected' : 'offline'}
            </span>
            {!isSupabaseKeyValid && (
              <span className="status-pill">Check Supabase keys</span>
            )}
            <LiquidButton variant="secondary" onClick={refresh}>
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
              {topPositions.map((position) => {
                const logoUrl = getLogo(position.address)
                return (
                  <span
                    key={`${position.sourceWallet}-${position.address}`}
                    className="glass-chip"
                  >
                    {logoUrl && (
                      <img src={logoUrl} alt={position.metadata.symbol} />
                    )}
                    {position.metadata.symbol} · {formatCurrency(position.value_usd)}
                  </span>
                )
              })}
            </div>
            </LiquidCard>
          </div>
          {error && <p className="notice" style={{ marginTop: 12 }}>{error}</p>}
        </LiquidCard>
      </section>

      <section className="glass-grid two">
        <LiquidCard>
          <div className="glass-header">
            <div>
              <h3>Tracked wallets</h3>
              <p className="notice">
                Add addresses to monitor balances, APY, and exposure.
              </p>
            </div>
            <div className="toolbar">
              <span className="status-pill">
                Supabase {isSupabaseConfigured ? syncStatus : 'offline'}
              </span>
              {isSupabaseConfigured && (
                <LiquidButton variant="secondary" onClick={syncFromSupabase}>
                  Sync now
                </LiquidButton>
              )}
            </div>
          </div>
          {syncError && (
            <p className="notice" style={{ marginTop: 8 }}>
              {syncError}
            </p>
          )}
          <div className="glass-grid" style={{ gap: 12 }}>
            {wallets.length === 0 && (
              <p className="notice">No wallets yet. Add your first address.</p>
            )}
            {wallets.map((wallet) => {
              const portfolio = data[wallet.address.toLowerCase()]
              return (
                <LiquidCard key={wallet.id} variant="dark" className="wallet-card">
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
                      <Link className="glass-button secondary link" to={`/wallet/${wallet.address}`}>
                        View
                      </Link>
                      <LiquidButton
                        variant="secondary"
                        onClick={() => removeWallet(wallet.id)}
                      >
                        Remove
                      </LiquidButton>
                    </div>
                  </div>
                  <div className="wallet-balance">
                    {portfolio ? formatCurrency(sumWalletValue(portfolio)) : '—'}
                  </div>
                  <div className="wallet-meta">
                    {portfolio
                      ? `Net APY ${formatPercent(portfolio.stats.calculated_apy)}`
                      : 'Waiting for sync'}
                  </div>
                </LiquidCard>
              )
            })}
          </div>
          <LiquidCard variant="dark" style={{ marginTop: 16 }}>
            <h4>Add wallet</h4>
            <div className="glass-grid" style={{ gap: 10 }}>
              <LiquidInput
                placeholder="Label (e.g. Treasury)"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
              />
              <LiquidInput
                placeholder="0x wallet address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />
              <LiquidButton
                onClick={onAddWallet}
                disabled={!isAddressValid}
              >
                Add wallet
              </LiquidButton>
            </div>
          </LiquidCard>
        </LiquidCard>

        <LiquidCard>
          <div className="glass-header">
            <div>
              <h3>Data settings</h3>
              <p className="notice">
                Uses Factor analytics + Alchemy to stream balances.
              </p>
            </div>
          </div>
          <div className="glass-grid" style={{ gap: 12 }}>
            <label className="notice">Chains</label>
            <div className="chip-row">
              {chainOptions.map((option) => {
                const selected = settings.chainIds.includes(option.value)
                return (
                  <button
                    key={option.value}
                    className={`glass-chip ${selected ? 'selected' : ''}`}
                    onClick={() => {
                      const next = selected
                        ? settings.chainIds.filter((id) => id !== option.value)
                        : [...settings.chainIds, option.value]
                      updateSettings({
                        chainIds: next.length > 0 ? next : settings.chainIds,
                      })
                    }}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
            <label className="notice">Alchemy API key</label>
            <LiquidInput
              placeholder="Paste Alchemy API key"
              value={settings.alchemyApiKey}
              onChange={(event) =>
                updateSettings({ alchemyApiKey: event.target.value })
              }
            />
            {!settings.alchemyApiKey && (
              <p className="notice">
                Add an Alchemy API key to enable real-time balances.
              </p>
            )}
            <label className="notice">Refresh interval (ms)</label>
            <LiquidInput
              type="number"
              min={10000}
              value={settings.refreshIntervalMs}
              onChange={(event) =>
                updateSettings({ refreshIntervalMs: Number(event.target.value) })
              }
            />
            <p className="notice">
              API key is stored locally to enable real-time balance refresh.
            </p>
            <div className="toolbar" style={{ marginTop: 8 }}>
              <span className="status-pill">Status {saveStatus}</span>
              <LiquidButton
                variant="secondary"
                onClick={saveToSupabase}
                disabled={!isSupabaseConfigured || supabaseAuthStatus.disabled}
                title={
                  isSupabaseConfigured
                    ? 'Save settings to Supabase'
                    : 'Supabase not configured'
                }
              >
                Save to Supabase
              </LiquidButton>
            </div>
            {!isSupabaseConfigured && (
              <p className="notice" style={{ marginTop: 8 }}>
                Supabase not configured. Add valid URL + anon key to enable save.
              </p>
            )}
            {supabaseAuthStatus.error && (
              <p className="notice" style={{ marginTop: 8 }}>
                {supabaseAuthStatus.error}
              </p>
            )}
            {isSupabaseConfigured && (
              <div className="glass-panel dark" style={{ marginTop: 12 }}>
                <h4>Supabase session</h4>
                <div className="glass-grid" style={{ gap: 10 }}>
                  <div className="toolbar">
                    <LiquidButton variant="secondary" onClick={refreshSupabaseSession}>
                      Check session
                    </LiquidButton>
                    <LiquidButton variant="secondary" onClick={signOutSupabase}>
                      Sign out
                    </LiquidButton>
                  </div>
                  <div className="notice">
                    Session: {supabaseSessionActive ? 'active' : 'inactive'}
                  </div>
                </div>
              </div>
            )}
            {saveError && (
              <p className="notice" style={{ marginTop: 8 }}>
                {saveError}
              </p>
            )}
          </div>
        </LiquidCard>
      </section>

      <section>
        <LiquidCard>
          <div className="glass-header">
            <div>
              <h3>Profile</h3>
              <p className="notice">Personalize your account details.</p>
            </div>
            <div className="toolbar">
              <span className="status-pill">Save {profileSaveStatus}</span>
              <LiquidButton
                variant="secondary"
                onClick={saveProfileToSupabase}
                disabled={!isSupabaseConfigured}
              >
                Save profile
              </LiquidButton>
            </div>
          </div>
          <div className="glass-grid two" style={{ marginTop: 12 }}>
            <div className="glass-panel dark">
              <div className="profile-avatar">
                {profile.avatarDataUrl ? (
                  <img src={profile.avatarDataUrl} alt="Profile" />
                ) : (
                  <span className="notice">No photo</span>
                )}
              </div>
              <input
                className="glass-input"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = () => {
                    updateProfile({ avatarDataUrl: reader.result as string })
                  }
                  reader.readAsDataURL(file)
                }}
              />
              {profile.avatarDataUrl && (
                <LiquidButton
                  variant="secondary"
                  onClick={() => updateProfile({ avatarDataUrl: '' })}
                >
                  Remove photo
                </LiquidButton>
              )}
            </div>
            <div className="glass-grid" style={{ gap: 12 }}>
              <label className="notice">Nickname</label>
              <LiquidInput
                placeholder="Your nickname"
                value={profile.nickname}
                onChange={(event) =>
                  updateProfile({ nickname: event.target.value })
                }
              />
              <label className="notice">Email</label>
              <LiquidInput
                type="email"
                placeholder="you@example.com"
                value={profile.email}
                onChange={(event) => updateProfile({ email: event.target.value })}
              />
              <label className="notice">Bio</label>
              <LiquidInput
                placeholder="Short bio"
                value={profile.bio}
                onChange={(event) => updateProfile({ bio: event.target.value })}
              />
              {profileSaveError && (
                <p className="notice">{profileSaveError}</p>
              )}
            </div>
          </div>
        </LiquidCard>
      </section>
    </div>
  )
}
