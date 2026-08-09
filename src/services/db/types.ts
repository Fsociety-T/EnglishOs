import type {
  DailyStat,
  Lesson,
  LessonProgress,
  Podcast,
  PodcastNote,
  PracticeSession,
  Profile,
  Song,
  SrsBox,
  VocabWord,
} from '@/types'

/**
 * Everything the app can read or write, in one interface.
 *
 * `demoRepo` implements it against localStorage so the whole app works with no
 * account. Phase 10 adds `supabaseRepo` with the same shape for cloud sync.
 * Components never import an implementation - they call `useRepo()`.
 *
 * Every method is async even in the localStorage version, so swapping in a
 * network-backed implementation later changes no calling code.
 */
export interface Repository {
  readonly name: string
  /** True when data syncs across devices; false for the local demo store. */
  readonly isCloud: boolean

  getProfile(): Promise<Profile>
  saveProfile(profile: Profile): Promise<void>

  listSessions(): Promise<PracticeSession[]>
  getSession(id: string): Promise<PracticeSession | null>
  createSession(session: PracticeSession): Promise<PracticeSession>
  deleteSession(id: string): Promise<void>

  listLessons(): Promise<Lesson[]>
  getLesson(id: string): Promise<Lesson | null>
  createLessons(lessons: Lesson[]): Promise<Lesson[]>
  /**
   * Write the result of a quiz attempt: the new status, and when the lesson
   * should come back. Status and schedule move together - a lesson that is
   * mastered but never re-tested is the failure mode this replaces.
   */
  saveLessonProgress(id: string, progress: LessonProgress): Promise<void>

  listVocabulary(): Promise<VocabWord[]>
  addWord(word: VocabWord): Promise<VocabWord>
  updateWord(id: string, patch: Partial<VocabWord>): Promise<void>
  deleteWord(id: string): Promise<void>
  /** Move a word between Leitner boxes and reschedule its next review. */
  reviewWord(id: string, box: SrsBox, nextReviewAt: string): Promise<void>

  listPodcasts(): Promise<Podcast[]>
  getPodcast(id: string): Promise<Podcast | null>
  addPodcast(podcast: Podcast): Promise<Podcast>
  updatePodcast(id: string, patch: Partial<Podcast>): Promise<void>
  deletePodcast(id: string): Promise<void>

  listSongs(): Promise<Song[]>
  getSong(id: string): Promise<Song | null>
  addSong(song: Song): Promise<Song>
  /** Used for the words, the title, and each timing as it is tapped in. */
  updateSong(id: string, patch: Partial<Song>): Promise<void>
  deleteSong(id: string): Promise<void>

  listNotes(podcastId: string): Promise<PodcastNote[]>
  addNote(note: PodcastNote): Promise<PodcastNote>
  deleteNote(id: string): Promise<void>

  listDailyStats(): Promise<DailyStat[]>
  /** Add to today's totals. Creates the row if this is the first practice today. */
  recordActivity(patch: Partial<Omit<DailyStat, 'day'>>): Promise<void>

  /** Everything as JSON, for backup or moving to another machine. */
  exportAll(): Promise<string>
  importAll(json: string): Promise<void>
  clearAll(): Promise<void>
}
