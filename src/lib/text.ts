import type { FluencyMetrics } from '@/types'

const WORD_RE = /[A-Za-z']+/g

export function words(text: string): string[] {
  return text.match(WORD_RE) ?? []
}

export function countWords(text: string): number {
  return words(text).length
}

/** Split into sentences, keeping each sentence's offset so corrections and
 *  lessons can point back at the exact sentence the learner wrote. */
export function sentences(text: string): { text: string; start: number; end: number }[] {
  const out: { text: string; start: number; end: number }[] = []
  const re = /[^.!?\n]+[.!?]*/g
  let match: RegExpExecArray | null
  while ((match = re.exec(text)) !== null) {
    const raw = match[0]
    const trimmed = raw.trim()
    if (!trimmed) continue
    const leading = raw.length - raw.trimStart().length
    out.push({
      text: trimmed,
      start: match.index + leading,
      end: match.index + leading + trimmed.length,
    })
  }
  return out
}

/** The sentence containing a character offset - used to show "your sentence"
 *  on a generated lesson. */
export function sentenceAt(text: string, charIndex: number): string {
  const found = sentences(text).find((s) => charIndex >= s.start && charIndex <= s.end)
  return found?.text ?? text.slice(0, 120)
}

/** Unique words / total words. A rough vocabulary-variety signal. */
export function uniqueWordRatio(text: string): number {
  const all = words(text).map((w) => w.toLowerCase())
  if (all.length === 0) return 0
  return new Set(all).size / all.length
}

/**
 * Filler words, the single most useful speaking metric that needs no AI.
 * Multi-word fillers are matched first so "you know" is not counted as "know".
 */
export const FILLER_PATTERNS: readonly string[] = [
  'you know',
  'i mean',
  'sort of',
  'kind of',
  'um',
  'uh',
  'uhm',
  'erm',
  'ah',
  'like',
  'actually',
  'basically',
  'literally',
]

export function findFillers(transcript: string): { total: number; found: string[] } {
  const lower = ` ${transcript.toLowerCase()} `
  const found: string[] = []
  let total = 0
  for (const filler of FILLER_PATTERNS) {
    const re = new RegExp(`(?<![a-z])${filler.replace(/ /g, '\\s+')}(?![a-z])`, 'g')
    const count = (lower.match(re) ?? []).length
    if (count > 0) {
      total += count
      found.push(filler)
    }
  }
  return { total, found }
}

/**
 * All computed locally from the transcript and the recording length - no API
 * call needed, so these numbers are real even while the AI is mocked.
 */
export function computeFluencyMetrics(
  transcript: string,
  durationSeconds: number,
  longPauses = 0,
): FluencyMetrics {
  const wordCount = countWords(transcript)
  const minutes = durationSeconds / 60
  const fillers = findFillers(transcript)
  return {
    wordsPerMinute: minutes > 0 ? Math.round(wordCount / minutes) : 0,
    fillerCount: fillers.total,
    fillerWords: fillers.found,
    longPauses,
    uniqueWordRatio: uniqueWordRatio(transcript),
    durationSeconds: Math.round(durationSeconds),
  }
}

/**
 * A native speaker in casual conversation sits around 140-160 wpm. Below ~90
 * reads as hesitant, above ~190 as rushed. Returns a 0-100 score.
 */
export function paceScore(wordsPerMinute: number): number {
  if (wordsPerMinute <= 0) return 0
  const ideal = 145
  const distance = Math.abs(wordsPerMinute - ideal)
  return Math.round(Math.max(0, 100 - (distance / ideal) * 110))
}
