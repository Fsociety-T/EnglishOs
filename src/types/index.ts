/**
 * The domain model for EnglishOS.
 *
 * These types are the contract between the three layers that can each be
 * swapped independently: the UI, the data repository (demo/localStorage today,
 * Supabase later), and the AI provider (mock today, Claude later).
 */

export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export const CEFR_LEVELS: readonly CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

/**
 * The language the learner is studying. This is the single switch that decides
 * which lessons, topics, grammar rules and interface text the app uses, so it
 * is chosen at sign-up and stored on the profile rather than guessed from the
 * browser.
 */
export type LearningLanguage = 'en' | 'fr'

export const LEARNING_LANGUAGES: readonly LearningLanguage[] = ['en', 'fr']

/** Each language named in itself, which is how language pickers should read. */
export const LANGUAGE_NAME: Record<LearningLanguage, string> = {
  en: 'English',
  fr: 'Français',
}

/**
 * A fixed set on purpose. Because every correction is tagged with one of
 * these, the app can answer "which grammar area is your weakest?" and generate
 * a lesson aimed exactly there.
 */
export type ErrorType =
  | 'verb-tense'
  | 'article'
  | 'preposition'
  | 'word-order'
  | 'subject-verb-agreement'
  | 'plural'
  | 'spelling'
  | 'collocation'
  | 'punctuation'
  | 'word-choice'
  // French-specific. English learners never see these, but the union is shared
  // so a correction can be stored and charted without knowing its language.
  | 'gender-agreement'
  | 'accent'
  | 'other'

export const ERROR_TYPES: readonly ErrorType[] = [
  'verb-tense',
  'article',
  'preposition',
  'word-order',
  'subject-verb-agreement',
  'plural',
  'spelling',
  'collocation',
  'punctuation',
  'word-choice',
  'gender-agreement',
  'accent',
  'other',
]

/**
 * Which mistakes each language can actually make. Charts and lesson pickers
 * iterate this rather than ERROR_TYPES, so an English learner is never offered
 * a gender-agreement lesson and a French learner is never told about "a / an".
 */
export const ERROR_TYPES_BY_LANGUAGE: Record<LearningLanguage, readonly ErrorType[]> = {
  en: [
    'verb-tense',
    'article',
    'preposition',
    'word-order',
    'subject-verb-agreement',
    'plural',
    'spelling',
    'collocation',
    'punctuation',
    'word-choice',
    'other',
  ],
  fr: [
    'verb-tense',
    'gender-agreement',
    'accent',
    'article',
    'preposition',
    'word-order',
    'subject-verb-agreement',
    'plural',
    'spelling',
    'punctuation',
    'word-choice',
    'other',
  ],
}

/**
 * Human-readable names, used in every chart legend and lesson badge. Keyed by
 * interface language: a French learner reads their mistake categories in
 * French, and the article label names that language's own articles.
 */
export const ERROR_TYPE_LABEL: Record<LearningLanguage, Record<ErrorType, string>> = {
  en: {
    'verb-tense': 'Verb tense',
    article: 'Articles (a / an / the)',
    preposition: 'Prepositions',
    'word-order': 'Word order',
    'subject-verb-agreement': 'Subject-verb agreement',
    plural: 'Plurals',
    spelling: 'Spelling',
    collocation: 'Word partnerships',
    punctuation: 'Punctuation',
    'word-choice': 'Word choice',
    'gender-agreement': 'Gender agreement',
    accent: 'Accents',
    other: 'Other',
  },
  fr: {
    'verb-tense': 'Temps du verbe',
    article: 'Articles (le / la / les / un / une)',
    preposition: 'Prépositions',
    'word-order': 'Ordre des mots',
    'subject-verb-agreement': 'Accord sujet-verbe',
    plural: 'Pluriels',
    spelling: 'Orthographe',
    collocation: 'Associations de mots',
    punctuation: 'Ponctuation',
    'word-choice': 'Choix du mot',
    'gender-agreement': 'Accord en genre',
    accent: 'Accents',
    other: 'Autre',
  },
}

export type Severity = 'minor' | 'moderate' | 'major'

