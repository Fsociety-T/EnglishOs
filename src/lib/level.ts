import type { CefrLevel, LearningLanguage, LevelEstimate, Severity } from '@/types'
import { CEFR_LEVELS } from '@/types'
import { countWords, sentences, uniqueWordRatio, words } from './text'
import { signalsFor } from './levelSignals'

/**
 * Estimating a CEFR level from one writing sample.
 *
 * The trap this is built to avoid: **fewer mistakes does not mean a higher
 * level.** A beginner writing "I like my job. My job is good." makes no errors
 * at all, while an intermediate learner reaching for "Although I had been
 * working there for years, I would have left" makes two. Score on accuracy
 * alone and the beginner outranks them - which is backwards, and worst for
 * exactly the people who most need placing correctly.
 *
 * So two axes, in this order:
 *
 *   RANGE sets the ceiling - how much language is being reached for at all.
 *   ACCURACY places them inside it - how much of that reach actually lands.
 *
 * Reaching and landing is B2+. Reaching and missing is B1. Not reaching at all
 * caps at A2 no matter how clean the writing is.
 */

const SEVERITY_WEIGHT: Record<Severity, number> = { minor: 1, moderate: 2.5, major: 4 }

/** Enough writing to judge at all. Below this the result is a floor, not a level. */
export const MIN_WORDS_FOR_LEVEL = 120

/** Below this, the sample is too thin to show anything above elementary. */
const VERY_SHORT_WORDS = 60

export interface RangeBreakdown {
  /** 0-100. How much language the learner reaches for. */
  score: number
  meanSentenceLength: number
  sentenceVariety: number
  subordinationPer100: number
  connectivesPer100: number
  lexicalSophistication: number
  /** Names of the grammatical constructions actually attempted. */
  constructionsUsed: string[]
}

