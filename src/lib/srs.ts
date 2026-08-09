import type { Lesson, LessonProgress, SrsBox, VocabWord } from '@/types'
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

/**
 * Words and lessons carry the same shape of schedule, so they share the test.
 * A null date means "not waiting" rather than "overdue" - which is the whole
 * difference between a lesson you have never opened and one you have let slip.
 */
function dueAt(nextReviewAt: string | null | undefined, at: Date): boolean {
  if (!nextReviewAt) return false
  return new Date(nextReviewAt).getTime() <= at.getTime()
}

export function isDue(word: VocabWord, at: Date = new Date()): boolean {
  return dueAt(word.nextReviewAt, at)
}

/** Box 5 means it survived the full 60-day interval. */
export function isMastered(word: VocabWord): boolean {
  return word.srsBox >= 5
}

export function dueWords(words: VocabWord[]): VocabWord[] {
  // Weakest first, so a session that gets cut short covers what matters most.
  return words.filter((w) => isDue(w)).sort((a, b) => a.srsBox - b.srsBox)
}

/* ---------------------------------------------------------------- lessons -- */

export function isLessonDue(lesson: Lesson, at: Date = new Date()): boolean {
  return dueAt(lesson.nextReviewAt, at)
}

export function dueLessons(lessons: Lesson[]): Lesson[] {
  // Weakest first, same as words: a study session cut short covers what is
  // shakiest rather than whatever happens to be alphabetically first.
  return lessons.filter((l) => isLessonDue(l)).sort((a, b) => a.reviewBox - b.reviewBox)
}

/**
 * What one quiz attempt does to a lesson.
 *
 * Passing pushes the next review further out; failing sends the lesson back to
 * box 1 and marks it as still being learned, so it returns tomorrow. This is
 * what "practise until it is good" means in practice: the app decides when to
 * ask again, and it asks sooner about the things you keep getting wrong.
 */
export function lessonProgressAfterQuiz(
  lesson: Pick<Lesson, 'reviewBox'>,
  passed: boolean,
  from: Date = new Date(),
): LessonProgress {
  const box = passed ? nextBox(lesson.reviewBox, 'good') : 1
  return {
    status: passed ? 'mastered' : 'learning',
    reviewBox: box,
    nextReviewAt: nextReviewDate(box, from),
  }
}

export function describeInterval(box: SrsBox, t: Translate): string {
  const days = SRS_INTERVAL_DAYS[box]
  if (days === 1) return t('srs.tomorrow')
  if (days < 30) return t('srs.inDays', { count: days })
  return t('srs.inMonths', { count: Math.round(days / 30) })
}
