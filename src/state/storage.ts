const STORAGE_EVENT = 'factor-storage-update'

export function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback
  }
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) {
      return fallback
    }
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeStorage<T>(key: string, value: T) {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new Event(STORAGE_EVENT))
}

export function subscribeStorage(callback: () => void) {
  const handler = () => callback()
  window.addEventListener('storage', handler)
  window.addEventListener(STORAGE_EVENT, handler)
  return () => {
    window.removeEventListener('storage', handler)
    window.removeEventListener(STORAGE_EVENT, handler)
  }
}
