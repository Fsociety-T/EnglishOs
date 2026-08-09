import type {
  Correction,
  DailyStat,
  FluencyMetrics,
  Lesson,
  LessonStatus,
  Podcast,
  PodcastNote,
  PracticeSession,
  Profile,
  Scores,
  SrsBox,
  LearningLanguage,
  VocabWord,
} from '@/types'
import { DEFAULT_PROFILE } from '@/types'
import { requireSupabase } from './supabaseClient'
import type { Repository } from './types'

/*
 * Same Repository interface as demoRepo, so no component changes when the app
 * moves to the cloud. Only this file knows about Postgres column names.
 */

async function userId(): Promise<string> {
  const { data } = await requireSupabase().auth.getUser()
  const id = data.user?.id
  if (!id) throw new Error('You are signed out. Sign in again to continue.')
  return id
}

/** Postgres returns an error object rather than throwing; surface it. */
function check<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message)
  return result.data
}

/* ------------------------------------------------------------- row mapping */

interface SessionRow {
  id: string
  language: LearningLanguage
  kind: 'writing' | 'speaking'
  topic_title: string
  prompt: string
  content: string
  improved_text: string | null
  audio_path: string | null
  duration_seconds: number
  word_count: number
  corrections: Correction[]
  scores: Scores
  summary: string
  strengths: string[]
  next_focus: string[]
  metrics: FluencyMetrics | null
  is_placement: boolean
  estimated_level: PracticeSession['estimatedLevel']
  created_at: string
}

function toSession(row: SessionRow): PracticeSession {
  return {
    id: row.id,
    language: row.language ?? 'en',
    kind: row.kind,
    topicTitle: row.topic_title,
    prompt: row.prompt,
    content: row.content,
    improvedText: row.improved_text ?? null,
    audioPath: row.audio_path,
    durationSeconds: row.duration_seconds,
    wordCount: row.word_count,
    corrections: row.corrections ?? [],
    scores: row.scores,
    summary: row.summary,
    strengths: row.strengths ?? [],
    nextFocus: row.next_focus ?? [],
    metrics: row.metrics,
    isPlacement: row.is_placement ?? false,
    estimatedLevel: row.estimated_level ?? null,
    createdAt: row.created_at,
  }
}

interface LessonRow {
  id: string
  language: LearningLanguage
  error_type: Lesson['errorType']
  title: string
  body: string
  memory_hook: string | null
  examples: Lesson['examples']
  exercises: Lesson['exercises']
  source_session_id: string | null
  source_sentence: string | null
  status: LessonStatus
  review_box: SrsBox | null
  next_review_at: string | null
  created_at: string
}

function toLesson(row: LessonRow): Lesson {
  return {
    id: row.id,
    language: row.language ?? 'en',
    errorType: row.error_type,
    title: row.title,
    body: row.body,
    memoryHook: row.memory_hook,
    examples: row.examples ?? [],
    exercises: row.exercises ?? [],
    sourceSessionId: row.source_session_id,
    sourceSentence: row.source_sentence,
    status: row.status,
    // Rows written before review scheduling existed have no box. Box 1 is the
    // honest starting point, and a null date simply means "not waiting".
    reviewBox: row.review_box ?? 1,
    nextReviewAt: row.next_review_at,
    createdAt: row.created_at,
  }
}

interface VocabRow {
  id: string
  language: LearningLanguage
  word: string
  phonetic: string | null
  part_of_speech: string | null
  definition: string
  example: string
  tags: string[]
  source: VocabWord['source']
  source_id: string | null
  srs_box: SrsBox
  next_review_at: string
  created_at: string
}

function toWord(row: VocabRow): VocabWord {
  return {
    id: row.id,
    language: row.language ?? 'en',
    word: row.word,
    phonetic: row.phonetic ?? undefined,
    partOfSpeech: row.part_of_speech ?? undefined,
    definition: row.definition,
    example: row.example,
    tags: row.tags ?? [],
    source: row.source,
    sourceId: row.source_id,
    srsBox: row.srs_box,
    nextReviewAt: row.next_review_at,
    createdAt: row.created_at,
  }
}

interface PodcastRow {
  id: string
  title: string
  url: string
  platform: Podcast['platform']
  embed_id: string | null
  thumbnail_url: string | null
  status: Podcast['status']
  progress_seconds: number
  rating: number | null
  created_at: string
}

