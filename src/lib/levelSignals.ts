import type { LearningLanguage } from '@/types'

/**
 * The language-specific evidence the level estimator looks for.
 *
 * Everything here answers one question: *what is this learner reaching for?*
 * Accuracy is measured separately from the corrections; this file is only
 * about range, because range is what actually separates the CEFR bands. A
 * learner who never attempts a conditional cannot be shown to be B2, however
 * clean their present-tense writing is.
 */
export interface LanguageSignals {
  /** Words so common that using them shows nothing. Everything else counts. */
  commonWords: Set<string>
  /** Clause-joining words. More subordination means more complex sentences. */
  subordinators: RegExp
  /** Discourse markers - the glue of an argued, structured text. */
  connectives: RegExp
  /**
   * Grammatical constructions worth attempting, each with a weight. Simple
   * ones are cheap; a past conditional or a subjunctive is strong evidence.
   */
  constructions: { name: string; pattern: RegExp; weight: number }[]
}

const EN_COMMON = `a about after all also am an and any are as at be because been but by
can come could day did do does down each even find first for from get give go good
great had has have he her here him his how i if in into is it its just know like little
long look made make man many may me more most much must my new no not now of off old on
one only or other our out over people say see she so some take than that the their them
then there these they thing think this those time to too two up us use very want was way
we well went were what when where which who why will with work would year you your`
  .split(/\s+/)
  .filter(Boolean)

const FR_COMMON = `à ai aller alors as au aussi autre aux avec avoir bien ce ces cet cette
chose comme comment dans de des deux dire du elle elles en encore est et être eux faire
fait faut grand il ils je jour la le les leur lui ma mais me même mes moi mon ne ni non
nos notre nous on ont ou où par parce pas peu peut plus pour pouvoir prendre quand que
quel qui quoi sa sans se ses si son sont sur ta te temps toi ton tous tout très tu un
une va vers voir vos votre vous y a`
  .split(/\s+/)
  .filter(Boolean)

