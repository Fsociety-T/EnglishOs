import { mockProvider } from './mockProvider'
import type { AiProvider } from './types'

export type * from './types'

/**
 * The only place the app decides which reviewer it is talking to.
 * Phase 11 adds `claudeProvider` and this switch grows one case.
 */
function selectProvider(): AiProvider {
  const configured = import.meta.env.VITE_AI_PROVIDER ?? 'mock'
  switch (configured) {
    case 'mock':
    default:
      return mockProvider
  }
}

export const ai: AiProvider = selectProvider()

/** Components use this rather than importing a provider directly. */
export function useAi(): AiProvider {
  return ai
}
