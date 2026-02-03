import { Save, LogOut } from 'lucide-react'
import { LiquidButton, LiquidInput } from '../ui/liquid'
import { useProfile } from '../state/useProfile'
import { isSupabaseConfigured, signOutSupabase } from '../services/supabase'
import { useAuth } from '../state/useAuth'

export function ProfilePage() {
  const { profile, updateProfile, saveToSupabase, saveError } = useProfile()
  const { logout } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOutSupabase()
    } catch (error) {
      console.error('[auth] sign out failed', error)
    } finally {
      logout()
    }
  }

  return (
    <div className="glass-grid" style={{ gap: 24 }}>
      <section className="glass-grid" style={{ gap: 12 }}>
        <div className="glass-header">
          <div className="glass-title">Profile</div>
          <div className="toolbar">
            <LiquidButton
              variant="secondary"
              className="header-chip"
              onClick={saveToSupabase}
            >
              <Save className="chip-icon" size={14} strokeWidth={1.8} />
              Save
            </LiquidButton>
            {isSupabaseConfigured && (
              <LiquidButton
                variant="secondary"
                className="header-chip"
                onClick={handleSignOut}
              >
                <LogOut className="chip-icon" size={14} strokeWidth={1.8} />
                Sign out
              </LiquidButton>
            )}
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
      </section>
    </div>
  )
}
