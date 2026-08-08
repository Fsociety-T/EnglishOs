/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Which reviewer to use. "mock" until the real API is wired up. */
  readonly VITE_AI_PROVIDER?: 'mock' | 'claude'
  /** Blank in demo mode, which stores everything in localStorage instead. */
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
