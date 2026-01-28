const encoder = new TextEncoder()

function getRpId() {
  if (typeof window === 'undefined') {
    return undefined
  }
  return window.location.hostname
}

function toBase64Url(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(base64Url: string) {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(base64 + padding)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

function randomBytes(length: number) {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return bytes
}

export function isPasskeySupported() {
  const supported =
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    'PublicKeyCredential' in window
  console.info('[passkey] supported', supported, {
    secure: typeof window !== 'undefined' ? window.isSecureContext : false,
  })
  return supported
}

function assertSecureContext() {
  if (typeof window === 'undefined') {
    return
  }
  if (!window.isSecureContext) {
    throw new Error('Passkeys require a secure context (HTTPS or localhost).')
  }
}

export async function registerPasskey(username: string) {
  console.info('[passkey] register start', { username })
  if (!isPasskeySupported()) {
    throw new Error('Passkey is not supported on this device.')
  }
  assertSecureContext()

  const rpId = getRpId()
  console.info('[passkey] register rpId', rpId)
  const publicKey: PublicKeyCredentialCreationOptions = {
    rp: { name: 'Factor APY Screener', id: rpId },
    user: {
      id: randomBytes(16),
      name: username,
      displayName: username,
    },
    challenge: randomBytes(32),
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 },
      { type: 'public-key', alg: -257 },
    ],
    authenticatorSelection: {
      residentKey: 'required',
      userVerification: 'preferred',
    },
    timeout: 60000,
    attestation: 'none',
  }

  const credential = (await navigator.credentials.create({
    publicKey,
  })) as PublicKeyCredential | null

  if (!credential) {
    throw new Error('Passkey registration cancelled.')
  }

  console.info('[passkey] register success', {
    id: credential.id,
    type: credential.type,
  })
  return toBase64Url(credential.rawId)
}

export async function loginWithPasskey(credentialId: string) {
  console.info('[passkey] login with credentialId', credentialId)
  if (!isPasskeySupported()) {
    throw new Error('Passkey is not supported on this device.')
  }
  assertSecureContext()

  const rpId = getRpId()
  console.info('[passkey] login rpId', rpId)
  const request: PublicKeyCredentialRequestOptions = {
    challenge: encoder.encode('factor-login'),
    allowCredentials: [
      {
        id: fromBase64Url(credentialId),
        type: 'public-key',
      },
    ],
    userVerification: 'preferred',
    rpId,
    timeout: 60000,
  }

  const assertion = (await navigator.credentials.get({
    publicKey: request,
  })) as PublicKeyCredential | null

  if (!assertion) {
    throw new Error('Passkey login cancelled.')
  }

  console.info('[passkey] login success', {
    id: assertion.id,
    type: assertion.type,
  })
  return true
}

export async function loginWithAnyPasskey() {
  console.info('[passkey] login any passkey')
  if (!isPasskeySupported()) {
    throw new Error('Passkey is not supported on this device.')
  }
  assertSecureContext()

  const rpId = getRpId()
  console.info('[passkey] login any rpId', rpId)
  const request: PublicKeyCredentialRequestOptions = {
    challenge: encoder.encode('factor-login'),
    userVerification: 'preferred',
    rpId,
    timeout: 60000,
  }

  const assertion = (await navigator.credentials.get({
    publicKey: request,
  })) as PublicKeyCredential | null

  if (!assertion) {
    throw new Error('Passkey login cancelled.')
  }

  console.info('[passkey] login any success', {
    id: assertion.id,
    type: assertion.type,
  })
  return toBase64Url(assertion.rawId)
}
