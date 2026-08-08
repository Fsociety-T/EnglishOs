import { demoRepo } from './demoRepo'
import type { Repository } from './types'

export type * from './types'

/**
 * The only place the app decides where data lives.
 * Phase 10 adds `supabaseRepo` and this returns it whenever credentials exist.
 */
function selectRepository(): Repository {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (url && key) {
    // Phase 10 wires the cloud repository in here.
    return demoRepo
  }
  return demoRepo
}

export const repo: Repository = selectRepository()

/** Components use this rather than importing an implementation directly. */
export function useRepo(): Repository {
  return repo
}
