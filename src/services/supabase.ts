import { createClient } from '@supabase/supabase-js'

type Database = {
  public: {
    Tables: {
      passkey_accounts: {
        Row: { id: string; user_id: string; username: string; credential_id: string; created_at: string }
        Insert: { user_id: string; username: string; created_at: string; credential_id: string }
        Update: Partial<{ user_id: string; username: string; created_at: string; credential_id: string }>
        Relationships: []
      }
      tracked_wallets: {
        Row: { id: string; user_id: string; credential_id?: string; wallet_id: string; label: string; address: `0x${string}`; created_at: string }
        Insert: { user_id: string; wallet_id: string; label: string; address: `0x${string}`; credential_id?: string }
        Update: Partial<{ user_id: string; wallet_id: string; label: string; address: `0x${string}`; credential_id?: string }>
        Relationships: []
      }
      user_settings: {
        Row: { id: string; user_id: string; credential_id?: string; chain_id?: number; chain_ids?: number[]; refresh_interval_ms: number; alchemy_api_key?: string; created_at: string }
        Insert: { user_id: string; chain_ids: number[]; chain_id: number; refresh_interval_ms: number; alchemy_api_key: string; credential_id?: string }
        Update: Partial<{ user_id: string; chain_ids: number[]; chain_id: number; refresh_interval_ms: number; alchemy_api_key: string; credential_id?: string }>
        Relationships: []
      }
      user_profile: {
        Row: { id: string; user_id: string; credential_id?: string; nickname: string; email: string; bio: string; avatar_data_url?: string; updated_at: string; created_at: string }
        Insert: { user_id: string; nickname: string; email: string; bio: string; avatar_data_url?: string; updated_at: string; credential_id?: string }
        Update: Partial<{ user_id: string; nickname: string; email: string; bio: string; avatar_data_url?: string; updated_at: string; credential_id?: string }>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)
  ?.replace(/(^"|"$)/g, '')
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined)?.replace(/(^"|"$)/g, '')

function decodeJwtPayload(token?: string) {
  if (!token) {
    return null
  }
  try {
    const payload = token.split('.')[1]
    if (!payload) {
      return null
    }
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(normalized)
    return JSON.parse(decoded) as Record<string, string>
  } catch {
    return null
  }
}

function isSupabaseKeyMatchingProject() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return false
  }
  const ref = supabaseUrl.replace('https://', '').split('.')[0]
  const payload = decodeJwtPayload(supabaseAnonKey)
  return payload?.ref === ref
}

const globalSupabaseKey = '__factor_supabase__'
export type SupabaseClient = ReturnType<typeof createClient<Database>>
const existing = (globalThis as typeof globalThis & {
  [globalSupabaseKey]?: SupabaseClient | null
})[globalSupabaseKey]

export const supabase: SupabaseClient | null =
  existing ??
  (supabaseUrl && supabaseAnonKey && isSupabaseKeyMatchingProject()
    ? createClient<Database>(supabaseUrl, supabaseAnonKey)
    : null)

;(globalThis as typeof globalThis & {
  [globalSupabaseKey]?: SupabaseClient | null
})[globalSupabaseKey] = supabase

export const isSupabaseConfigured = Boolean(supabase)
export const isSupabaseKeyValid = isSupabaseKeyMatchingProject()
let supabaseAuthError: string | null = null
let supabaseAuthDisabled = false

export function getSupabaseAuthStatus() {
  return {
    error: supabaseAuthError,
    disabled: supabaseAuthDisabled,
  }
}

export type SupabasePasskeyAccount = {
  id: string
  user_id: string
  username: string
  credential_id: string
  created_at: string
}

export type SupabaseWallet = {
  id: string
  user_id: string
  credential_id?: string
  wallet_id: string
  label: string
  address: `0x${string}`
  created_at: string
}

export type SupabaseUserSettings = {
  id: string
  user_id: string
  credential_id?: string
  chain_id?: number
  chain_ids?: number[]
  refresh_interval_ms: number
  alchemy_api_key?: string
  created_at: string
}

export type SupabaseUserProfile = {
  id: string
  user_id: string
  credential_id?: string
  nickname: string
  email: string
  bio: string
  avatar_data_url?: string
  updated_at: string
  created_at: string
}

