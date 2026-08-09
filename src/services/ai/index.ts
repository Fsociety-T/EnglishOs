import { claudeProvider } from './claudeProvider'
import { mockProvider } from './mockProvider'
import type { AiProvider } from './types'

export type * from './types'

/**
 * The only place the app decides which reviewer it is talking to.
 * The offline practice engine remains the safe default. Production enables the
 * real reviewer with the literal value VITE_AI_PROVIDER=claude — any other
 * value falls through to the offline engine. The provider API key never
 * appears here; it stays exclusively in the Edge Function's secret store.
 */
function selectProvider(): AiProvider {
  const configured = import.meta.env.VITE_AI_PROVIDER ?? 'mock'
  switch (configured) {
    case 'claude':
      return claudeProvider
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
