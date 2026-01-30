import { readStorage, writeStorage } from './storage'

export type PasskeyProfile = {
  username: string
  credentialId: string
  createdAt: string
}

export const AUTH_STORAGE_KEY = 'factor-auth'

export function getStoredPasskeyProfile() {
  return readStorage<PasskeyProfile | null>(AUTH_STORAGE_KEY, null)
}

export function getStoredCredentialId() {
  return getStoredPasskeyProfile()?.credentialId ?? null
}

export function setStoredPasskeyProfile(profile: PasskeyProfile | null) {
  writeStorage(AUTH_STORAGE_KEY, profile)
}
