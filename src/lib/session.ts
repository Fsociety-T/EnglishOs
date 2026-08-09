import type {
  CefrLevel,
  Correction,
  FluencyMetrics,
  Lesson,
  LevelEstimate,
  PracticeSession,
  Profile,
  SessionKind,
} from '@/types'
import { ai } from '@/services/ai'
import type { Review } from '@/services/ai/types'
import { repo } from '@/services/db'
import { WrongLanguageError, detectWrongLanguage } from './detectLanguage'
import { estimateLevel } from './level'
import { countWords } from './text'
import { newId } from './utils'

export interface SubmitInput {
  kind: SessionKind
  topicTitle: string
  prompt: string
  content: string
  durationSeconds: number
  metrics?: FluencyMetrics
  audioPath?: string | null
}

export interface PlacementResult {
  session: PracticeSession
  estimate: LevelEstimate
}

/** Review the work, and attach the corrections to the session they belong to. */
async function reviewFor(
  input: SubmitInput,
  profile: Profile,
  sessionId: string,
): Promise<{ review: Review; corrections: Correction[] }> {
  // Refuse before spending a review on it. Asked to correct French as English,
  // the reviewer does not fail - it returns a page of confident nonsense, and
  // the learner has no way to tell that the feedback is worthless.
  const wrongLanguage = detectWrongLanguage(input.content, profile.language)
  if (wrongLanguage) throw new WrongLanguageError(wrongLanguage, profile.language)

  const review =
    input.kind === 'speaking' && input.metrics
      ? await ai.reviewSpeaking({
          transcript: input.content,
          topic: input.topicTitle,
          level: profile.level,
          language: profile.language,
          metrics: input.metrics,
        })
      : await ai.reviewWriting({
          text: input.content,
          topic: input.topicTitle,
          level: profile.level,
          language: profile.language,
        })

  const corrections: Correction[] = review.corrections.map((draft) => ({
    ...draft,
    id: newId(),
    sessionId,
  }))

  return { review, corrections }
}

/** Store the session, turn the mistakes into lessons, and count the time. */
async function finish(args: {
  input: SubmitInput
  profile: Profile
  sessionId: string
  review: Review
  corrections: Correction[]
  /** Set only by the placement test. */
  estimatedLevel: CefrLevel | null
}): Promise<PracticeSession> {
  const { input, profile, sessionId, review, corrections, estimatedLevel } = args

  const session: PracticeSession = {
    id: sessionId,
    language: profile.language,
    kind: input.kind,
    topicTitle: input.topicTitle,
    prompt: input.prompt,
    content: input.content,
    // An "improved version" identical to what they wrote teaches nothing and
    // just makes the tab look broken, so it is dropped rather than shown.
    improvedText:
      review.improvedText.trim() && review.improvedText.trim() !== input.content.trim()
        ? review.improvedText.trim()
        : null,
    audioPath: input.audioPath ?? null,
    durationSeconds: Math.round(input.durationSeconds),
    wordCount: countWords(input.content),
    corrections,
    scores: review.scores,
    summary: review.summary,
    strengths: review.strengths,
    nextFocus: review.nextFocus,
    metrics: input.metrics ?? null,
    isPlacement: estimatedLevel !== null,
    estimatedLevel,
    createdAt: new Date().toISOString(),
  }

  await repo.createSession(session)

  // Turn the mistakes into targeted lessons. A failure here must not lose the
  // session the learner just spent ten minutes on, so it is caught separately.
  if (corrections.length > 0) {
    try {
      const drafts = await ai.generateLessons({
        corrections,
        level: profile.level,
        language: profile.language,
        sourceText: input.content,
      })
      const lessons: Lesson[] = drafts.map((draft) => ({
        ...draft,
        id: newId(),
        // source_session_id is a uuid foreign key. The draft's value comes from
        // the model, which can only echo or invent one; we already know which
        // session these lessons came from, so never let the model decide it.
        sourceSessionId: sessionId,
        status: 'new',
        // A brand new lesson is unread, not overdue: it waits in "New" until
        // the first quiz, and only then joins the review schedule.
        reviewBox: 1,
        nextReviewAt: null,
        createdAt: new Date().toISOString(),
      }))
      if (lessons.length > 0) await repo.createLessons(lessons)
    } catch (err) {
      console.warn('EnglishOS: could not generate lessons for this session.', err)
    }
  }

  await repo.recordActivity({
    minutesPracticed: Math.max(1, Math.round(input.durationSeconds / 60)),
    wordsWritten: input.kind === 'writing' ? session.wordCount : 0,
    speakingSeconds: input.kind === 'speaking' ? session.durationSeconds : 0,
  })

  return session
}

/**
 * The one path a finished practice takes, shared by writing and speaking:
 * review it, store the session, turn the mistakes into lessons, and count the
 * time towards today's goal and streak.
 */
export async function submitPractice(input: SubmitInput): Promise<PracticeSession> {
  const profile = await repo.getProfile()
  const sessionId = newId()
  const { review, corrections } = await reviewFor(input, profile, sessionId)
  return finish({ input, profile, sessionId, review, corrections, estimatedLevel: null })
}

/**
 * Ask for a CEFR level, and never let that question be the thing that fails.
 *
 * The offline estimator is the same code the mock provider runs, so falling
 * back to it produces a real answer rather than an apology - and the learner
 * has already written for ten minutes by the time this is called.
 */
async function judgeLevel(input: {
  text: string
  language: Profile['language']
  corrections: Correction[]
}): Promise<LevelEstimate> {
  try {
    return await ai.estimateLevel(input)
  } catch (err) {
    console.warn('EnglishOS: falling back to the offline level estimate.', err)
    return estimateLevel({
      text: input.text,
      corrections: input.corrections,
      language: input.language,
    })
  }
}

/**
 * The placement test.
 *
 * It runs the ordinary pipeline first - this is real writing, and it earns
 * real corrections, real lessons and real minutes - and then asks the one
 * extra question the test exists for.
 *
 * The measured level is saved to `writingLevel` straight away, because the
 * measurement happened whether or not the learner likes the answer. Only
 * `profile.level`, the setting the rest of the app works from, waits for them
 * to accept it on the result screen.
 */
export async function submitPlacement(input: SubmitInput): Promise<PlacementResult> {
  const profile = await repo.getProfile()
  const sessionId = newId()
  const { review, corrections } = await reviewFor(input, profile, sessionId)

  const estimate = await judgeLevel({
    text: input.content,
    language: profile.language,
    corrections,
  })

  const session = await finish({
    input,
    profile,
    sessionId,
    review,
    corrections,
    estimatedLevel: estimate.level,
  })

  await repo.saveProfile({ ...profile, writingLevel: estimate.level })

  return { session, estimate }
}
