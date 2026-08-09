import type { StringKey, Translate } from '@/i18n'
import type { LearningLanguage } from '@/types'
import { WrongLanguageError } from './detectLanguage'

/** The language named in the interface language, lowercase for mid-sentence use. */
function languageName(language: LearningLanguage, t: Translate): string {
  return t(language === 'en' ? 'lang.en' : 'lang.fr')
}

/**
 * Turn whatever a submission threw into something worth reading.
 *
 * Writing, speaking and the placement test all fail the same three ways, and
 * all three keep the learner's text on screen while showing this - so the
 * message has to explain what to do next, not just that something broke.
 */
export function practiceErrorMessage(
  error: unknown,
  t: Translate,
  fallbackKey: StringKey,
): string {
  if (error instanceof WrongLanguageError) {
    return t('practice.wrongLanguage', {
      detected: languageName(error.detected, t),
      expected: languageName(error.expected, t),
    })
  }
  return error instanceof Error && error.message ? error.message : t(fallbackKey)
}
