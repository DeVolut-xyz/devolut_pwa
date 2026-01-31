import { useSyncExternalStore } from 'react'
import type { WalletPortfolio } from '../services/portfolio'

type PortfolioState = {
  data: Record<string, WalletPortfolio>
  loading: boolean
  error: string | null
  lastRefreshAt: number
}

const initialState: PortfolioState = {
  data: {},
  loading: false,
  error: null,
  lastRefreshAt: 0,
}

let state: PortfolioState = { ...initialState }
const listeners = new Set<() => void>()

function emitChange() {
  listeners.forEach((listener) => listener())
}

export function getPortfolioState() {
  return state
}

export function setPortfolioState(next: Partial<PortfolioState>) {
  state = { ...state, ...next }
  emitChange()
}

export function usePortfolioStore() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => state,
    () => state,
  )
}
