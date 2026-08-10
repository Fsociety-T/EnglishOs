/**
 * The shape both speech engines return.
 *
 * There are two: the Web Speech API in the browser, and Android's own
 * recogniser in the APK. Speaking practice must not know or care which one it
 * is talking to, so the contract lives here rather than in either of them.
 */
export interface SpeechRecognitionState {
  /** Everything confirmed so far. */
  transcript: string
  /** The phrase currently being spoken, not yet confirmed. */
  interim: string
  listening: boolean
  longPauses: number
  error: string | null
  start: () => void
  stop: () => void
  reset: () => void
}

/** A gap longer than this between phrases counts as hesitation. */
export const LONG_PAUSE_MS = 2500

/** Shown for both engines, so the learner reads the same sentence either way. */
export const MIC_REFUSED =
  'Microphone permission was refused. Allow it to use speaking practice.'

/** Joins a confirmed phrase onto what is already there. */
export function appendPhrase(previous: string, phrase: string): string {
  const next = phrase.trim()
  if (!next) return previous
  return previous ? `${previous} ${next}` : next
}
