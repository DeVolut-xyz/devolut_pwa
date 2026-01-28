export function shortenAddress(address: string, size: number = 6) {
  if (!address) {
    return ''
  }
  const start = address.slice(0, size + 2)
  const end = address.slice(-size)
  return `${start}...${end}`
}

export async function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return true
  }
  const input = document.createElement('textarea')
  input.value = text
  input.style.position = 'fixed'
  input.style.left = '-9999px'
  document.body.appendChild(input)
  input.select()
  const success = document.execCommand('copy')
  document.body.removeChild(input)
  return success
}
