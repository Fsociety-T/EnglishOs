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

/** A lesson before it has been stored. */
export type LessonDraft = Omit<Lesson, 'id' | 'createdAt' | 'status'>

export interface Review {
  /** The learner's text with every correction applied. */
  correctedText: string
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
}