function countMatches(text: string, pattern: RegExp): number {
  const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`)
  return (text.match(re) ?? []).length
}

/** Standard deviation, used as a "mixes long and short sentences" signal. */
function stdev(values: number[]): number {
  if (values.length === 0) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  return Math.sqrt(values.reduce((acc, n) => acc + (n - mean) ** 2, 0) / values.length)
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

/** How far the learner reaches, independent of whether they land it. */
export function measureRange(text: string, language: LearningLanguage): RangeBreakdown {
  const signals = signalsFor(language)
  const allWords = words(text)
  const wordCount = allWords.length || 1
  const per100 = (n: number) => (n / wordCount) * 100

  const lengths = sentences(text)
    .map((s) => countWords(s.text))
    .filter((n) => n > 0)
  const meanSentenceLength = lengths.length
    ? lengths.reduce((a, b) => a + b, 0) / lengths.length
    : 0
  const sentenceVariety = stdev(lengths)

  const subordinationPer100 = per100(countMatches(text, signals.subordinators))
  const connectivesPer100 = per100(countMatches(text, signals.connectives))

  // Share of words outside the everyday core vocabulary. A beginner's text is
  // almost entirely core words; range shows up as everything else.
  const uncommon = allWords.filter((w) => !signals.commonWords.has(w.toLowerCase())).length
  const lexicalSophistication = uncommon / wordCount

  const constructionsUsed: string[] = []
  let constructionScore = 0
  for (const c of signals.constructions) {
    if (countMatches(text, c.pattern) > 0) {
      constructionsUsed.push(c.name)
      constructionScore += c.weight
    }
  }

  // Each component is capped before weighting so no single one can carry the
  // whole score - a run-on sentence must not read as sophistication.
  const lengthPoints = clamp((meanSentenceLength - 6) * 2.4, 0, 21)
  const varietyPoints = clamp(sentenceVariety * 1.4, 0, 9)
  const subordinationPoints = clamp(subordinationPer100 * 1.9, 0, 17)
  const connectivePoints = clamp(connectivesPer100 * 4.5, 0, 8)
  const lexicalPoints = clamp((lexicalSophistication - 0.34) * 95, 0, 13)
  const constructionPoints = clamp(constructionScore * 1.8, 0, 24)
  const varietyOfWords = clamp((uniqueWordRatio(text) - 0.45) * 20, 0, 4)

  const score = clamp(
    lengthPoints +
      varietyPoints +
      subordinationPoints +
      connectivePoints +
      lexicalPoints +
      constructionPoints +
      varietyOfWords,
    0,
    100,
  )

  return {
    score,
    meanSentenceLength,
    sentenceVariety,
    subordinationPer100,
    connectivesPer100,
    lexicalSophistication,
    constructionsUsed,
  }
}

/** Severity-weighted errors per 100 words. */
export function errorRate(
  corrections: { severity: Severity }[],
  wordCount: number,
): number {
  if (wordCount === 0) return 0
  const weighted = corrections.reduce((sum, c) => sum + SEVERITY_WEIGHT[c.severity], 0)
  return (weighted / wordCount) * 100
}

/** Range score to the highest band that range alone could support. */
function ceilingFromRange(range: number): CefrLevel {
  if (range < 14) return 'A1'
  if (range < 30) return 'A2'
  if (range < 50) return 'B1'
  if (range < 74) return 'B2'
  if (range < 90) return 'C1'
  return 'C2'
}

function shift(level: CefrLevel, by: number): CefrLevel {
  const index = CEFR_LEVELS.indexOf(level)
  return CEFR_LEVELS[clamp(index + by, 0, CEFR_LEVELS.length - 1)]
}

/**
 * How far accuracy drags the ceiling down.
 *
 * The thresholds are deliberately generous at the top: a B2 writer attempting
 * hard structures is *expected* to make mistakes, and punishing that would
 * recreate the very bias this function exists to avoid.
 */
function accuracyPenalty(rate: number): number {
  if (rate <= 8) return 0
  if (rate <= 16) return 1
  return 2
}

/**
 * The floor a learner cannot fall below, given what they reached for.
 *
 * Attempting a past conditional and getting it wrong is still evidence you
 * know the structure exists - it is not the same as never attempting one.
 * Without this floor, a B2-range writer having a bad day drops to A1, which
 * is the accuracy-only bias re-entering through the back door.
 */
function floorFromRange(ceiling: CefrLevel): CefrLevel {
  const index = CEFR_LEVELS.indexOf(ceiling)
  if (index >= CEFR_LEVELS.indexOf('B2')) return 'B1'
  if (index >= CEFR_LEVELS.indexOf('B1')) return 'A2'
  return 'A1'
}

export interface EstimateInput {
  text: string
  corrections: { severity: Severity }[]
  language: LearningLanguage
}

/**
 * The offline estimate. Deterministic, and the fallback whenever the AI
 * reviewer is not configured.
 */
export function estimateLevel({ text, corrections, language }: EstimateInput): LevelEstimate {
  const wordCount = countWords(text)
  const range = measureRange(text, language)
  const rate = errorRate(corrections, wordCount)

  const ceiling = ceilingFromRange(range.score)
  const floor = floorFromRange(ceiling)
  let level = shift(ceiling, -accuracyPenalty(rate))
  if (CEFR_LEVELS.indexOf(level) < CEFR_LEVELS.indexOf(floor)) level = floor

  // Length caps the ceiling. Nobody demonstrates C1 in forty words: there is
  // simply not enough text to have shown the range, so the honest answer is a
  // floor rather than a level.
  const conclusive = wordCount >= MIN_WORDS_FOR_LEVEL
  if (wordCount < VERY_SHORT_WORDS) {
    level = CEFR_LEVELS[Math.min(CEFR_LEVELS.indexOf(level), CEFR_LEVELS.indexOf('A2'))]
  } else if (!conclusive) {
    level = CEFR_LEVELS[Math.min(CEFR_LEVELS.indexOf(level), CEFR_LEVELS.indexOf('B1'))]
  }

  const confidence: LevelEstimate['confidence'] = !conclusive
    ? 'low'
    : wordCount >= 200 && corrections.length >= 2
      ? 'high'
      : 'medium'

  return {
    level,
    confidence,
    conclusive,
    evidence: buildEvidence(range, rate, wordCount, language),
  }
}

/**
 * Why the estimate came out where it did, in the learner's language.
 *
 * Shown on the result screen so a surprising level can be argued with rather
 * than just accepted.
 */
function buildEvidence(
  range: RangeBreakdown,
  rate: number,
  wordCount: number,
  language: LearningLanguage,
): string[] {
  const out: string[] = []
  const fr = language === 'fr'

  out.push(
    fr
      ? `${wordCount} mots écrits, phrases de ${Math.round(range.meanSentenceLength)} mots en moyenne.`
      : `${wordCount} words written, averaging ${Math.round(range.meanSentenceLength)} words per sentence.`,
  )

  if (range.constructionsUsed.length > 0) {
    const list = range.constructionsUsed.slice(0, 4).join(', ')
    out.push(
      fr
        ? `Structures utilisées : ${list}.`
        : `Structures attempted: ${list}.`,
    )
  } else {
    out.push(
      fr
        ? 'Peu de structures complexes tentées - surtout des phrases simples.'
        : 'Few complex structures attempted - mostly simple sentences.',
    )
  }

  if (range.subordinationPer100 >= 4) {
    out.push(
      fr
        ? 'Vous reliez vos idées avec des subordonnées plutôt que de juxtaposer des phrases courtes.'
        : 'You join ideas with subordinate clauses rather than stacking short sentences.',
    )
  }

  out.push(
    fr
      ? `Précision : environ ${rate.toFixed(1)} erreurs pondérées pour 100 mots.`
      : `Accuracy: about ${rate.toFixed(1)} weighted errors per 100 words.`,
  )

  return out
}
