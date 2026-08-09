import type {
  DailyStat,
  Lesson,
  LessonStatus,
  Podcast,
  PodcastNote,
  PracticeSession,
  Profile,
  SrsBox,
  VocabWord,
} from '@/types'
import { DEFAULT_PROFILE } from '@/types'
import { localDay } from '@/lib/utils'
import { seedStore } from './seed'
import type { Repository } from './types'

const STORAGE_KEY = 'englishos.v1'

export interface Store {
  profile: Profile
  sessions: PracticeSession[]
  lessons: Lesson[]
  vocabulary: VocabWord[]
  podcasts: Podcast[]
  notes: PodcastNote[]
  stats: DailyStat[]
}

function emptyStore(): Store {
  return {
    profile: { ...DEFAULT_PROFILE },
    sessions: [],
    lessons: [],
    vocabulary: [],
    podcasts: [],
    notes: [],
    stats: [],
  }
}

function read(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      // First ever visit: seed with a few examples so no screen is a blank wall.
      const seeded = seedStore(emptyStore())
      write(seeded)
      return seeded
    }
    // Merge over an empty store so a store written by an older version that is
    // missing a newer key cannot crash a screen with `undefined.map`.
    return { ...emptyStore(), ...(JSON.parse(raw) as Partial<Store>) } as Store
  } catch {
    return emptyStore()
  }
}

function write(store: Store): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // Quota exceeded or private mode. The app keeps working for this session.
    console.warn('EnglishOS: could not save to localStorage.')
  }
}

function mutate(fn: (store: Store) => void): Store {
  const store = read()
  fn(store)
  write(store)
  return store
}

/** Structured clone so callers cannot mutate the store by reference. */
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export const demoRepo: Repository = {
  name: 'This device (demo mode)',
  isCloud: false,

  async getProfile() {
    // A store written before the French version has no language field.
    return { ...DEFAULT_PROFILE, ...clone(read().profile) }
  },
  async saveProfile(profile) {
    mutate((s) => {
      s.profile = profile
    })
  },

  async listSessions() {
    return clone(read().sessions).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
  async getSession(id) {
    return clone(read().sessions.find((s) => s.id === id) ?? null)
  },
  async createSession(session) {
    mutate((s) => {
      s.sessions.push(session)
    })
    return session
  },
  async deleteSession(id) {
    mutate((s) => {
      s.sessions = s.sessions.filter((x) => x.id !== id)
    })
  },

  async listLessons() {
    return clone(read().lessons).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
  async getLesson(id) {
    return clone(read().lessons.find((l) => l.id === id) ?? null)
  },
  async createLessons(lessons) {
    mutate((s) => {
      // Don't pile up duplicate lessons for a weakness the learner already has
      // an unfinished lesson on - update the existing one instead.
      for (const lesson of lessons) {
        const existing = s.lessons.find(
          (l) => l.errorType === lesson.errorType && l.status !== 'mastered',
        )
        if (existing) {
          existing.sourceSentence = lesson.sourceSentence
          existing.sourceSessionId = lesson.sourceSessionId
          existing.createdAt = lesson.createdAt
        } else {
          s.lessons.push(lesson)
        }
      }
    })
    return lessons
  },
  async setLessonStatus(id, status: LessonStatus) {
    mutate((s) => {
      const lesson = s.lessons.find((l) => l.id === id)
      if (lesson) lesson.status = status
    })
  },

  async listVocabulary() {
    return clone(read().vocabulary).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
  async addWord(word) {
    mutate((s) => {
      const duplicate = s.vocabulary.find(
        (w) => w.word.toLowerCase() === word.word.toLowerCase(),
      )
      if (!duplicate) s.vocabulary.push(word)
    })
    return word
  },
  async updateWord(id, patch) {
    mutate((s) => {
      const word = s.vocabulary.find((w) => w.id === id)
      if (word) Object.assign(word, patch)
    })
  },
  async deleteWord(id) {
    mutate((s) => {
      s.vocabulary = s.vocabulary.filter((w) => w.id !== id)
    })
  },
  async reviewWord(id, box: SrsBox, nextReviewAt) {
    mutate((s) => {
      const word = s.vocabulary.find((w) => w.id === id)
      if (word) {
        word.srsBox = box
        word.nextReviewAt = nextReviewAt
      }
    })
  },

  async listPodcasts() {
    return clone(read().podcasts).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
  async getPodcast(id) {
    return clone(read().podcasts.find((p) => p.id === id) ?? null)
  },
  async addPodcast(podcast) {
    mutate((s) => {
      s.podcasts.push(podcast)
    })
    return podcast
  },
  async updatePodcast(id, patch) {
    mutate((s) => {
      const podcast = s.podcasts.find((p) => p.id === id)
      if (podcast) Object.assign(podcast, patch)
    })
  },
  async deletePodcast(id) {
    mutate((s) => {
      s.podcasts = s.podcasts.filter((p) => p.id !== id)
      s.notes = s.notes.filter((n) => n.podcastId !== id)
    })
  },

  async listNotes(podcastId) {
    return clone(read().notes.filter((n) => n.podcastId === podcastId)).sort(
      (a, b) => (a.timestampSeconds ?? 0) - (b.timestampSeconds ?? 0),
    )
  },
  async addNote(note) {
    mutate((s) => {
      s.notes.push(note)
    })
    return note
  },
  async deleteNote(id) {
    mutate((s) => {
      s.notes = s.notes.filter((n) => n.id !== id)
    })
  },

  async listDailyStats() {
    return clone(read().stats).sort((a, b) => a.day.localeCompare(b.day))
  },
  async recordActivity(patch) {
    mutate((s) => {
      const today = localDay()
      let row = s.stats.find((d) => d.day === today)
      if (!row) {
        row = {
          day: today,
          minutesPracticed: 0,
          wordsWritten: 0,
          speakingSeconds: 0,
          wordsLearned: 0,
          lessonsCompleted: 0,
        }
        s.stats.push(row)
      }
      row.minutesPracticed += patch.minutesPracticed ?? 0
      row.wordsWritten += patch.wordsWritten ?? 0
      row.speakingSeconds += patch.speakingSeconds ?? 0
      row.wordsLearned += patch.wordsLearned ?? 0
      row.lessonsCompleted += patch.lessonsCompleted ?? 0
    })
  },

  async exportAll() {
    return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), data: read() }, null, 2)
  },
  async importAll(json) {
    const parsed = JSON.parse(json) as { data?: Partial<Store> }
    const incoming = parsed.data ?? (parsed as Partial<Store>)
    write({ ...emptyStore(), ...incoming } as Store)
  },
  async clearAll() {
    write(emptyStore())
  },
}
