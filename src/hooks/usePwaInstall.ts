import { useEffect, useMemo, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function isStandaloneMode() {
  if (typeof window === 'undefined') {
    return false
  }
  const standaloneMatch = window.matchMedia('(display-mode: standalone)').matches
  const iosStandalone = (window.navigator as { standalone?: boolean }).standalone
  return Boolean(standaloneMatch || iosStandalone)
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(isStandaloneMode())

  useEffect(() => {
    setIsInstalled(isStandaloneMode())

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    const handleInstalled = () => {
      setDeferredPrompt(null)
      setIsInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleInstalled)

    const media = window.matchMedia('(display-mode: standalone)')
    const handleDisplayChange = () => setIsInstalled(isStandaloneMode())
    if (media.addEventListener) {
      media.addEventListener('change', handleDisplayChange)
    } else {
      media.addListener(handleDisplayChange)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleInstalled)
      if (media.removeEventListener) {
        media.removeEventListener('change', handleDisplayChange)
      } else {
        media.removeListener(handleDisplayChange)
      }
    }
  }, [])

  const canPrompt = Boolean(deferredPrompt)

  const promptInstall = async () => {
    if (!deferredPrompt) {
      return null
    }
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    return choice
  }

  return useMemo(
    () => ({ isInstalled, canPrompt, promptInstall }),
    [isInstalled, canPrompt, promptInstall],
  )
}
