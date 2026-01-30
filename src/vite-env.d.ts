/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare global {
  var Buffer: typeof import('buffer').Buffer
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

export {}
