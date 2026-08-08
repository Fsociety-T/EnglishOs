import { demoRepo } from './demoRepo'
import { supabaseRepo } from './supabaseRepo'
import { cloudConfigured } from './supabaseClient'
import type { Repository } from './types'

export type * from './types'
export { cloudConfigured }

/**
 * The only place the app decides where data lives.
 * With credentials it syncs to Supabase; without them it stays on this device
 * and needs no account at all.
 */
export const repo: Repository = cloudConfigured ? supabaseRepo : demoRepo

/** Components use this rather than importing an implementation directly. */
export function useRepo(): Repository {
  return repo
}