function toPodcast(row: PodcastRow): Podcast {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    platform: row.platform,
    embedId: row.embed_id,
    thumbnailUrl: row.thumbnail_url,
    status: row.status,
    progressSeconds: row.progress_seconds,
    rating: row.rating,
    createdAt: row.created_at,
  }
}

/* ------------------------------------------------------------- repository */

export const supabaseRepo: Repository = {
  name: 'Cloud sync',
  isCloud: true,

  async getProfile(): Promise<Profile> {
    const sb = requireSupabase()
    const uid = await userId()
    const { data, error } = await sb
      .from('profiles')
      .select('display_name, language, level, writing_level, speaking_level, daily_goal_minutes')
      .eq('id', uid)
      .maybeSingle()
    if (error) throw new Error(error.message)
    // The signup trigger normally creates this; fall back rather than crash.
    if (!data) return { ...DEFAULT_PROFILE }
    return {
      displayName: data.display_name,
      language: data.language ?? DEFAULT_PROFILE.language,
      level: data.level,
      writingLevel: data.writing_level ?? null,
      speakingLevel: data.speaking_level ?? null,
      dailyGoalMinutes: data.daily_goal_minutes,
    }
  },

  async saveProfile(profile) {
    const sb = requireSupabase()
    const uid = await userId()
    const { error } = await sb.from('profiles').upsert({
      id: uid,
      display_name: profile.displayName,
      language: profile.language,
      level: profile.level,
      writing_level: profile.writingLevel,
      speaking_level: profile.speakingLevel,
      daily_goal_minutes: profile.dailyGoalMinutes,
    })
    if (error) throw new Error(error.message)
  },

  async listSessions() {
    const sb = requireSupabase()
    const rows = check(
      await sb.from('sessions').select('*').order('created_at', { ascending: false }),
    ) as SessionRow[]
    return rows.map(toSession)
  },

  async getSession(id) {
    const sb = requireSupabase()
    const { data, error } = await sb.from('sessions').select('*').eq('id', id).maybeSingle()
    if (error) throw new Error(error.message)
    return data ? toSession(data as SessionRow) : null
  },

  async createSession(session) {
    const sb = requireSupabase()
    const uid = await userId()
    const { error } = await sb.from('sessions').insert({
      id: session.id,
      user_id: uid,
      language: session.language,
      kind: session.kind,
      topic_title: session.topicTitle,
      prompt: session.prompt,
      content: session.content,
      improved_text: session.improvedText ?? null,
      audio_path: session.audioPath,
      duration_seconds: session.durationSeconds,
      word_count: session.wordCount,
      corrections: session.corrections,
      scores: session.scores,
      summary: session.summary,
      strengths: session.strengths,
      next_focus: session.nextFocus,
      metrics: session.metrics,
      is_placement: session.isPlacement ?? false,
      estimated_level: session.estimatedLevel ?? null,
      created_at: session.createdAt,
    })
    if (error) throw new Error(error.message)
    return session
  },

  async deleteSession(id) {
    const sb = requireSupabase()
    const { error } = await sb.from('sessions').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  async listLessons() {
    const sb = requireSupabase()
    const rows = check(
      await sb.from('lessons').select('*').order('created_at', { ascending: false }),
    ) as LessonRow[]
    return rows.map(toLesson)
  },

  async getLesson(id) {
    const sb = requireSupabase()
    const { data, error } = await sb.from('lessons').select('*').eq('id', id).maybeSingle()
    if (error) throw new Error(error.message)
    return data ? toLesson(data as LessonRow) : null
  },

  async createLessons(lessons) {
    if (lessons.length === 0) return lessons
    const sb = requireSupabase()
    const uid = await userId()

    // Mirror demoRepo: refresh an existing unfinished lesson for the same
    // weakness instead of stacking near-duplicates.
    const existing = check(
      await sb.from('lessons').select('id, error_type, status').neq('status', 'mastered'),
    ) as { id: string; error_type: string; status: LessonStatus }[]

    const toInsert: Record<string, unknown>[] = []
    for (const lesson of lessons) {
      const match = existing.find((row) => row.error_type === lesson.errorType)
      if (match) {
        // Replace the teaching too, not just the quote: the newer lesson was
        // written against a fresher mistake and brings new exercises. Status
        // and review schedule are deliberately left alone.
        await sb
          .from('lessons')
          .update({
            title: lesson.title,
            body: lesson.body,
            memory_hook: lesson.memoryHook ?? null,
            examples: lesson.examples,
            exercises: lesson.exercises,
            source_sentence: lesson.sourceSentence,
            source_session_id: lesson.sourceSessionId,
            created_at: lesson.createdAt,
          })
          .eq('id', match.id)
      } else {
        toInsert.push({
          id: lesson.id,
          user_id: uid,
          language: lesson.language,
          error_type: lesson.errorType,
          title: lesson.title,
          body: lesson.body,
          memory_hook: lesson.memoryHook ?? null,
          examples: lesson.examples,
          exercises: lesson.exercises,
          source_session_id: lesson.sourceSessionId,
          source_sentence: lesson.sourceSentence,
          status: lesson.status,
          review_box: lesson.reviewBox,
          next_review_at: lesson.nextReviewAt ?? null,
          created_at: lesson.createdAt,
        })
      }
    }
    if (toInsert.length > 0) {
      const { error } = await sb.from('lessons').insert(toInsert)
      if (error) throw new Error(error.message)
    }
    return lessons
  },

  async saveLessonProgress(id, progress) {
    const sb = requireSupabase()
    const { error } = await sb
      .from('lessons')
      .update({
        status: progress.status,
        review_box: progress.reviewBox,
        next_review_at: progress.nextReviewAt,
      })
      .eq('id', id)
    if (error) throw new Error(error.message)
  },

  async listVocabulary() {
    const sb = requireSupabase()
    const rows = check(
      await sb.from('vocabulary').select('*').order('created_at', { ascending: false }),
    ) as VocabRow[]
    return rows.map(toWord)
  },

  async addWord(word) {
    const sb = requireSupabase()
    const uid = await userId()
    const { error } = await sb.from('vocabulary').upsert(
      {
        id: word.id,
        user_id: uid,
        language: word.language,
        word: word.word,
        phonetic: word.phonetic ?? null,
        part_of_speech: word.partOfSpeech ?? null,
        definition: word.definition,
        example: word.example,
        tags: word.tags,
        source: word.source,
        source_id: word.sourceId ?? null,
        srs_box: word.srsBox,
        next_review_at: word.nextReviewAt,
        created_at: word.createdAt,
      },
      // The (user_id, language, word) unique index turns a re-save into a
      // no-op rather than an error the caller has to handle. Language is part
      // of the key so the same spelling can exist in both notebooks.
      { onConflict: 'user_id,language,word', ignoreDuplicates: true },
    )
    if (error) throw new Error(error.message)
    return word
  },

  async updateWord(id, patch) {
    const sb = requireSupabase()
    const row: Record<string, unknown> = {}
    if (patch.word !== undefined) row.word = patch.word
    if (patch.definition !== undefined) row.definition = patch.definition
    if (patch.example !== undefined) row.example = patch.example
    if (patch.tags !== undefined) row.tags = patch.tags
    if (patch.srsBox !== undefined) row.srs_box = patch.srsBox
    if (patch.nextReviewAt !== undefined) row.next_review_at = patch.nextReviewAt
    if (Object.keys(row).length === 0) return
    const { error } = await sb.from('vocabulary').update(row).eq('id', id)
    if (error) throw new Error(error.message)
  },

  async deleteWord(id) {
    const sb = requireSupabase()
    const { error } = await sb.from('vocabulary').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  async reviewWord(id, box, nextReviewAt) {
    const sb = requireSupabase()
    const { error } = await sb
      .from('vocabulary')
      .update({ srs_box: box, next_review_at: nextReviewAt })
      .eq('id', id)
    if (error) throw new Error(error.message)
  },

  async listPodcasts() {
    const sb = requireSupabase()
    const rows = check(
      await sb.from('podcasts').select('*').order('created_at', { ascending: false }),
    ) as PodcastRow[]
    return rows.map(toPodcast)
  },

  async getPodcast(id) {
    const sb = requireSupabase()
    const { data, error } = await sb.from('podcasts').select('*').eq('id', id).maybeSingle()
    if (error) throw new Error(error.message)
    return data ? toPodcast(data as PodcastRow) : null
  },

  async addPodcast(podcast) {
    const sb = requireSupabase()
    const uid = await userId()
    const { error } = await sb.from('podcasts').insert({
      id: podcast.id,
      user_id: uid,
      title: podcast.title,
      url: podcast.url,
      platform: podcast.platform,
      embed_id: podcast.embedId ?? null,
      thumbnail_url: podcast.thumbnailUrl ?? null,
      status: podcast.status,
      progress_seconds: podcast.progressSeconds,
      rating: podcast.rating ?? null,
      created_at: podcast.createdAt,
    })
    if (error) throw new Error(error.message)
    return podcast
  },

  async updatePodcast(id, patch) {
    const sb = requireSupabase()
    const row: Record<string, unknown> = {}
    if (patch.title !== undefined) row.title = patch.title
    if (patch.status !== undefined) row.status = patch.status
    if (patch.progressSeconds !== undefined) row.progress_seconds = patch.progressSeconds
    if (patch.rating !== undefined) row.rating = patch.rating
    if (Object.keys(row).length === 0) return
    const { error } = await sb.from('podcasts').update(row).eq('id', id)
    if (error) throw new Error(error.message)
  },

  async deletePodcast(id) {
    const sb = requireSupabase()
    const { error } = await sb.from('podcasts').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  async listNotes(podcastId) {
    const sb = requireSupabase()
    const rows = check(
      await sb
        .from('podcast_notes')
        .select('*')
        .eq('podcast_id', podcastId)
        .order('timestamp_seconds', { ascending: true, nullsFirst: true }),
    ) as {
      id: string
      podcast_id: string
      timestamp_seconds: number | null
      note: string
      created_at: string
    }[]
    return rows.map((row) => ({
      id: row.id,
      podcastId: row.podcast_id,
      timestampSeconds: row.timestamp_seconds,
      note: row.note,
      createdAt: row.created_at,
    }))
  },

  async addNote(note: PodcastNote) {
    const sb = requireSupabase()
    const uid = await userId()
    const { error } = await sb.from('podcast_notes').insert({
      id: note.id,
      user_id: uid,
      podcast_id: note.podcastId,
      timestamp_seconds: note.timestampSeconds,
      note: note.note,
      created_at: note.createdAt,
    })
    if (error) throw new Error(error.message)
    return note
  },

  async deleteNote(id) {
    const sb = requireSupabase()
    const { error } = await sb.from('podcast_notes').delete().eq('id', id)
    if (error) throw new Error(error.message)
  },

  async listDailyStats(): Promise<DailyStat[]> {
    const sb = requireSupabase()
    const rows = check(
      await sb.from('daily_stats').select('*').order('day', { ascending: true }),
    ) as {
      day: string
      minutes_practiced: number
      words_written: number
      speaking_seconds: number
      words_learned: number
      lessons_completed: number
    }[]
    return rows.map((row) => ({
      day: row.day,
      minutesPracticed: row.minutes_practiced,
      wordsWritten: row.words_written,
      speakingSeconds: row.speaking_seconds,
      wordsLearned: row.words_learned,
      lessonsCompleted: row.lessons_completed,
    }))
  },

  async recordActivity(patch) {
    const sb = requireSupabase()
    // A database-side increment, so two devices on the same day add up instead
    // of overwriting one another.
    const { error } = await sb.rpc('bump_daily_stats', {
      p_minutes: patch.minutesPracticed ?? 0,
      p_words: patch.wordsWritten ?? 0,
      p_speaking: patch.speakingSeconds ?? 0,
      p_learned: patch.wordsLearned ?? 0,
      p_lessons: patch.lessonsCompleted ?? 0,
    })
    if (error) throw new Error(error.message)
  },

  async exportAll() {
    const [profile, sessions, lessons, vocabulary, podcasts, stats] = await Promise.all([
      supabaseRepo.getProfile(),
      supabaseRepo.listSessions(),
      supabaseRepo.listLessons(),
      supabaseRepo.listVocabulary(),
      supabaseRepo.listPodcasts(),
      supabaseRepo.listDailyStats(),
    ])
    return JSON.stringify(
      {
        version: 1,
        exportedAt: new Date().toISOString(),
        data: { profile, sessions, lessons, vocabulary, podcasts, notes: [], stats },
      },
      null,
      2,
    )
  },

  async importAll() {
    // Deliberately unimplemented for the cloud store: a bulk overwrite of
    // synced data is a footgun, and restoring a backup is rare enough to do
    // deliberately rather than behind one button.
    throw new Error(
      'Importing is only available in local mode. Your cloud data is already backed up by Supabase.',
    )
  },

  async clearAll() {
    const sb = requireSupabase()
    const uid = await userId()
    for (const table of [
      'podcast_notes',
      'podcasts',
      'vocabulary',
      'lessons',
      'sessions',
      'daily_stats',
    ]) {
      const { error } = await sb.from(table).delete().eq('user_id', uid)
      if (error) throw new Error(error.message)
    }
  },
}
