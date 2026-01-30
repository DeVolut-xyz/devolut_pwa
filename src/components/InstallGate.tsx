import type { ReactNode } from 'react'
import { useEffect, useMemo } from 'react'
import { usePwaInstall } from '../hooks/usePwaInstall'
import { LiquidButton, LiquidCard } from '../ui/liquid'

type InstallGateProps = {
  children: ReactNode
}

function isMobileBrowser() {
  if (typeof navigator === 'undefined') {
    return false
  }
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}

function isIos() {
  if (typeof navigator === 'undefined') {
    return false
  }
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

export function InstallGate({ children }: InstallGateProps) {
  const { isInstalled, canPrompt, promptInstall } = usePwaInstall()
  const shouldGate = useMemo(
    () => isMobileBrowser() && !isInstalled,
    [isInstalled],
  )

  useEffect(() => {
    if (!shouldGate) {
      document.body.style.overflow = ''
      return
    }
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [shouldGate])

  if (!shouldGate) {
    return <>{children}</>
  }

  return (
    <div className="install-gate">
      <LiquidCard className="install-card">
        <div className="glass-title">Install the PWA</div>
        <p className="glass-subtitle">
          To continue on mobile, install the app to your home screen. This keeps
          passkeys and wallets stable on your device.
        </p>
        {isIos() ? (
          <ol className="install-steps">
            <li>Open the share sheet in Safari.</li>
            <li>Select “Add to Home Screen”.</li>
            <li>Confirm to install and reopen the app.</li>
          </ol>
        ) : (
          <ol className="install-steps">
            <li>Tap the install button below.</li>
            <li>Confirm “Install app”.</li>
            <li>Open the app from your home screen.</li>
          </ol>
        )}
        <div className="toolbar" style={{ marginTop: 16 }}>
          <LiquidButton
            onClick={() => void promptInstall()}
            disabled={!canPrompt || isIos()}
          >
            {canPrompt ? 'Install app' : 'Install not ready'}
          </LiquidButton>
        </div>
        {isIos() && (
          <p className="notice" style={{ marginTop: 12 }}>
            Install is manual on iOS. Safari does not show the install prompt.
          </p>
        )}
      </LiquidCard>
      <div className="install-gate-backdrop" />
    </div>
  )
}