export async function ensureSupabaseUser() {
  if (!supabase) {
    return null
  }
  if (supabaseAuthDisabled) {
    return null
  }
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (session?.user) {
    return session.user
  }
  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) {
    const status = (error as { status?: number }).status
    const message = error.message || 'Supabase auth error'
    if (status === 422) {
      supabaseAuthError =
        'Anonymous sign-in blocked. Disable Captcha or enable Anonymous in Supabase Auth.'
    } else {
      supabaseAuthError = message
    }
    if (message.toLowerCase().includes('anonymous sign-ins are disabled')) {
      supabaseAuthDisabled = true
    }
    throw error
  }
  return data.user
}

export async function signOutSupabase() {
  if (!supabase) {
    return null
  }
  const { error } = await supabase.auth.signOut()
  if (error) {
    supabaseAuthError = error.message
    throw error
  }
  return true
}

export async function getSupabaseSession() {
  if (!supabase) {
    return null
  }
  const { data } = await supabase.auth.getSession()
  return data.session ?? null
}

export async function fetchUserSettings(options?: { credentialId?: string }) {
  if (!supabase) {
    return null
  }
  const credentialId = options?.credentialId
  const user = await ensureSupabaseUser()
  if (!user) {
    return null
  }
  let query = supabase.from('user_settings').select('*')
  if (credentialId) {
    query = query.eq('credential_id', credentialId)
  } else {
    query = query.eq('user_id', user.id)
  }
  const { data, error } = await query.maybeSingle()
  if (error) {
    throw error
  }
  return data as SupabaseUserSettings | null
}

export async function fetchUserProfile(options?: { credentialId?: string }) {
  if (!supabase) {
    return null
  }
  const credentialId = options?.credentialId
  const user = await ensureSupabaseUser()
  if (!user) {
    return null
  }
  let query = supabase.from('user_profile').select('*')
  if (credentialId) {
    query = query.eq('credential_id', credentialId)
  } else {
    query = query.eq('user_id', user.id)
  }
  const { data, error } = await query.maybeSingle()
  if (error) {
    throw error
  }
  return data as SupabaseUserProfile | null
}

// Supabase MFA WebAuthn is intentionally disabled in the client.

export async function upsertPasskeyAccount(input: {
  username: string
  createdAt: string
  credentialId: string
}) {
  if (!supabase) {
    return null
  }
  const user = await ensureSupabaseUser()
  if (!user) {
    return null
  }
  const { data, error } = await supabase
    .from('passkey_accounts')
    .upsert(
      {
        user_id: user.id,
        username: input.username,
        created_at: input.createdAt,
        credential_id: input.credentialId,
      } as Database['public']['Tables']['passkey_accounts']['Insert'],
      { onConflict: 'credential_id' },
    )
    .select()
    .maybeSingle()
  if (error) {
    throw error
  }
  return data as SupabasePasskeyAccount | null
}

export async function fetchPasskeyAccountForUser(): Promise<SupabasePasskeyAccount | null> {
  if (!supabase) {
    return null
  }
  const user = await ensureSupabaseUser()
  if (!user) {
    return null
  }
  const { data, error } = await supabase
    .from('passkey_accounts')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) {
    throw error
  }
  return data as SupabasePasskeyAccount | null
}

export async function fetchPasskeyAccountByCredentialId(
  credentialId: string,
): Promise<SupabasePasskeyAccount | null> {
  if (!supabase) {
    return null
  }
  await ensureSupabaseUser()
  const { data, error } = await supabase
    .from('passkey_accounts')
    .select('*')
    .eq('credential_id', credentialId)
    .maybeSingle()
  if (error) {
    throw error
  }
  return data as SupabasePasskeyAccount | null
}

