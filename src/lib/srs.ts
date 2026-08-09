import type { SrsBox, VocabWord } from '@/types'
import { SRS_INTERVAL_DAYS } from '@/types'
import type { Translate } from '@/i18n'

export type ReviewGrade = 'again' | 'good' | 'easy'

/**
 * Leitner boxes. Getting a word right moves it up a box and pushes the next
 * review further out; getting it wrong sends it straight back to box 1, so a
 * word you have forgotten is drilled daily until it sticks again.
 */
export function nextBox(current: SrsBox, grade: ReviewGrade): SrsBox {
  if (grade === 'again') return 1
  const step = grade === 'easy' ? 2 : 1
  return Math.min(5, current + step) as SrsBox
}

export function nextReviewDate(box: SrsBox, from: Date = new Date()): string {
  const date = new Date(from)
  date.setDate(date.getDate() + SRS_INTERVAL_DAYS[box])
  return date.toISOString()
}

export function isDue(word: VocabWord, at: Date = new Date()): boolean {
  return new Date(word.nextReviewAt).getTime() <= at.getTime()
}

/** Box 5 means it survived the full 60-day interval. */
export function isMastered(word: VocabWord): boolean {
  return word.srsBox >= 5
}

export function dueWords(words: VocabWord[]): VocabWord[] {
  // Weakest first, so a session that gets cut short covers what matters most.
  return words.filter((w) => isDue(w)).sort((a, b) => a.srsBox - b.srsBox)
}

export function describeInterval(box: SrsBox, t: Translate): string {
  const days = SRS_INTERVAL_DAYS[box]
  if (days === 1) return t('srs.tomorrow')
  if (days < 30) return t('srs.inDays', { count: days })
  return t('srs.inMonths', { count: Math.round(days / 30) })
}
