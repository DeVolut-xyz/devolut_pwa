import { ChainId } from '@factordao/tokenlist'

export type TokenLogoKeyInput = {
  chainId?: ChainId
  address?: string
  tokenKey?: string
}

export function buildTokenLogoKey(input: TokenLogoKeyInput): string | undefined {
  const { chainId, address, tokenKey } = input
  if (tokenKey) return tokenKey
  if (chainId != null && address) return `${chainId}-${address.toLowerCase()}`
  return undefined
}

const LOGO_CACHE: Record<string, string> = {}

export function useTokenLogos(): {
  getLogo: (keyOrSymbol: string) => string | undefined
  version: number
} {
  const getLogo = (keyOrSymbol: string): string | undefined => {
    if (LOGO_CACHE[keyOrSymbol]) return LOGO_CACHE[keyOrSymbol]
    return undefined
  }
  return { getLogo, version: 0 }
}
