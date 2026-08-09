import { useMemo } from 'react'
import { useLanguage } from '@/i18n'
import { repo } from '@/services/db'
import type { Lesson, PracticeSession, Song, VocabWord } from '@/types'
import { useAsync } from './useAsync'
import type { AsyncState } from './useAsync'

/**
 * Content readers scoped to the language being learned.
 *
 * Every session, lesson and word records the language it belongs to. Screens
 * read through these hooks rather than calling the repository directly, so
 * switching to French cannot leak English lessons into the list - the filter
 * lives in one place instead of at a dozen call sites where one would
 * eventually be forgotten.
 */
function useScoped<T extends { language: string }>(
  load: () => Promise<T[]>,
  deps: unknown[],
): AsyncState<T[]> {
  const { language } = useLanguage()
  const state = useAsync(load, [...deps, language])
  const data = useMemo(
    () => (state.data ? state.data.filter((item) => item.language === language) : null),
    [state.data, language],
  )
  return { ...state, data }
}

export function useSessions(deps: unknown[] = []): AsyncState<PracticeSession[]> {
  return useScoped(() => repo.listSessions(), deps)
}

export function useLessons(deps: unknown[] = []): AsyncState<Lesson[]> {
  return useScoped(() => repo.listLessons(), deps)
}

export function useVocabulary(deps: unknown[] = []): AsyncState<VocabWord[]> {
  return useScoped(() => repo.listVocabulary(), deps)
}

export function useSongs(deps: unknown[] = []): AsyncState<Song[]> {
  return useScoped(() => repo.listSongs(), deps)
}
