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

export function getTokenLogo(symbol?: string) {
  if (!symbol) {
    return undefined
  }
  return tokenLogos[symbol.toUpperCase()]
}
