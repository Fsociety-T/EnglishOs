import type { Correction, FluencyMetrics, Lesson, PracticeSession, SessionKind } from '@/types'
import { ai } from '@/services/ai'
import { repo } from '@/services/db'
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

/**
 * The one path a finished practice takes, shared by writing and speaking:
 * review it, store the session, turn the mistakes into lessons, and count the
 * time towards today's goal and streak.
 */
export async function submitPractice(input: SubmitInput): Promise<PracticeSession> {
  const profile = await repo.getProfile()
  const sessionId = newId()

  const review =
    input.kind === 'speaking' && input.metrics
      ? await ai.reviewSpeaking({
          transcript: input.content,
          topic: input.topicTitle,
          level: profile.level,
          metrics: input.metrics,
        })
      : await ai.reviewWriting({
          text: input.content,
          topic: input.topicTitle,
          level: profile.level,
        })

  const corrections: Correction[] = review.corrections.map((draft) => ({
    ...draft,
    id: newId(),
    sessionId,
  }))

  const session: PracticeSession = {
    id: sessionId,
    kind: input.kind,
    topicTitle: input.topicTitle,
    prompt: input.prompt,
    content: input.content,
    audioPath: input.audioPath ?? null,
    durationSeconds: Math.round(input.durationSeconds),
    wordCount: countWords(input.content),
    corrections,
    scores: review.scores,
    summary: review.summary,
    strengths: review.strengths,
    nextFocus: review.nextFocus,
    metrics: input.metrics ?? null,
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