const SIGNALS: Record<LearningLanguage, LanguageSignals> = {
  en: {
    commonWords: new Set(EN_COMMON),
    subordinators:
      /\b(because|although|though|whereas|while|unless|whether|since|if|when|before|after|until|which|whom|whose|so that|even though|in order to|as if|as though)\b/gi,
    connectives:
      /\b(however|therefore|moreover|furthermore|nevertheless|nonetheless|in addition|on the other hand|for example|for instance|as a result|in conclusion|on the whole|by contrast|in fact|indeed)\b/gi,
    constructions: [
      { name: 'past simple', pattern: /\b\w+ed\b|\b(went|saw|took|made|had|got|came|said|knew|thought|gave|found|told|felt|left|brought|bought|began|wrote)\b/gi, weight: 1 },
      { name: 'future', pattern: /\b(will|shall|going to)\b/gi, weight: 1 },
      { name: 'progressive', pattern: /\b(am|is|are|was|were)\s+\w+ing\b/gi, weight: 1 },
      { name: 'modal', pattern: /\b(can|could|should|might|must|ought to)\b/gi, weight: 1.5 },
      { name: 'present perfect', pattern: /\b(have|has)\s+(\w+ed|been|done|gone|seen|made|taken|written|known)\b/gi, weight: 2 },
      { name: 'passive', pattern: /\b(is|are|was|were|been|being)\s+(\w+ed|made|taken|given|written|done|known|seen)\b/gi, weight: 2.5 },
      { name: 'conditional', pattern: /\bwould\s+\w+/gi, weight: 2.5 },
      { name: 'past perfect', pattern: /\bhad\s+(\w+ed|been|done|gone|seen|made|taken|written|known)\b/gi, weight: 3 },
      { name: 'past conditional', pattern: /\bwould\s+have\s+\w+|\bif\s+\w+\s+had\b/gi, weight: 4 },
      { name: 'relative clause', pattern: /\b(which|who|whose|whom)\b/gi, weight: 2 },
      // Advanced writing signals itself less through textbook tenses than
      // through syntax: fronted inversion, cleft sentences, hedged claims.
      // Without these the estimator ranks a drilled B2 above a genuine C1.
      { name: 'inversion', pattern: /\b(had|were|should)\s+(i|he|she|it|they|we|you|the|a|an)\b(?![^.!?]*\?)|\bnot only\b|\brarely (has|have|do|does|did)\b|\bno sooner\b/gi, weight: 4 },
      { name: 'cleft sentence', pattern: /\bwhat\s+[\w\s,]{3,40}\s+is\s+that\b|\bit\s+is\s+[\w\s]{2,30}\s+that\b|\bwhat\s+(strikes|matters|surprised|interests)\b/gi, weight: 3.5 },
      { name: 'hedged claim', pattern: /\b(appears? to|tends? to|seems? to|insofar as|arguably|presumably|to some extent|by and large)\b/gi, weight: 3 },
      { name: 'concessive', pattern: /\b(albeit|notwithstanding|whereas|granted that|even so)\b/gi, weight: 3.5 },
    ],
  },
  fr: {
    commonWords: new Set(FR_COMMON),
    subordinators:
      /\b(parce que|bien que|alors que|tandis que|puisque|lorsque|quand|si|depuis que|avant que|après que|pour que|afin que|même si|dont|lorsqu’|tant que)\b/gi,
    connectives:
      /\b(cependant|pourtant|néanmoins|toutefois|donc|par conséquent|de plus|en outre|par exemple|en revanche|en conclusion|d’ailleurs|d'ailleurs|en effet|au contraire)\b/gi,
    constructions: [
      { name: 'passé composé', pattern: /\b(ai|as|a|avons|avez|ont|suis|es|est|sommes|êtes|sont)\s+[a-zà-ÿ]+(é|és|ée|ées|i|is|it|u|us|ue)\b/gi, weight: 1.5 },
      { name: 'imparfait', pattern: /\b[a-zà-ÿ]{2,}(ais|ait|ions|iez|aient)\b/gi, weight: 2 },
      { name: 'futur simple', pattern: /\b[a-zà-ÿ]{2,}(rai|ras|rons|rez|ront)\b/gi, weight: 2 },
      { name: 'conditionnel', pattern: /\b[a-zà-ÿ]{2,}(rais|rait|rions|riez|raient)\b/gi, weight: 3 },
      { name: 'plus-que-parfait', pattern: /\b(avais|avait|avions|aviez|avaient|étais|était|étions|étiez|étaient)\s+[a-zà-ÿ]+(é|és|ée|ées|i|u)\b/gi, weight: 3.5 },
      { name: 'subjonctif', pattern: /\b(bien que|pour que|afin que|avant que|il faut que|quoique|jusqu’à ce que)\b/gi, weight: 4 },
      { name: 'pronom relatif', pattern: /\b(dont|lequel|laquelle|auquel|duquel)\b/gi, weight: 3 },
      { name: 'passif', pattern: /\b(est|sont|était|étaient|a été|ont été)\s+[a-zà-ÿ]+(é|és|ée|ées)\b/gi, weight: 2.5 },
      { name: 'pronom complément', pattern: /\b(le|la|les|lui|leur|y|en)\s+(ai|as|a|avons|avez|ont|suis|est|sommes|sont)\b/gi, weight: 1.5 },
      { name: 'gérondif', pattern: /\ben\s+[a-zà-ÿ]{2,}ant\b/gi, weight: 2.5 },
      // Same reasoning as English: the marks of a genuinely advanced writer.
      { name: 'inversion', pattern: /\b(peut-être|ainsi|aussi|sans doute|à peine)\s+[a-zà-ÿ]+-(t-)?(il|elle|on|ils|elles)\b|\bnon seulement\b/gi, weight: 4 },
      { name: 'mise en relief', pattern: /\bce qui\s+[a-zà-ÿ\s,]{3,40}\s+c['’]est\b|\bce que\s+[a-zà-ÿ\s,]{3,40}\s+c['’]est\b|\bce qui (frappe|compte|surprend|importe)\b/gi, weight: 3.5 },
      { name: 'nuance', pattern: /\b(semble|paraît|tend à|dans la mesure où|sans doute|en grande partie|a priori)\b/gi, weight: 3 },
      { name: 'concession', pattern: /\b(quoique|néanmoins|toutefois|certes|si tant est que)\b/gi, weight: 3.5 },
    ],
  },
}

export function signalsFor(language: LearningLanguage): LanguageSignals {
  return SIGNALS[language]
}
