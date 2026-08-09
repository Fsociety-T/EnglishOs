import type { LearningLanguage } from '@/types'
import { words } from './text'

/**
 * Is this text actually in the language the learner is studying?
 *
 * The app corrects one language at a time. Handing French to an English
 * reviewer does not produce an error - it produces a page of confident,
 * useless corrections, which is worse, because the learner has no way to know
 * the feedback is nonsense.
 *
 * The bias here is deliberate and one-sided: **letting the wrong language
 * through is a bad day, blocking the right one is a broken app.** A learner
 * whose correct French is refused as "not French" has no way forward at all.
 * So every threshold below is set to stay quiet unless the evidence is
 * lopsided, and short texts are never judged.
 */

/**
 * Function words that belong to one language and not the other.
 *
 * Deliberately not imported from levelSignals: those lists are tuned for
 * measuring range and are covered by a calibration test, and detection wants
 * different words - the boring grammatical glue that a writer cannot avoid and
 * a translator cannot borrow.
 */
const EN_MARKERS = `the and is are was were be been being of to in that it he she they we you
i this these those there their them his her our your my with for from as at by on or but not
have has had do does did will would can could should may might must there's isn't don't
about into over after before under between which who whom whose what when where why how
because although though while since if then than too very much many any some more most
each other another every no yet still just only also even own same such off out up down
back here now new good great little long`
  .split(/\s+/)
  .filter(Boolean)

const FR_MARKERS = `le la les un une des du de au aux et est sont était étaient être été suis
es sommes êtes ai as avons avez ont avait avaient je tu il elle nous vous ils elles on me te
se lui leur mon ma mes ton ta tes son sa ses notre nos votre vos leurs ce cet cette ces qui
que quoi dont où quand comme parce car mais ou donc ni or pas plus moins très trop beaucoup
peu aussi encore déjà toujours jamais dans sur sous chez vers avec sans pour par entre après
avant depuis pendant faire fait dit aller va vais peut peuvent veut veux tout tous toute
toutes même autre autres chaque quelque quelques rien tout`
  .split(/\s+/)
  .filter(Boolean)

/** Only words unique to one list can be evidence; shared ones prove nothing. */
const EN_ONLY = new Set(EN_MARKERS.filter((w) => !FR_MARKERS.includes(w)))
const FR_ONLY = new Set(FR_MARKERS.filter((w) => !EN_MARKERS.includes(w)))

const MARKERS: Record<LearningLanguage, Set<string>> = { en: EN_ONLY, fr: FR_ONLY }

/**
 * Below this, stay silent. A dozen words is not enough to tell a French
 * sentence from an English one written with borrowed vocabulary, and refusing
 * a beginner's first three lines would be the cruellest possible false alarm.
 */
const MIN_WORDS = 25

/** The wrong language must be at least this much more likely than the right one. */
const MARGIN = 2.5

/** ...and must clear this on its own, so two near-zero scores never trigger. */
const FLOOR = 0.1

export interface LanguageScores {
  en: number
  fr: number
  wordCount: number
}

/** Share of words that are function words unique to each language. */
export function scoreLanguages(text: string): LanguageScores {
  const tokens = words(text).map((w) => w.toLowerCase())
  const total = tokens.length || 1
  const hits = (set: Set<string>) => tokens.filter((w) => set.has(w)).length / total
  return { en: hits(EN_ONLY), fr: hits(FR_ONLY), wordCount: tokens.length }
}

/**
 * The language this text is written in, if the evidence is one-sided enough to
 * say so, and it is not the one expected. Null means "carry on" - including
 * every case where the answer is merely unclear.
 */
export function detectWrongLanguage(
  text: string,
  expected: LearningLanguage,
): LearningLanguage | null {
  const scores = scoreLanguages(text)
  if (scores.wordCount < MIN_WORDS) return null

  const other: LearningLanguage = expected === 'en' ? 'fr' : 'en'
  const expectedScore = scores[expected]
  const otherScore = scores[other]

  if (otherScore < FLOOR) return null
  if (otherScore < expectedScore * MARGIN) return null
  return other
}

/**
 * Thrown instead of sending the text to the reviewer.
 *
 * A typed error rather than a message, because the screens have to say this in
 * the learner's own language and `session.ts` has no translator.
 */
export class WrongLanguageError extends Error {
  constructor(
    readonly detected: LearningLanguage,
    readonly expected: LearningLanguage,
  ) {
    super(`Text appears to be ${detected}, not ${expected}.`)
    this.name = 'WrongLanguageError'
  }
}

/** Marker sets, for the tuning script. */
export const DETECTION_MARKERS = MARKERS
