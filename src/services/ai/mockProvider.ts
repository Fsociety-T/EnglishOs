import type { Correction, ErrorType, Scores, Severity } from '@/types'
import { ERROR_TYPE_LABEL } from '@/types'
import { countWords, paceScore, sentenceAt, sentences, uniqueWordRatio, words } from '@/lib/text'
import { clamp, newId } from '@/lib/utils'
import { LESSON_LIBRARY } from './lessonLibrary'
import { RULES } from './rules'
import type {
  AiProvider,
  CorrectionDraft,
  LessonDraft,
  Review,
  ReviewSpeakingInput,
  ReviewWritingInput,
  VocabSuggestion,
} from './types'

const SEVERITY_WEIGHT: Record<Severity, number> = { minor: 1, moderate: 2.5, major: 4 }

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Run every rule over the text and keep non-overlapping matches.
 * Offsets are genuine positions in the learner's text, which is what lets the
 * correction view highlight inline and scroll to a specific mistake.
 */
function scan(text: string): CorrectionDraft[] {
  const found: CorrectionDraft[] = []

  for (const rule of RULES) {
    // Fresh regex per scan so a shared `lastIndex` can never skip matches.
    const re = new RegExp(rule.pattern.source, rule.pattern.flags)
    for (const match of text.matchAll(re)) {
      if (match.index === undefined) continue
      const original = match[0]
      let corrected: string
      try {
        corrected = rule.fix(match)
      } catch {
        continue
      }
      if (!corrected || corrected === original) continue
      found.push({
        original,
        corrected,
        explanation: rule.explanation,
        errorType: rule.errorType,
        severity: rule.severity,
        charStart: match.index,
        charEnd: match.index + original.length,
      })
    }
  }

  // Earliest first; on a tie prefer the longer match. Then drop overlaps so
  // two rules never both claim the same characters.
  found.sort((a, b) => a.charStart - b.charStart || b.charEnd - a.charEnd)
  const kept: CorrectionDraft[] = []
  let lastEnd = -1
  for (const candidate of found) {
    if (candidate.charStart >= lastEnd) {
      kept.push(candidate)
      lastEnd = candidate.charEnd
    }
  }
  return kept
}

/** Apply corrections back-to-front so earlier offsets stay valid. */
function applyCorrections(text: string, corrections: CorrectionDraft[]): string {
  let out = text
  for (let i = corrections.length - 1; i >= 0; i--) {
    const c = corrections[i]
    out = out.slice(0, c.charStart) + c.corrected + out.slice(c.charEnd)
  }
  return out
}

function grammarScore(corrections: CorrectionDraft[], wordCount: number): number {
  if (wordCount === 0) return 0
  const weighted = corrections.reduce((sum, c) => sum + SEVERITY_WEIGHT[c.severity], 0)
  const per100Words = (weighted / wordCount) * 100
  return Math.round(clamp(100 - per100Words * 6, 15, 100))
}

function vocabularyScore(text: string): number {
  const all = words(text)
  if (all.length === 0) return 0
  const ratio = uniqueWordRatio(text)
  const avgLength = all.join('').length / all.length
  return Math.round(clamp(ratio * 85 + (avgLength - 3.2) * 14, 20, 100))
}

/** For writing there is no audio, so "fluency" means sentence rhythm. */
function writingFlowScore(text: string): number {
  const parts = sentences(text)
  const lengths = parts.map((s) => countWords(s.text)).filter((n) => n > 0)
  if (lengths.length === 0) return 0
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length
  const sd = Math.sqrt(lengths.reduce((acc, n) => acc + (n - avg) ** 2, 0) / lengths.length)
  const lengthScore = 100 - Math.abs(avg - 15) * 4 // most readable around 15 words
  const varietyScore = clamp(sd * 8, 0, 100) // mixing long and short reads better
  return Math.round(clamp(lengthScore * 0.7 + varietyScore * 0.3, 20, 100))
}

function buildSummary(
  scores: Scores,
  corrections: CorrectionDraft[],
  wordCount: number,
  kind: 'writing' | 'speaking',
): string {
  const verb = kind === 'writing' ? 'wrote' : 'spoke'
  if (wordCount < 20) {
    return `That was quite short, so there was not much to work with. Try for at least 80 words next time - longer answers give you far more to learn from.`
  }
  if (corrections.length === 0) {
    return `You ${verb} ${wordCount} words with no clear mistakes found. That is genuinely good. Push yourself with a harder topic or longer sentences to find your next edge.`
  }
  const topType = mostCommonType(corrections)
  return `You ${verb} ${wordCount} words and made ${corrections.length} ${
    corrections.length === 1 ? 'mistake' : 'mistakes'
  }. Most of them were about ${ERROR_TYPE_LABEL[topType].toLowerCase()}, so that is the single thing worth fixing first.`
}

