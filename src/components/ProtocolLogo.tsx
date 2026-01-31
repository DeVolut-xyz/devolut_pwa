import Aave from '../assets/protocols/aave.svg'
import Compound from '../assets/protocols/compound.svg'
import Morpho from '../assets/protocols/morpho.svg'
import Pendle from '../assets/protocols/pendle.svg'
import Silo from '../assets/protocols/silo.svg'

const protocolLogos: Record<string, string> = {
  AAVE: Aave,
  COMPOUND: Compound,
  MORPHO: Morpho,
  PENDLE: Pendle,
  SILO: Silo,
}

type ProtocolLogoProps = {
  protocol?: string
}

export function ProtocolLogo({ protocol }: ProtocolLogoProps) {
  if (!protocol) {
    return null
  }
  const key = protocol.toUpperCase()
  const logo = protocolLogos[key]
  if (!logo) {
    return null
  }
  return <img src={logo} alt={protocol} />
}
