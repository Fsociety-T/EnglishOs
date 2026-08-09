import type {
  CefrLevel,
  Correction,
  FluencyMetrics,
  LearningLanguage,
  Lesson,
  LevelEstimate,
  Scores,
} from '@/types'

/** A correction before it has been attached to a stored session. */
export type CorrectionDraft = Omit<Correction, 'id' | 'sessionId'>

/**
 * A lesson before it has been stored. The review schedule is omitted as well
 * as the identifiers: when a lesson comes back is the app's decision to make,
 * never the model's.
 */
export type LessonDraft = Omit<
  Lesson,
  'id' | 'createdAt' | 'status' | 'reviewBox' | 'nextReviewAt'
>

export interface Review {
  /** The learner's text with every correction applied. */
  correctedText: string
  /**
   * The same piece of writing at its best: same ideas, same order, roughly the
   * same length, but structured the way a strong writer at that level would
   * structure it.
   *
   * Deliberately not the same thing as `correctedText`. Correcting answers
   * "what was wrong"; this answers "what good looks like for me", which is the
   * question a learner who makes no outright mistakes still needs answered.
   * Empty when no model wrote one - the offline engine cannot rewrite prose,
   * and inventing a "better version" that is merely the corrected text again
   * would be a lie the screen tells every time.
   */
  improvedText: string
  corrections: CorrectionDraft[]
  scores: Scores
  /** One or two encouraging, specific sentences. */
  summary: string
  strengths: string[]
  nextFocus: string[]
}

export interface VocabSuggestion {
  word: string
  phonetic?: string
  partOfSpeech?: string
  definition: string
  example: string
}

/** What a phrase the learner could not catch actually means. */
export interface PhraseExplanation {
  meaning: string
  /** Why it was hard to hear: an idiom, a contraction, two words run together. */
  notes: string[]
  /** Words from the phrase worth keeping, ready to save. */
  words: { word: string; definition: string }[]
}

export interface ReviewWritingInput {
  text: string
  topic: string
  level: CefrLevel
  /** Which language to review against, and to write the feedback in. */
  language: LearningLanguage
}

export interface ReviewSpeakingInput {
  transcript: string
  topic: string
  level: CefrLevel
  language: LearningLanguage
  metrics: FluencyMetrics
}

/**
 * The single seam between the app and whatever is grading the learner.
 *
 * `mockProvider` implements this with local pattern rules so every screen can
 * be built and used before any API key exists. `claudeProvider` implements the
 * same four methods against the Anthropic API in Phase 11. No component ever
 * imports either one directly - they call `useAi()`.
 */
export interface AiProvider {
  readonly name: string
  /** False for the mock, so the UI can honestly label the feedback as practice data. */
  readonly isReal: boolean

  reviewWriting(input: ReviewWritingInput): Promise<Review>
  reviewSpeaking(input: ReviewSpeakingInput): Promise<Review>
  /** `sourceText` lets the lesson quote the learner's own full sentence. */
  generateLessons(input: {
    corrections: Correction[]
    level: CefrLevel
    language: LearningLanguage
    sourceText?: string
  }): Promise<LessonDraft[]>
  suggestVocabulary(input: {
    text: string
    level: CefrLevel
    language: LearningLanguage
  }): Promise<VocabSuggestion[]>
  /**
   * Judge a writing sample against the CEFR descriptors.
   *
   * `corrections` come from the review that has already run, so the estimate
   * sees the same mistakes the learner is about to read about rather than
   * forming a second, contradictory opinion.
   */
  estimateLevel(input: {
    text: string
    language: LearningLanguage
    corrections: Correction[]
  }): Promise<LevelEstimate>
  /**
   * Explain something the learner could not catch while listening.
   *
   * `phrase` is what they *think* they heard, so it may be misheard or
   * misspelt - the point is to guess well rather than to demand accuracy.
   */
  explainPhrase(input: {
    phrase: string
    /** The line before it, when there is a transcript to take one from. */
    context?: string
    language: LearningLanguage
    level: CefrLevel
  }): Promise<PhraseExplanation>
}
