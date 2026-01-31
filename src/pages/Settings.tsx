import { useState } from 'react'
import { ChainId } from '@factordao/tokenlist'
import { useSettings } from '../state/useSettings'
import { useWallets } from '../state/useWallets'
import { getSupabaseAuthStatus, isSupabaseConfigured } from '../services/supabase'
import { LiquidButton, LiquidCard, LiquidInput } from '../ui/liquid'
import { copyToClipboard, shortenAddress } from '../utils/format'
import { Copy, RefreshCw, Save, Wallet } from 'lucide-react'

const chainOptions = [
  { label: 'Ethereum', value: ChainId.ETHEREUM },
  { label: 'Arbitrum', value: ChainId.ARBITRUM_ONE },
  { label: 'Optimism', value: ChainId.OPTIMISM },
  { label: 'Base', value: ChainId.BASE },
  { label: 'Sonic', value: ChainId.SONIC },
]

export function SettingsPage() {
  const { settings, updateSettings, saveToSupabase, saveError } = useSettings()
  const { wallets, addWallet, removeWallet, syncFromSupabase, syncError } =
    useWallets()
  const supabaseConfigured = isSupabaseConfigured
  const supabaseAuthStatus = getSupabaseAuthStatus()
  const [label, setLabel] = useState('')
  const [address, setAddress] = useState('')
  const isAddressValid = /^0x[a-fA-F0-9]{40}$/.test(address.trim())

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

  const syncIssue =
    !supabaseConfigured ||
    supabaseAuthStatus.disabled ||
    Boolean(supabaseAuthStatus.error)
  const syncMessage = !supabaseConfigured
    ? 'Cloud sync not configured.'
    : supabaseAuthStatus.disabled
      ? 'Anonymous sign-in disabled.'
      : supabaseAuthStatus.error
        ? `Sync auth error: ${supabaseAuthStatus.error}`
        : null

  return (
    <div className="glass-grid" style={{ gap: 24 }}>
      <section className="glass-grid two">
        <LiquidCard>
          <div className="glass-header">
            <div>
              <h3>Tracked wallets</h3>
            </div>
            <div className="toolbar">
              <span className="status-pill header-chip chip-info">
                <Wallet className="chip-icon" size={14} strokeWidth={1.8} />
                {wallets.length} wallets
              </span>
              <LiquidButton
                variant="secondary"
                className="header-chip"
                onClick={syncFromSupabase}
                disabled={!supabaseConfigured}
              >
                <RefreshCw className="chip-icon" size={14} strokeWidth={1.8} />
                Sync wallets
              </LiquidButton>
            </div>
          </div>
          {syncError && (
            <p className="notice" style={{ marginTop: 8 }}>
              {syncError}
            </p>
          )}
          {syncIssue && syncMessage && (
            <p className="notice" style={{ marginTop: 8 }}>
              {syncMessage}
            </p>
          )}
          <div className="glass-grid" style={{ gap: 12 }}>
            {wallets.length === 0 && (
              <p className="notice">No wallets yet. Add your first address.</p>
            )}
            {wallets.map((wallet) => (
              <LiquidCard
                key={wallet.id}
                variant="dark"
                className="wallet-card compact"
              >
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
                    <LiquidButton
                      variant="secondary"
                      onClick={() => removeWallet(wallet.id)}
                    >
                      Remove
                    </LiquidButton>
                  </div>
                </div>
              </LiquidCard>
            ))}
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
              <LiquidButton onClick={onAddWallet} disabled={!isAddressValid}>
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
                Uses vault analytics + Alchemy to stream balances.
              </p>
            </div>
            <div className="toolbar">
              <LiquidButton
                variant="secondary"
                className="header-chip"
                onClick={saveToSupabase}
                disabled={!supabaseConfigured}
              >
                <Save className="chip-icon" size={14} strokeWidth={1.8} />
                Save settings
              </LiquidButton>
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
            {saveError && (
              <p className="notice" style={{ marginTop: 8 }}>
                {saveError}
              </p>
            )}
            {syncIssue && syncMessage && (
              <p className="notice" style={{ marginTop: 8 }}>
                {syncMessage}
              </p>
            )}
          </div>
        </LiquidCard>
      </section>
    </div>
  )
}
