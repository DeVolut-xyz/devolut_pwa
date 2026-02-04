import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { LiquidButton, LiquidInput } from '../ui/liquid'
import { useSettings } from '../state/useSettings'
import { ChainId } from '@factordao/tokenlist'

const chainOptions: { value: ChainId; label: string }[] = [
  { value: ChainId.ETHEREUM, label: 'Ethereum' },
]

export function SettingsPage() {
  const { settings, updateSettings, saveToSupabase, saveStatus, saveError } =
    useSettings()

  return (
    <div className="glass-grid" style={{ gap: 24 }}>
      <section className="glass-grid" style={{ gap: 12 }}>
        <div className="glass-header">
          <Link
            className="glass-button secondary link header-chip"
            to="/home"
            aria-label="Back"
          >
            <ArrowLeft className="chip-icon" size={14} strokeWidth={1.8} />
          </Link>
          <div className="glass-title">Settings</div>
          <div className="toolbar">
            <LiquidButton
              variant="secondary"
              className="header-chip"
              onClick={saveToSupabase}
              disabled={saveStatus === 'saving'}
            >
              {saveStatus === 'saving' ? 'Saving…' : 'Save'}
            </LiquidButton>
          </div>
        </div>
        <div className="glass-panel dark" style={{ marginTop: 12 }}>
          <label className="notice">Networks</label>
          <div className="glass-grid" style={{ gap: 8 }}>
            {chainOptions.map((opt) => (
              <label key={opt.value} className="row align-center gap-8">
                <input
                  type="checkbox"
                  checked={settings.chainIds.includes(opt.value)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...new Set([...settings.chainIds, opt.value])]
                      : settings.chainIds.filter((id) => id !== opt.value)
                    updateSettings({
                      chainIds: next.length > 0 ? next : [ChainId.ETHEREUM],
                    })
                  }}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
          <label className="notice" style={{ marginTop: 12 }}>
            Alchemy API key
          </label>
          <LiquidInput
            type="password"
            placeholder="Your Alchemy API key"
            value={settings.alchemyApiKey}
            onChange={(e) =>
              updateSettings({ alchemyApiKey: e.target.value })
            }
          />
          {saveError && (
            <p className="notice error-log" style={{ marginTop: 8 }}>
              {saveError}
            </p>
          )}
          {saveStatus === 'success' && (
            <p className="notice" style={{ marginTop: 8 }}>
              Saved.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
