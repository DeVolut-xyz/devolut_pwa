import { useEffect, useMemo, useState } from 'react'
import eth from '../assets/tokens/ETH.svg'
import usdc from '../assets/tokens/USDC.svg'
import usdt from '../assets/tokens/USDT.svg'
import dai from '../assets/tokens/DAI.svg'
import wbtc from '../assets/tokens/WBTC.svg'
import fctr from '../assets/tokens/FCTR.svg'

const tokenLogos: Record<string, string> = {
  ETH: eth,
  WETH: eth,
  USDC: usdc,
  USDT: usdt,
  DAI: dai,
  WBTC: wbtc,
  BTC: wbtc,
  FCTR: fctr,
}

type TokenListEntry = {
  symbol: string
  logoUrl?: string
  address?: string
  chainId?: number
}

let tokenLogosLoaded = false
let tokenLogosLoading: Promise<void> | null = null

async function loadTokenLogos() {
  if (tokenLogosLoaded) {
    return
  }
  if (tokenLogosLoading) {
    await tokenLogosLoading
    return
  }
  tokenLogosLoading = (async () => {
    const urls = [
      'https://cdn.jsdelivr.net/npm/@factordao/tokenlist/dist/mjs/chains/optimism/general.js',
      'https://cdn.jsdelivr.net/npm/@factordao/tokenlist/dist/mjs/chains/arbitrum/general.js',
      'https://cdn.jsdelivr.net/npm/@factordao/tokenlist/dist/mjs/chains/base/general.js',
    ]
    for (const url of urls) {
      try {
        const module = await import(/* @vite-ignore */ url)
        const tokens = (module?.tokens ?? []) as TokenListEntry[]
        tokens.forEach((token) => {
          if (!token.logoUrl) {
            return
          }
          const address = token.address?.toLowerCase()
          const chainId = token.chainId
          if (address && chainId) {
            tokenLogos[`${chainId}:${address}`] = token.logoUrl
            return
          }
          const fallbackKey = token.symbol?.toUpperCase()
          if (fallbackKey) {
            tokenLogos[fallbackKey] = token.logoUrl
          }
        })
      } catch (error) {
        console.warn('[tokenLogos] failed to load token list', { url, error })
      }
    }
    tokenLogosLoaded = true
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('token-logos-updated'))
    }
  })()
  await tokenLogosLoading
}

function normalizeTokenKey(input?: string) {
  if (!input) {
    return undefined
  }
  return input.includes(':') ? input.toLowerCase() : input.toUpperCase()
}

export function getTokenLogo(tokenKey?: string) {
  const key = normalizeTokenKey(tokenKey)
  if (!key) {
    return undefined
  }
  return tokenLogos[key]
}

export function useTokenLogos() {
  const [, setVersion] = useState(0)

  useEffect(() => {
    void loadTokenLogos()
    const handler = () => setVersion((prev) => prev + 1)
    window.addEventListener('token-logos-updated', handler)
    return () => window.removeEventListener('token-logos-updated', handler)
  }, [])

  return useMemo(
    () => ({
      getLogo: (tokenKey?: string) => getTokenLogo(tokenKey),
      isLoaded: tokenLogosLoaded,
    }),
    [],
  )
}
