import { useEffect, useMemo, useState } from 'react'
import { ChainId, FactorTokenlist } from '@factordao/tokenlist'
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
  symbol?: string
  logoUrl?: string
  logoURI?: string
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
    const chainIds = [
      ChainId.ETHEREUM,
      ChainId.ARBITRUM_ONE,
      ChainId.OPTIMISM,
      ChainId.BASE,
    ]

    chainIds.forEach((chainId) => {
      try {
        const tokenlist = new FactorTokenlist(chainId)
        const rawTokens = ([
          ...(tokenlist.getAllGeneralTokens?.() ?? []),
          ...(tokenlist.getAllPendleTokens?.() ?? []),
          ...(tokenlist.getAllAaveTokens?.() ?? []),
          ...(tokenlist.getAllCompoundTokens?.() ?? []),
          ...(tokenlist.getAllSiloTokens?.() ?? []),
          ...(tokenlist.getAllMorphoTokens?.() ?? []),
        ] as unknown) as Array<Record<string, unknown>>
        const tokens: TokenListEntry[] = rawTokens.map((token) => ({
          symbol: token.symbol as string | undefined,
          address: token.address as string | undefined,
          logoUrl: token.logoUrl as string | undefined,
          logoURI: token.logoURI as string | undefined,
        }))
        console.info('[tokenLogos] loaded token list', {
          chainId,
          count: tokens.length,
          sample: tokens.slice(0, 3).map((token) => ({
            symbol: token.symbol,
            address: token.address,
            logoUrl: token.logoUrl ?? token.logoURI,
          })),
        })
        tokens.forEach((token) => {
          const logo = token.logoUrl ?? token.logoURI
          if (!logo) {
            return
          }
          const address = token.address?.toLowerCase()
          if (address) {
            tokenLogos[`${chainId}:${address}`] = logo
          }
          const fallbackKey = token.symbol?.toUpperCase()
          if (fallbackKey) {
            tokenLogos[fallbackKey] = logo
          }
        })
        console.info('[tokenLogos] mapped keys', {
          chainId,
          keyCount: Object.keys(tokenLogos).length,
        })
      } catch (error) {
        console.warn('[tokenLogos] failed to load token list', { chainId, error })
      }
    })
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

export function buildTokenLogoKey({
  chainId,
  address,
  tokenKey,
}: {
  chainId?: number
  address?: string
  tokenKey?: string
}) {
  let normalizedAddress = address?.toLowerCase()
  let normalizedChainId = chainId

  if (tokenKey) {
    if (tokenKey.includes(':')) {
      const [prefix, addrWithSuffix] = tokenKey.split(':')
      const parsedChainId = Number(prefix)
      if (!Number.isNaN(parsedChainId)) {
        normalizedChainId = parsedChainId
      }
      if (addrWithSuffix) {
        const cleaned = addrWithSuffix.split('-')[0]
        normalizedAddress = cleaned.toLowerCase()
      }
    } else if (tokenKey.startsWith('0x')) {
      normalizedAddress = tokenKey.split('-')[0].toLowerCase()
    }
  }

  if (normalizedChainId && normalizedAddress) {
    const effectiveChainId =
      normalizedChainId === ChainId.ETHEREUM
        ? ChainId.ARBITRUM_ONE
        : normalizedChainId
    return `${effectiveChainId}:${normalizedAddress}`
  }
  if (normalizedAddress) {
    return normalizedAddress
  }
  return undefined
}

export function getTokenLogo(tokenKey?: string) {
  const key = normalizeTokenKey(tokenKey)
  if (!key) {
    return undefined
  }
  return tokenLogos[key]
}

export function useTokenLogos() {
  const [version, setVersion] = useState(0)

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
      version,
    }),
    [version],
  )
}