export async function fetchTrackedWallets(options?: {
  credentialId?: string
}): Promise<SupabaseWallet[]> {
  if (!supabase) {
    return []
  }
  const credentialId = options?.credentialId
  const user = await ensureSupabaseUser()
  if (!user) {
    return []
  }
  if (credentialId) {
    const { data, error } = await supabase
      .from('tracked_wallets')
      .select('*')
      .eq('credential_id', credentialId)
      .order('created_at', { ascending: true })
    if (!error) {
      return (data ?? []) as SupabaseWallet[]
    }
  }
  const { data, error } = await supabase
    .from('tracked_wallets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
  if (error) {
    throw error
  }
  return (data ?? []) as SupabaseWallet[]
}

export async function upsertTrackedWallet(input: {
  walletId: string
  label: string
  address: `0x${string}`
  credentialId?: string
}) {
  if (!supabase) {
    return null
  }
  const user = await ensureSupabaseUser()
  if (!user) {
    return null
  }
  const payload = {
    user_id: user.id,
    wallet_id: input.walletId,
    label: input.label,
    address: input.address,
    ...(input.credentialId ? { credential_id: input.credentialId } : {}),
  }
  let response = await supabase
    .from('tracked_wallets')
    .upsert(payload as Database['public']['Tables']['tracked_wallets']['Insert'], { onConflict: 'wallet_id' })
    .select()
    .maybeSingle()
  if (response.error && input.credentialId) {
    response = await supabase
      .from('tracked_wallets')
      .upsert(
        {
          user_id: user.id,
          wallet_id: input.walletId,
          label: input.label,
          address: input.address,
        } as Database['public']['Tables']['tracked_wallets']['Insert'],
        { onConflict: 'wallet_id' },
      )
      .select()
      .maybeSingle()
  }
  if (response.error) {
    throw response.error
  }
  return response.data as SupabaseWallet | null
}

export async function deleteTrackedWallet(
  walletId: string,
  credentialId?: string,
) {
  if (!supabase) {
    return null
  }
  const user = await ensureSupabaseUser()
  if (!user) {
    return null
  }
  let response = await supabase
    .from('tracked_wallets')
    .delete()
    .eq('wallet_id', walletId)
    .eq('user_id', user.id)
  if (credentialId) {
    response = await supabase
      .from('tracked_wallets')
      .delete()
      .eq('wallet_id', walletId)
      .eq('credential_id', credentialId)
  }
  if (response.error) {
    throw response.error
  }
  return true
}

export async function upsertUserSettings(input: {
  chainIds: number[]
  refreshIntervalMs: number
  alchemyApiKey: string
  credentialId?: string
}) {
  if (!supabase) {
    return null
  }
  const user = await ensureSupabaseUser()
  if (!user) {
    return null
  }
  const payload = {
    user_id: user.id,
    chain_ids: input.chainIds,
    chain_id: input.chainIds[0],
    refresh_interval_ms: input.refreshIntervalMs,
    alchemy_api_key: input.alchemyApiKey,
    ...(input.credentialId ? { credential_id: input.credentialId } : {}),
  }
  const conflictTarget = input.credentialId ? 'credential_id' : 'user_id'
  let response = await supabase
    .from('user_settings')
    .upsert(payload as Database['public']['Tables']['user_settings']['Insert'], { onConflict: conflictTarget })
    .select()
    .maybeSingle()
  if (response.error && input.credentialId) {
    response = await supabase
      .from('user_settings')
      .upsert(
        {
          user_id: user.id,
          chain_id: input.chainIds[0],
          refresh_interval_ms: input.refreshIntervalMs,
          alchemy_api_key: input.alchemyApiKey,
        } as Database['public']['Tables']['user_settings']['Insert'],
        { onConflict: 'user_id' },
      )
      .select()
      .maybeSingle()
  }
  if (response.error) {
    throw response.error
  }
  return response.data as SupabaseUserSettings | null
}

export async function upsertUserProfile(input: {
  nickname: string
  email: string
  bio: string
  avatarDataUrl?: string
  credentialId?: string
}) {
  if (!supabase) {
    return null
  }
  const user = await ensureSupabaseUser()
  if (!user) {
    return null
  }
  const payload = {
    user_id: user.id,
    nickname: input.nickname,
    email: input.email,
    bio: input.bio,
    avatar_data_url: input.avatarDataUrl,
    updated_at: new Date().toISOString(),
    ...(input.credentialId ? { credential_id: input.credentialId } : {}),
  }
  const conflictTarget = input.credentialId ? 'credential_id' : 'user_id'
  let response = await supabase
    .from('user_profile')
    .upsert(payload as Database['public']['Tables']['user_profile']['Insert'], { onConflict: conflictTarget })
    .select()
    .maybeSingle()
  if (response.error && input.credentialId) {
    response = await supabase
      .from('user_profile')
      .upsert(
        {
          user_id: user.id,
          nickname: input.nickname,
          email: input.email,
          bio: input.bio,
          avatar_data_url: input.avatarDataUrl,
          updated_at: new Date().toISOString(),
        } as Database['public']['Tables']['user_profile']['Insert'],
        { onConflict: 'user_id' },
      )
      .select()
      .maybeSingle()
  }
  if (response.error) {
    throw response.error
  }
  return response.data as SupabaseUserProfile | null
}
