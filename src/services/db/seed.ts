import type { Store } from './demoRepo'
import { lessonTemplate } from '@/services/ai/lessonLibrary'
import { localDay, newId } from '@/lib/utils'
import { countWords } from '@/lib/text'

/**
 * A small amount of believable history so the dashboard, charts and lists have
 * something to show on a first visit instead of five empty screens.
 * Cleared by Settings -> Reset.
 */

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function dayKey(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return localDay(d)
}

const SAMPLE_TEXT =
  "Last weekend i went to the market with my brother. We didn't went there for a long time, so it was nice. There is many small shops and the people is very friendly. My brother is good in finding cheap things, and he always make a photo of everything. I bought alot of fruit and some informations about a cooking class. It depends of my schedule, but i want to join it. I have 24 years and i think learning new things is crucial."

export function seedStore(store: Store): Store {
  const sessionId = newId()
  const content = SAMPLE_TEXT

  // Offsets are approximate here on purpose - this is illustrative history, not
  // a graded session. Real sessions get exact offsets from the rule scanner.
  const corrections = [
    {
      id: newId(),
      sessionId,
      original: 'i went',
      corrected: 'I went',
      explanation: 'The pronoun "I" is always a capital letter.',
      errorType: 'spelling' as const,
      severity: 'minor' as const,
      charStart: content.indexOf('i went'),
      charEnd: content.indexOf('i went') + 6,
    },
    {
      id: newId(),
      sessionId,
      original: "didn't went",
      corrected: "didn't go",
      explanation: 'After "didn\'t" the verb goes back to its base form.',
      errorType: 'verb-tense' as const,
      severity: 'major' as const,
      charStart: content.indexOf("didn't went"),
      charEnd: content.indexOf("didn't went") + 11,
    },
    {
      id: newId(),
      sessionId,
      original: 'There is many',
      corrected: 'There are many',
      explanation: 'Use "there are" before plural nouns.',
      errorType: 'subject-verb-agreement' as const,
      severity: 'moderate' as const,
      charStart: content.indexOf('There is many'),
      charEnd: content.indexOf('There is many') + 13,
    },
    {
      id: newId(),
      sessionId,
      original: 'people is',
      corrected: 'people are',
      explanation: '"People" is already plural, so it takes "are".',
      errorType: 'subject-verb-agreement' as const,
      severity: 'major' as const,
      charStart: content.indexOf('people is'),
      charEnd: content.indexOf('people is') + 9,
    },
    {
      id: newId(),
      sessionId,
      original: 'good in',
      corrected: 'good at',
      explanation: 'Use "good at" for skills.',
      errorType: 'preposition' as const,
      severity: 'moderate' as const,
      charStart: content.indexOf('good in'),
      charEnd: content.indexOf('good in') + 7,
    },
    {
      id: newId(),
      sessionId,
      original: 'depends of',
      corrected: 'depends on',
      explanation: 'The fixed pair is "depend on".',
      errorType: 'preposition' as const,
      severity: 'moderate' as const,
      charStart: content.indexOf('depends of'),
      charEnd: content.indexOf('depends of') + 10,
    },
  ]

  store.sessions = [
    {
      id: sessionId,
      language: 'en' as const,
      kind: 'writing',
      topicTitle: 'A place you visited recently',
      prompt: 'Describe a place you went to recently. Who were you with, and what happened?',
      content,
      durationSeconds: 480,
      wordCount: countWords(content),
      corrections,
      scores: { overall: 71, grammar: 64, vocabulary: 76, fluency: 80 },
      summary:
        'You wrote 86 words and made 6 mistakes. Most of them were about prepositions and agreement, so that is the thing worth fixing first.',
      strengths: [
        'Your sentences flow at a natural rhythm.',
        'Your word choice is varied rather than repetitive.',
      ],
      nextFocus: ['Prepositions - 2 times', 'Subject-verb agreement - 2 times'],
      createdAt: daysAgo(2),
    },
  ]

  store.lessons = (['preposition', 'subject-verb-agreement'] as const).map((errorType, i) => {
    const template = lessonTemplate('en', errorType)
    return {
      id: newId(),
      language: 'en' as const,
      errorType,
      title: template.title,
      body: template.body,
      memoryHook: template.memoryHook,
      examples: template.examples,
      exercises: template.exercises.map((e) => ({ ...e, id: newId() })),
      reviewBox: 1 as const,
      nextReviewAt: null,
      sourceSessionId: sessionId,
      sourceSentence:
        i === 0
          ? 'My brother is good in finding cheap things.'
          : 'There is many small shops and the people is very friendly.',
      status: i === 0 ? ('new' as const) : ('learning' as const),
      createdAt: daysAgo(2),
    }
  })

  store.vocabulary = [
    {
      id: newId(),
      language: 'en' as const,
      word: 'crucial',
      phonetic: '/ˈkruːʃl/',
      partOfSpeech: 'adjective',
      definition: 'Extremely important.',
      example: 'Sleep is crucial for learning.',
      tags: ['from writing'],
      source: 'writing',
      sourceId: sessionId,
      srsBox: 2,
      nextReviewAt: daysAgo(-1),
      createdAt: daysAgo(2),
    },
    {
      id: newId(),
      language: 'en' as const,
      word: 'gradually',
      phonetic: '/ˈɡrædʒuəli/',
      partOfSpeech: 'adverb',
      definition: 'Slowly, over a period of time.',
      example: 'My English improved gradually.',
      tags: [],
      source: 'manual',
      srsBox: 1,
      nextReviewAt: daysAgo(0),
      createdAt: daysAgo(1),
    },
    {
      id: newId(),
      language: 'en' as const,
      word: 'resilient',
      phonetic: '/rɪˈzɪliənt/',
      partOfSpeech: 'adjective',
      definition: 'Able to recover quickly from difficulty.',
      example: 'Learners need to be resilient.',
      tags: ['podcast'],
      source: 'podcast',
      srsBox: 1,
      nextReviewAt: daysAgo(0),
      createdAt: daysAgo(1),
    },
  ]

  store.podcasts = [
    {
      id: newId(),
      title: 'How to learn any language faster',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      platform: 'youtube',
      embedId: 'dQw4w9WgXcQ',
      thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      status: 'to-watch',
      progressSeconds: 0,
      createdAt: daysAgo(3),
    },
  ]

  // A week with one rest day, so the streak and heatmap have a realistic shape.
  store.stats = [
    { ago: 6, minutesPracticed: 12, wordsWritten: 90, speakingSeconds: 0, wordsLearned: 2, lessonsCompleted: 0 },
    { ago: 4, minutesPracticed: 25, wordsWritten: 140, speakingSeconds: 180, wordsLearned: 3, lessonsCompleted: 1 },
    { ago: 2, minutesPracticed: 18, wordsWritten: 86, speakingSeconds: 0, wordsLearned: 1, lessonsCompleted: 0 },
    { ago: 1, minutesPracticed: 30, wordsWritten: 210, speakingSeconds: 240, wordsLearned: 4, lessonsCompleted: 1 },
    { ago: 0, minutesPracticed: 8, wordsWritten: 40, speakingSeconds: 0, wordsLearned: 1, lessonsCompleted: 0 },
  ].map(({ ago, ...rest }) => ({ day: dayKey(ago), ...rest }))

  return store
}