function mostCommonType(corrections: CorrectionDraft[]): ErrorType {
  const counts = new Map<ErrorType, number>()
  for (const c of corrections) counts.set(c.errorType, (counts.get(c.errorType) ?? 0) + 1)
  let best: ErrorType = 'other'
  let bestCount = -1
  for (const [type, count] of counts) {
    if (count > bestCount) {
      best = type
      bestCount = count
    }
  }
  return best
}

function buildStrengths(scores: Scores, wordCount: number, corrections: CorrectionDraft[]): string[] {
  const out: string[] = []
  if (wordCount >= 120) out.push(`You produced ${wordCount} words - good stamina.`)
  if (scores.vocabulary >= 70) out.push('Your word choice is varied rather than repetitive.')
  if (scores.grammar >= 80) out.push('Your grammar is accurate for the length you wrote.')
  if (scores.fluency >= 70) out.push('Your sentences flow at a natural rhythm.')
  if (!corrections.some((c) => c.severity === 'major')) {
    out.push('No serious errors - nothing here would confuse a listener.')
  }
  if (out.length === 0) out.push('You finished the task, which is the hardest part. Keep going.')
  return out.slice(0, 3)
}

function buildNextFocus(corrections: CorrectionDraft[]): string[] {
  const counts = new Map<ErrorType, number>()
  for (const c of corrections) counts.set(c.errorType, (counts.get(c.errorType) ?? 0) + 1)
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type, count]) => `${ERROR_TYPE_LABEL[type]} - ${count} ${count === 1 ? 'time' : 'times'}`)
}

/** Useful mid-level words to grow into, rather than words already used. */
const VOCAB_BANK: VocabSuggestion[] = [
  { word: 'nevertheless', partOfSpeech: 'adverb', phonetic: '/ˌnevəðəˈles/', definition: 'In spite of that; however.', example: 'It was raining. Nevertheless, we went out.' },
  { word: 'crucial', partOfSpeech: 'adjective', phonetic: '/ˈkruːʃl/', definition: 'Extremely important.', example: 'Sleep is crucial for learning.' },
  { word: 'gradually', partOfSpeech: 'adverb', phonetic: '/ˈɡrædʒuəli/', definition: 'Slowly, over a period of time.', example: 'My English improved gradually.' },
  { word: 'reluctant', partOfSpeech: 'adjective', phonetic: '/rɪˈlʌktənt/', definition: 'Not willing to do something.', example: 'He was reluctant to speak in public.' },
  { word: 'overwhelming', partOfSpeech: 'adjective', phonetic: '/ˌəʊvəˈwelmɪŋ/', definition: 'Very great; too much to deal with.', example: 'The support was overwhelming.' },
  { word: 'straightforward', partOfSpeech: 'adjective', phonetic: '/ˌstreɪtˈfɔːwəd/', definition: 'Easy to understand; simple.', example: 'The instructions were straightforward.' },
  { word: 'thorough', partOfSpeech: 'adjective', phonetic: '/ˈθʌrə/', definition: 'Complete, with attention to detail.', example: 'She did a thorough job.' },
  { word: 'inevitable', partOfSpeech: 'adjective', phonetic: '/ɪnˈevɪtəbl/', definition: 'Certain to happen; unavoidable.', example: 'Making mistakes is inevitable when learning.' },
  { word: 'consistent', partOfSpeech: 'adjective', phonetic: '/kənˈsɪstənt/', definition: 'Always behaving in the same way.', example: 'Consistent practice beats talent.' },
  { word: 'insight', partOfSpeech: 'noun', phonetic: '/ˈɪnsaɪt/', definition: 'A clear, deep understanding of something.', example: 'The book gave me insight into the problem.' },
  { word: 'endeavour', partOfSpeech: 'noun', phonetic: '/ɪnˈdevə/', definition: 'A serious effort or attempt.', example: 'Learning a language is a long endeavour.' },
  { word: 'compelling', partOfSpeech: 'adjective', phonetic: '/kəmˈpelɪŋ/', definition: 'So interesting that it holds your attention.', example: 'She made a compelling argument.' },
  { word: 'ambiguous', partOfSpeech: 'adjective', phonetic: '/æmˈbɪɡjuəs/', definition: 'Having more than one possible meaning.', example: 'His answer was ambiguous.' },
  { word: 'resilient', partOfSpeech: 'adjective', phonetic: '/rɪˈzɪliənt/', definition: 'Able to recover quickly from difficulty.', example: 'Learners need to be resilient.' },
  { word: 'substantial', partOfSpeech: 'adjective', phonetic: '/səbˈstænʃl/', definition: 'Large in size, value or importance.', example: 'She made substantial progress.' },
  { word: 'presumably', partOfSpeech: 'adverb', phonetic: '/prɪˈzjuːməbli/', definition: 'Probably; as far as one can guess.', example: 'Presumably he missed the train.' },
  { word: 'undertake', partOfSpeech: 'verb', phonetic: '/ˌʌndəˈteɪk/', definition: 'To start and take responsibility for something.', example: 'They undertook a difficult project.' },
  { word: 'perceive', partOfSpeech: 'verb', phonetic: '/pəˈsiːv/', definition: 'To notice or understand something.', example: 'I perceive a change in his attitude.' },
  { word: 'emphasise', partOfSpeech: 'verb', phonetic: '/ˈemfəsaɪz/', definition: 'To give special importance to something.', example: 'I want to emphasise this point.' },
  { word: 'accomplish', partOfSpeech: 'verb', phonetic: '/əˈkʌmplɪʃ/', definition: 'To succeed in doing something.', example: 'She accomplished all her goals.' },
  { word: 'tremendous', partOfSpeech: 'adjective', phonetic: '/trəˈmendəs/', definition: 'Very great in amount or quality.', example: 'He made a tremendous effort.' },
  { word: 'articulate', partOfSpeech: 'verb', phonetic: '/ɑːˈtɪkjuleɪt/', definition: 'To express an idea clearly in words.', example: 'She articulated her point well.' },
  { word: 'diminish', partOfSpeech: 'verb', phonetic: '/dɪˈmɪnɪʃ/', definition: 'To become or make smaller or weaker.', example: 'My accent diminished over time.' },
  { word: 'plausible', partOfSpeech: 'adjective', phonetic: '/ˈplɔːzəbl/', definition: 'Seeming reasonable or probably true.', example: 'That is a plausible explanation.' },
]

