import { Save } from 'lucide-react'
import { LiquidButton, LiquidCard, LiquidInput } from '../ui/liquid'
import { useProfile } from '../state/useProfile'

export function ProfilePage() {
  const {
    profile,
    updateProfile,
    saveToSupabase,
    saveStatus,
    saveError,
  } = useProfile()

  const statusTone = (status: 'idle' | 'saving' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return 'chip-success'
      case 'error':
        return 'chip-error'
      case 'saving':
        return 'chip-info'
      default:
        return 'chip-warn'
    }
  }

  return (
    <div className="glass-grid" style={{ gap: 24 }}>
      <section>
        <LiquidCard>
          <div className="glass-header">
            <div>
              <h3>Profile</h3>
              <p className="notice">Personalize your account details.</p>
            </div>
            <div className="toolbar">
              <span className={`status-pill header-chip ${statusTone(saveStatus)}`}>
                <Save className="chip-icon" size={14} strokeWidth={1.8} />
                Save {saveStatus}
              </span>
              <LiquidButton
                variant="secondary"
                className="header-chip"
                onClick={saveToSupabase}
              >
                <Save className="chip-icon" size={14} strokeWidth={1.8} />
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
              {saveError && <p className="notice">{saveError}</p>}
            </div>
          </div>
        </LiquidCard>
      </section>
    </div>
  )
}
