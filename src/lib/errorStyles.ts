import type { ErrorType, Severity } from '@/types'

/**
 * Full class strings, never built by string concatenation, because Tailwind
 * only generates classes it can see literally in the source.
 */
export interface ErrorTone {
  text: string
  chip: string
  underline: string
}

const TONES = {
  violet: {
    text: 'text-violet-soft',
    chip: 'bg-violet/15 text-violet-soft border-violet/30',
    underline: 'decoration-violet',
  },
  cyan: {
    text: 'text-cyan-soft',
    chip: 'bg-cyan/15 text-cyan-soft border-cyan/30',
    underline: 'decoration-cyan',
  },
  bad: {
    text: 'text-bad',
    chip: 'bg-bad/15 text-bad border-bad/30',
    underline: 'decoration-bad',
  },
  warn: {
    text: 'text-warn',
    chip: 'bg-warn/15 text-warn border-warn/30',
    underline: 'decoration-warn',
  },
  info: {
    text: 'text-info',
    chip: 'bg-info/15 text-info border-info/30',
    underline: 'decoration-info',
  },
} as const satisfies Record<string, ErrorTone>

/** Grouped so related mistakes share a colour and the page stays readable. */
export const ERROR_TONE: Record<ErrorType, ErrorTone> = {
  'verb-tense': TONES.bad,
  'subject-verb-agreement': TONES.bad,
  article: TONES.violet,
  plural: TONES.violet,
  preposition: TONES.cyan,
  collocation: TONES.cyan,
  'word-order': TONES.info,
  'word-choice': TONES.info,
  spelling: TONES.warn,
  punctuation: TONES.warn,
  other: TONES.info,
}

export const SEVERITY_LABEL: Record<Severity, string> = {
  minor: 'Small',
  moderate: 'Worth fixing',
  major: 'Important',
}

export function scoreTone(score: number): 'good' | 'warn' | 'bad' {
  if (score >= 75) return 'good'
  if (score >= 50) return 'warn'
  return 'bad'
}
