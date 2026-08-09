import type { Correction, ErrorType, LearningLanguage, Scores, Severity } from '@/types'
import { ERROR_TYPE_LABEL } from '@/types'
import { countWords, paceScore, sentenceAt, sentences, uniqueWordRatio, words } from '@/lib/text'
import { clamp, newId } from '@/lib/utils'
import { lessonTemplate } from './lessonLibrary'
import { RULES } from './rules'
import { FR_RULES } from './rulesFr'
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
const RULES_BY_LANGUAGE: Record<LearningLanguage, typeof RULES> = { en: RULES, fr: FR_RULES }

function scan(text: string, language: LearningLanguage): CorrectionDraft[] {
  const found: CorrectionDraft[] = []

  for (const rule of RULES_BY_LANGUAGE[language]) {
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
  corrections: CorrectionDraft[],
  wordCount: number,
  kind: 'writing' | 'speaking',
  language: LearningLanguage,
): string {
  if (language === 'fr') {
    const verbe = kind === 'writing' ? 'écrit' : 'dit'
    if (wordCount < 20) {
      return 'C’était assez court, il y avait donc peu de matière. Visez au moins 80 mots la prochaine fois : les réponses longues vous apprennent bien plus.'
    }
    if (corrections.length === 0) {
      return `Vous avez ${verbe} ${wordCount} mots sans erreur manifeste. C’est vraiment bien. Prenez un sujet plus difficile ou des phrases plus longues pour trouver votre prochaine limite.`
    }
    const type = ERROR_TYPE_LABEL.fr[mostCommonType(corrections)].toLowerCase()
    return `Vous avez ${verbe} ${wordCount} mots et fait ${corrections.length} ${
      corrections.length === 1 ? 'erreur' : 'erreurs'
    }. La plupart concernent ${type} : c’est le point à corriger en premier.`
  }

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
  }. Most of them were about ${ERROR_TYPE_LABEL.en[topType].toLowerCase()}, so that is the single thing worth fixing first.`
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

function buildStrengths(
  scores: Scores,
  wordCount: number,
  corrections: CorrectionDraft[],
  language: LearningLanguage,
): string[] {
  const out: string[] = []
  const noMajor = !corrections.some((c) => c.severity === 'major')

  if (language === 'fr') {
    if (wordCount >= 120) out.push(`Vous avez produit ${wordCount} mots : belle endurance.`)
    if (scores.vocabulary >= 70) out.push('Votre vocabulaire est varié plutôt que répétitif.')
    if (scores.grammar >= 80) out.push('Votre grammaire est correcte pour cette longueur.')
    if (scores.fluency >= 70) out.push('Vos phrases ont un rythme naturel.')
    if (noMajor) out.push('Aucune erreur grave : rien ici ne gênerait la compréhension.')
    if (out.length === 0) {
      out.push('Vous êtes allé au bout de l’exercice, c’est le plus difficile. Continuez.')
    }
    return out.slice(0, 3)
  }

  if (wordCount >= 120) out.push(`You produced ${wordCount} words - good stamina.`)
  if (scores.vocabulary >= 70) out.push('Your word choice is varied rather than repetitive.')
  if (scores.grammar >= 80) out.push('Your grammar is accurate for the length you wrote.')
  if (scores.fluency >= 70) out.push('Your sentences flow at a natural rhythm.')
  if (noMajor) out.push('No serious errors - nothing here would confuse a listener.')
  if (out.length === 0) out.push('You finished the task, which is the hardest part. Keep going.')
  return out.slice(0, 3)
}

function buildNextFocus(corrections: CorrectionDraft[], language: LearningLanguage): string[] {
  const counts = new Map<ErrorType, number>()
  for (const c of corrections) counts.set(c.errorType, (counts.get(c.errorType) ?? 0) + 1)
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type, count]) => {
      const label = ERROR_TYPE_LABEL[language][type]
      if (language === 'fr') return `${label} - ${count} fois`
      return `${label} - ${count} ${count === 1 ? 'time' : 'times'}`
    })
}

/** Useful mid-level words to grow into, rather than words already used. */
const EN_VOCAB: VocabSuggestion[] = [
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

/**
 * The French bank is defined in French, definitions included: a learner at
 * this level gains more from a French definition than from a translation.
 */
const FR_VOCAB: VocabSuggestion[] = [
  { word: 'néanmoins', partOfSpeech: 'adverbe', phonetic: '/ne.ɑ̃.mwɛ̃/', definition: 'Malgré cela ; pourtant.', example: 'Il pleuvait. Néanmoins, nous sommes sortis.' },
  { word: 'crucial', partOfSpeech: 'adjectif', phonetic: '/kʁy.sjal/', definition: 'Extrêmement important.', example: 'Le sommeil est crucial pour apprendre.' },
  { word: 'progressivement', partOfSpeech: 'adverbe', phonetic: '/pʁɔ.ɡʁɛ.siv.mɑ̃/', definition: 'Petit à petit, au fil du temps.', example: 'Mon français s’est amélioré progressivement.' },
  { word: 'réticent', partOfSpeech: 'adjectif', phonetic: '/ʁe.ti.sɑ̃/', definition: 'Qui hésite à faire quelque chose.', example: 'Il était réticent à parler en public.' },
  { word: 'accablant', partOfSpeech: 'adjectif', phonetic: '/a.ka.blɑ̃/', definition: 'Très lourd à supporter.', example: 'La chaleur était accablante.' },
  { word: 'simple', partOfSpeech: 'adjectif', phonetic: '/sɛ̃pl/', definition: 'Facile à comprendre, sans complication.', example: 'Les instructions étaient simples.' },
  { word: 'minutieux', partOfSpeech: 'adjectif', phonetic: '/mi.ny.sjø/', definition: 'Qui fait attention aux moindres détails.', example: 'Elle a fait un travail minutieux.' },
  { word: 'inévitable', partOfSpeech: 'adjectif', phonetic: '/i.ne.vi.tabl/', definition: 'Qui ne peut pas être évité.', example: 'Faire des erreurs est inévitable quand on apprend.' },
  { word: 'constant', partOfSpeech: 'adjectif', phonetic: '/kɔ̃s.tɑ̃/', definition: 'Qui ne change pas, régulier.', example: 'Un effort constant vaut mieux que le talent.' },
  { word: 'aperçu', partOfSpeech: 'nom', phonetic: '/a.pɛʁ.sy/', definition: 'Une vue rapide et générale de quelque chose.', example: 'Le livre donne un bon aperçu du problème.' },
  { word: 'démarche', partOfSpeech: 'nom', phonetic: '/de.maʁʃ/', definition: 'Une manière de procéder, un effort organisé.', example: 'Apprendre une langue est une longue démarche.' },
  { word: 'convaincant', partOfSpeech: 'adjectif', phonetic: '/kɔ̃.vɛ̃.kɑ̃/', definition: 'Qui persuade, qui emporte l’adhésion.', example: 'Elle a présenté un argument convaincant.' },
  { word: 'ambigu', partOfSpeech: 'adjectif', phonetic: '/ɑ̃.bi.ɡy/', definition: 'Qui peut avoir plusieurs sens.', example: 'Sa réponse était ambiguë.' },
  { word: 'résilient', partOfSpeech: 'adjectif', phonetic: '/ʁe.zi.ljɑ̃/', definition: 'Capable de se remettre vite d’une difficulté.', example: 'Un apprenant doit être résilient.' },
  { word: 'considérable', partOfSpeech: 'adjectif', phonetic: '/kɔ̃.si.de.ʁabl/', definition: 'Important par la taille ou la valeur.', example: 'Elle a fait des progrès considérables.' },
  { word: 'vraisemblablement', partOfSpeech: 'adverbe', phonetic: '/vʁɛ.sɑ̃.bla.blə.mɑ̃/', definition: 'Probablement, selon toute apparence.', example: 'Il a vraisemblablement raté son train.' },
  { word: 'entreprendre', partOfSpeech: 'verbe', phonetic: '/ɑ̃.tʁə.pʁɑ̃dʁ/', definition: 'Commencer quelque chose et s’en charger.', example: 'Ils ont entrepris un projet difficile.' },
  { word: 'percevoir', partOfSpeech: 'verbe', phonetic: '/pɛʁ.sə.vwaʁ/', definition: 'Remarquer ou comprendre quelque chose.', example: 'Je perçois un changement dans son attitude.' },
  { word: 'souligner', partOfSpeech: 'verbe', phonetic: '/su.li.ɲe/', definition: 'Insister sur l’importance de quelque chose.', example: 'Je voudrais souligner ce point.' },
  { word: 'accomplir', partOfSpeech: 'verbe', phonetic: '/a.kɔ̃.pliʁ/', definition: 'Réussir à faire quelque chose.', example: 'Elle a accompli tous ses objectifs.' },
  { word: 'formidable', partOfSpeech: 'adjectif', phonetic: '/fɔʁ.mi.dabl/', definition: 'Très grand, remarquable.', example: 'Il a fait un effort formidable.' },
  { word: 'exprimer', partOfSpeech: 'verbe', phonetic: '/ɛk.spʁi.me/', definition: 'Dire clairement une idée avec des mots.', example: 'Elle a bien exprimé son point de vue.' },
  { word: 'diminuer', partOfSpeech: 'verbe', phonetic: '/di.mi.nɥe/', definition: 'Devenir ou rendre plus petit, plus faible.', example: 'Mon accent a diminué avec le temps.' },
  { word: 'plausible', partOfSpeech: 'adjectif', phonetic: '/plo.zibl/', definition: 'Qui semble raisonnable ou probablement vrai.', example: 'C’est une explication plausible.' },
]

const VOCAB_BY_LANGUAGE: Record<LearningLanguage, VocabSuggestion[]> = { en: EN_VOCAB, fr: FR_VOCAB }

function pickVocabulary(text: string, language: LearningLanguage, count = 5): VocabSuggestion[] {
  const used = new Set(words(text).map((w) => w.toLowerCase()))
  const candidates = VOCAB_BY_LANGUAGE[language].filter((v) => !used.has(v.word.toLowerCase()))
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
  language: LearningLanguage,
): Review {
  const corrections = scan(text, language)
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
    summary: buildSummary(corrections, wordCount, kind, language),
    strengths: buildStrengths(scores, wordCount, corrections, language),
    nextFocus: buildNextFocus(corrections, language),
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

  async reviewWriting({ text, language }: ReviewWritingInput): Promise<Review> {
    await delay(900)
    return review(text, 'writing', writingFlowScore(text), language)
  },

  async reviewSpeaking({ transcript, metrics, language }: ReviewSpeakingInput): Promise<Review> {
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
    return review(transcript, 'speaking', fluency, language)
  },

  async generateLessons({
    corrections,
    sourceText,
    language,
  }: {
    corrections: Correction[]
    sourceText?: string
    language: LearningLanguage
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
        const template = lessonTemplate(language, errorType)
        const first = group[0]
        return {
          language,
          errorType,
          title: template.title,
          body: template.body,
          examples: template.examples,
          exercises: template.exercises.map((e) => ({ ...e, id: newId() })),
          sourceSessionId: first?.sessionId ?? null,
          sourceSentence: sourceText
            ? sentenceAt(sourceText, first?.charStart ?? 0)
            : (first?.original ?? null),
        }
      })
  },

  async suggestVocabulary({
    text,
    language,
  }: {
    text: string
    language: LearningLanguage
  }): Promise<VocabSuggestion[]> {
    await delay(400)
    return pickVocabulary(text, language)
  },
}