function pickVocabulary(text: string, count = 5): VocabSuggestion[] {
  const used = new Set(words(text).map((w) => w.toLowerCase()))
  const candidates = VOCAB_BANK.filter((v) => !used.has(v.word.toLowerCase()))
  // Deterministic-ish rotation seeded by text length, so re-reviewing the same
  // session does not shuffle the suggestions around.
  const start = text.length % Math.max(1, candidates.length)
  const rotated = [...candidates.slice(start), ...candidates.slice(0, start)]
  return rotated.slice(0, count)
}

function review(
  text: string,
  kind: 'writing' | 'speaking',
  fluency: number,
): Review {
  const corrections = scan(text)
  const wordCount = countWords(text)
  const scores: Scores = {
    grammar: grammarScore(corrections, wordCount),
    vocabulary: vocabularyScore(text),
    fluency,
    overall: 0,
  }
  scores.overall = Math.round(
    scores.grammar * 0.5 + scores.vocabulary * 0.25 + scores.fluency * 0.25,
  )

  return {
    correctedText: applyCorrections(text, corrections),
    corrections,
    scores,
    summary: buildSummary(scores, corrections, wordCount, kind),
    strengths: buildStrengths(scores, wordCount, corrections),
    nextFocus: buildNextFocus(corrections),
  }
}

/**
 * The provider used until Phase 11 connects the real Claude API.
 *
 * `isReal` is false so the UI can label this feedback honestly - it finds real
 * mistakes, but it only knows the patterns in rules.ts and will miss plenty
 * that a real model would catch.
 */
export const mockProvider: AiProvider = {
  name: 'Practice engine (offline)',
  isReal: false,

  async reviewWriting({ text }: ReviewWritingInput): Promise<Review> {
    await delay(900)
    return review(text, 'writing', writingFlowScore(text))
  },

  async reviewSpeaking({ transcript, metrics }: ReviewSpeakingInput): Promise<Review> {
    await delay(900)
    const wordCount = Math.max(1, countWords(transcript))
    const fillerPenalty = (metrics.fillerCount / wordCount) * 100 * 3.5
    const fluency = Math.round(
      clamp(
        paceScore(metrics.wordsPerMinute) * 0.7 +
          metrics.uniqueWordRatio * 100 * 0.3 -
          fillerPenalty,
        10,
        100,
      ),
    )
    return review(transcript, 'speaking', fluency)
  },

  async generateLessons({
    corrections,
    sourceText,
  }: {
    corrections: Correction[]
    sourceText?: string
  }): Promise<LessonDraft[]> {
    await delay(500)

    // Most frequent mistake first - that is where practice pays off most.
    const byType = new Map<ErrorType, Correction[]>()
    for (const c of corrections) {
      const list = byType.get(c.errorType) ?? []
      list.push(c)
      byType.set(c.errorType, list)
    }

    return [...byType.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 3)
      .map(([errorType, group]) => {
        const template = LESSON_LIBRARY[errorType]
        const first = group[0]
        return {
          errorType,
          title: template.title,
          body: template.body,
          examples: template.examples,
          exercises: template.exercises.map((e) => ({ ...e, id: newId('ex') })),
          sourceSessionId: first?.sessionId ?? null,
          sourceSentence: sourceText
            ? sentenceAt(sourceText, first?.charStart ?? 0)
            : (first?.original ?? null),
        }
      })
  },

  async suggestVocabulary({ text }: { text: string }): Promise<VocabSuggestion[]> {
    await delay(400)
    return pickVocabulary(text)
  },
}
