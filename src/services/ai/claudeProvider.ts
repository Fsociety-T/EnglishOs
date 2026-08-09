import { newId } from '@/lib/utils'
import { requireSupabase } from '@/services/db/supabaseClient'
import type { AiProvider, LessonDraft, Review, ReviewSpeakingInput, ReviewWritingInput, VocabSuggestion } from './types'

type Action = 'review-writing' | 'review-speaking' | 'generate-lessons' | 'suggest-vocabulary'

/**
 * Calls the protected Supabase Edge Function, never the model provider
 * directly. Keeping this request small and typed means the provider API key
 * cannot reach a browser.
 */
async function invoke<T>(action: Action, input: unknown): Promise<T> {
  const { data, error } = await requireSupabase().functions.invoke('claude-review', {
    body: { action, input },
  })

  if (error) throw new Error(error.message || 'The AI review service is unavailable.')
  if (!data?.data) throw new Error(data?.error || 'The AI review service returned no feedback.')
  return data.data as T
}

export const claudeProvider: AiProvider = {
  name: 'AI reviewer',
  isReal: true,

  reviewWriting(input: ReviewWritingInput): Promise<Review> {
    return invoke<Review>('review-writing', input)
  },

  reviewSpeaking(input: ReviewSpeakingInput): Promise<Review> {
    return invoke<Review>('review-speaking', input)
  },

  async generateLessons(input): Promise<LessonDraft[]> {
    const lessons = await invoke<
      Array<Omit<LessonDraft, 'exercises'> & { exercises: Array<Omit<LessonDraft['exercises'][number], 'id'>> }>
    >('generate-lessons', input)

    // Exercise IDs only identify UI choices and are not meaningful to the model.
    return lessons.map((lesson) => ({
      ...lesson,
      exercises: lesson.exercises.map((exercise) => ({ ...exercise, id: newId('ex') })),
    }))
  },

  suggestVocabulary(input: { text: string; level: ReviewWritingInput['level'] }): Promise<VocabSuggestion[]> {
    return invoke<VocabSuggestion[]>('suggest-vocabulary', input)
  },
}