export interface Correction {
  id: string
  sessionId: string
  /** The exact text the learner wrote. */
  original: string
  /** What it should have been. */
  corrected: string
  /** Why, in plain English. */
  explanation: string
  errorType: ErrorType
  severity: Severity
  /** Offsets into the session content, used to highlight inline. */
  charStart: number
  charEnd: number
}

export interface Scores {
  overall: number
  grammar: number
  vocabulary: number
  fluency: number
}

/** Computed locally from the transcript and timings - no AI needed. */
export interface FluencyMetrics {
  wordsPerMinute: number
  fillerCount: number
  fillerWords: string[]
  longPauses: number
  /** Unique words / total words. A rough measure of vocabulary variety. */
  uniqueWordRatio: number
  durationSeconds: number
}

export type SessionKind = 'writing' | 'speaking'

export interface PracticeSession {
  id: string
  /** Which language this was practised in, so the two never mix in lists. */
  language: LearningLanguage
  kind: SessionKind
  topicTitle: string
  prompt: string
  /** The essay, or the speech transcript. */
  content: string
  audioPath?: string | null
  durationSeconds: number
  wordCount: number
  /** Stored with the session so the correction view needs a single read. */
  corrections: Correction[]
  scores: Scores
  summary: string
  strengths: string[]
  nextFocus: string[]
  metrics?: FluencyMetrics | null
  createdAt: string
}

export interface Exercise {
  id: string
  question: string
  choices: string[]
  answerIndex: number
  explanation: string
}

export type LessonStatus = 'new' | 'learning' | 'mastered'

export interface Lesson {
  id: string
  language: LearningLanguage
  errorType: ErrorType
  title: string
  /** Short explanation, light markdown (paragraphs and **bold**). */
  body: string
  examples: { wrong: string; right: string; note?: string }[]
  exercises: Exercise[]
  sourceSessionId?: string | null
  /** The learner's own sentence that triggered this lesson. */
  sourceSentence?: string | null
  status: LessonStatus
  createdAt: string
}

export type VocabSource = 'writing' | 'speaking' | 'podcast' | 'manual'

/** Leitner boxes. Higher box = known better = reviewed less often. */
export type SrsBox = 1 | 2 | 3 | 4 | 5

export const SRS_INTERVAL_DAYS: Record<SrsBox, number> = {
  1: 1,
  2: 3,
  3: 7,
  4: 21,
  5: 60,
}

export interface VocabWord {
  id: string
  language: LearningLanguage
  word: string
  phonetic?: string
  partOfSpeech?: string
  definition: string
  example: string
  tags: string[]
  source: VocabSource
  sourceId?: string | null
  srsBox: SrsBox
  /** ISO date. Due when this is in the past. */
  nextReviewAt: string
  createdAt: string
}

export type PodcastPlatform = 'youtube' | 'spotify' | 'other'
export type PodcastStatus = 'to-watch' | 'watching' | 'done'

export interface Podcast {
  id: string
  title: string
  url: string
  platform: PodcastPlatform
  /** Video/episode id extracted from the URL, used to build the embed. */
  embedId?: string | null
  thumbnailUrl?: string | null
  status: PodcastStatus
  progressSeconds: number
  rating?: number | null
  createdAt: string
}

export interface PodcastNote {
  id: string
  podcastId: string
  /** null for a general note not tied to a moment. */
  timestampSeconds: number | null
  note: string
  createdAt: string
}

export interface DailyStat {
  /** yyyy-mm-dd, local time. */
  day: string
  minutesPracticed: number
  wordsWritten: number
  speakingSeconds: number
  wordsLearned: number
  lessonsCompleted: number
}

export interface Profile {
  displayName: string
  /** The language being learned, and the language the interface speaks. */
  language: LearningLanguage
  level: CefrLevel
  dailyGoalMinutes: number
}

/** Used wherever a profile is missing, so the app never renders languageless. */
export const DEFAULT_PROFILE: Profile = {
  displayName: 'Learner',
  language: 'en',
  level: 'B1',
  dailyGoalMinutes: 20,
}

export interface Topic {
  id: string
  language: LearningLanguage
  title: string
  prompt: string
  category: string
  level: CefrLevel
}
