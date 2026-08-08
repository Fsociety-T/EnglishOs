import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * True when the build was given cloud credentials. When false the whole app
 * runs on the local demo store and never shows a login screen.
 */
export const cloudConfigured = Boolean(url && anonKey)

/**
 * The anon key is meant to be public - it identifies the project, not the
 * person. Row Level Security is what actually protects the data, which is why
 * every table in schema.sql has it enabled. The service_role key must never
 * appear in this codebase.
 */
export const supabase: SupabaseClient | null = cloudConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // The app runs under a hash route, so tokens come back in the URL hash.
        detectSessionInUrl: true,
      },
    })
  : null

export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new Error('Supabase is not configured for this build.')
  return supabase
}
