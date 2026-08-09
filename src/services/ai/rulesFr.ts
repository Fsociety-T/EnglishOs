import type { Rule } from './rules'

/**
 * Pattern rules for the offline French reviewer.
 *
 * Same contract and the same discipline as the English rules: a rule fires
 * only on a pattern that is wrong in essentially every context. French offers
 * a lot of tempting near-rules (gender agreement in general, tense choice)
 * that need a dictionary or real understanding to get right - those are left
 * to the AI reviewer rather than guessed at here, because a confident wrong
 * correction teaches the learner something false.
 */

/** Copy the capitalisation of `source` onto `target`. */
function matchCase(source: string, target: string): string {
  if (source[0] && source[0] === source[0].toUpperCase()) {
    return target[0].toUpperCase() + target.slice(1)
  }
  return target
}

/**
 * Verbs common enough to conjugate confidently. Used by the agreement rules so
 * they never fire on a word that only looks like a verb.
 */
const COMMON_ER_VERBS = [
  'parl',
  'mang',
  'travaill',
  'aim',
  'habit',
  'regard',
  'écout',
  'jou',
  'pens',
  'donn',
  'trouv',
  'cherch',
  'demand',
  'arriv',
  'entr',
  'rest',
  'port',
  'montr',
  'march',
  'chant',
  'étudi',
  'commenc',
  'continu',
  'oubli',
  'expliqu',
  'racont',
  'prépar',
  'rencontr',
]

const ER_STEM = COMMON_ER_VERBS.join('|')

export const FR_RULES: Rule[] = [
  // --- Accents that change the word ----------------------------------------
  {
    id: 'fr-a-vs-a-grave',
    // "aller a Paris", "va a la maison": a movement verb followed by bare "a"
    // is the preposition, never the verb avoir.
    pattern: /\b(vais|vas|va|allons|allez|vont|aller|jusqu)\s+a\s+(?=[a-zàâéèêîôûùç])/gi,
    errorType: 'accent',
    severity: 'moderate',
    fix: (m) => `${m[1]} à `,
    explanation:
      '« à » avec accent est la préposition de lieu. « a » sans accent est le verbe avoir : il a faim.',
  },
  {
    id: 'fr-ou-vs-ou-grave',
    pattern: /\bou\s+(est|sont|es|vas|allez|habites|habitez|se trouve)\b/gi,
    errorType: 'accent',
    severity: 'moderate',
    fix: (m) => `${matchCase(m[0], 'où')} ${m[1]}`,
    explanation:
      '« où » avec accent indique le lieu. « ou » sans accent propose un choix : café ou thé.',
  },
  {
    id: 'fr-infinitive-after-avoir',
    // "j'ai manger" -> "j'ai mangé". After the auxiliary avoir the -er form is
    // always the past participle.
    pattern: new RegExp(String.raw`\b(ai|as|a|avons|avez|ont)\s+(${ER_STEM})er\b`, 'gi'),
    errorType: 'accent',
    severity: 'major',
    fix: (m) => `${m[1]} ${m[2]}é`,
    explanation:
      'Après l’auxiliaire « avoir », on écrit le participe passé en -é, pas l’infinitif en -er. On les prononce pareil.',
  },
  {
    id: 'fr-participle-after-modal',
    // "je veux mangé" -> "je veux manger". After a conjugated verb that takes
    // an infinitive, the -é form is wrong.
    pattern: new RegExp(
      String.raw`\b(veux|veut|voulons|voulez|veulent|peux|peut|pouvons|pouvez|peuvent|dois|doit|devons|devez|doivent|vais|vas|va|allons|allez|vont)\s+(${ER_STEM})é\b`,
      'gi',
    ),
    errorType: 'accent',
    severity: 'major',
    fix: (m) => `${m[1]} ${m[2]}er`,
    explanation:
      'Après « vouloir », « pouvoir », « devoir » ou « aller », le second verbe reste à l’infinitif en -er.',
  },

  // --- Contracted articles --------------------------------------------------
  {
    id: 'fr-a-le',
    pattern: /\bà\s+le\b/gi,
    errorType: 'article',
    severity: 'major',
    fix: (m) => matchCase(m[0], 'au'),
    explanation: '« à » + « le » se contracte toujours en « au » : je vais au cinéma.',
  },
  {
    id: 'fr-a-les',
    pattern: /\bà\s+les\b/gi,
    errorType: 'article',
    severity: 'major',
    fix: (m) => matchCase(m[0], 'aux'),
    explanation: '« à » + « les » se contracte toujours en « aux » : je parle aux enfants.',
  },
  {
    id: 'fr-de-le',
    pattern: /\bde\s+le\b(?!\s+(?:plus|moins|même))/gi,
    errorType: 'article',
    severity: 'major',
    fix: (m) => matchCase(m[0], 'du'),
    explanation: '« de » + « le » se contracte toujours en « du » : le livre du professeur.',
  },
  {
    id: 'fr-de-les',
    pattern: /\bde\s+les\b/gi,
    errorType: 'article',
    severity: 'major',
    fix: (m) => matchCase(m[0], 'des'),
    explanation: '« de » + « les » se contracte toujours en « des » : les livres des élèves.',
  },
  {
    id: 'fr-negation-partitive',
    // "je n'ai pas des amis" -> "pas d'amis" / "pas de pain"
    pattern: /\bpas\s+(du|de la|des)\s+/gi,
    errorType: 'article',
    severity: 'moderate',
    fix: () => 'pas de ',
    explanation:
      'Après une négation, « du », « de la » et « des » deviennent « de » : je n’ai pas de pain.',
  },

  // --- Negation -------------------------------------------------------------
  {
    id: 'fr-missing-ne',
    // Spoken French drops "ne"; written French does not.
    pattern: /\b(je|tu|il|elle|on|nous|vous|ils|elles)\s+(suis|es|est|sommes|êtes|sont|ai|as|a|avons|avez|ont|vais|vas|va|allons|allez|vont|peux|peut|veux|veut)\s+pas\b/gi,
    errorType: 'other',
    severity: 'moderate',
    fix: (m) => `${m[1]} ne ${m[2]} pas`,
    explanation:
      'À l’écrit, la négation garde les deux parties : ne … pas. « Je suis pas » s’écrit « je ne suis pas ».',
  },

  // --- Verb agreement -------------------------------------------------------
  {
    id: 'fr-ils-elles-ent',
    // "ils mange" -> "ils mangent"
    pattern: new RegExp(String.raw`\b(ils|elles)\s+(${ER_STEM})e\b`, 'gi'),
    errorType: 'subject-verb-agreement',
    severity: 'major',
    fix: (m) => `${m[1]} ${m[2]}ent`,
    explanation:
      'À la 3e personne du pluriel, le verbe en -er prend la terminaison -ent : ils mangent.',
  },
  {
    id: 'fr-nous-ons',
    // "nous mange" -> "nous mangeons" is stem-dependent, so only correct the
    // clearly wrong bare form to -ons.
    pattern: new RegExp(String.raw`\bnous\s+(${ER_STEM})(?:e|es|ent)\b`, 'gi'),
    errorType: 'subject-verb-agreement',
    severity: 'major',
    fix: (m) => `nous ${m[1]}ons`,
    explanation: 'Avec « nous », le verbe en -er prend la terminaison -ons : nous parlons.',
  },
  {
    id: 'fr-vous-ez',
    pattern: new RegExp(String.raw`\bvous\s+(${ER_STEM})(?:e|es|ent|ons)\b`, 'gi'),
    errorType: 'subject-verb-agreement',
    severity: 'major',
    fix: (m) => `vous ${m[1]}ez`,
    explanation: 'Avec « vous », le verbe en -er prend la terminaison -ez : vous parlez.',
  },
  {
    id: 'fr-je-s',
    pattern: new RegExp(String.raw`\bje\s+(${ER_STEM})(?:es|ent|ons|ez)\b`, 'gi'),
    errorType: 'subject-verb-agreement',
    severity: 'major',
    fix: (m) => `je ${m[1]}e`,
    explanation: 'Avec « je », le verbe en -er se termine par -e : je parle.',
  },

  // --- Word choice ----------------------------------------------------------
  {
    id: 'fr-age-with-etre',
    // English speakers write "je suis 20 ans"; French counts age with avoir.
    pattern: /\b(je\s+suis|tu\s+es|il\s+est|elle\s+est|nous\s+sommes|vous\s+êtes|ils\s+sont|elles\s+sont)\s+(\d{1,3})\s+ans?\b/gi,
    errorType: 'word-choice',
    severity: 'major',
    fix: (m) => {
      const subject = m[1].trim().split(/\s+/)[0]
      const avoir: Record<string, string> = {
        je: 'j’ai',
        tu: 'tu as',
        il: 'il a',
        elle: 'elle a',
        nous: 'nous avons',
        vous: 'vous avez',
        ils: 'ils ont',
        elles: 'elles ont',
      }
      return `${avoir[subject.toLowerCase()] ?? 'j’ai'} ${m[2]} ans`
    },
    explanation:
      'En français, l’âge se dit avec « avoir », pas « être » : j’ai vingt ans. C’est l’inverse de l’anglais.',
  },
  {
    id: 'fr-penser-de',
    pattern: /\b(pense|penses|pensons|pensez|pensent)\s+de\s+(toi|moi|lui|elle|nous|vous|eux)\b/gi,
    errorType: 'preposition',
    severity: 'moderate',
    fix: (m) => `${m[1]} à ${m[2]}`,
    explanation:
      '« Penser à » quelqu’un signifie l’avoir en tête. « Penser de » sert à demander une opinion.',
  },
  {
    id: 'fr-a-country-feminine',
    pattern: /\bà\s+(France|Belgique|Suisse|Espagne|Italie|Allemagne|Chine|Russie|Turquie|Grèce)\b/gi,
    errorType: 'preposition',
    severity: 'moderate',
    fix: (m) => `en ${m[1]}`,
    explanation:
      'Devant un pays féminin, on utilise « en » : en France, en Espagne. « à » s’emploie pour les villes.',
  },
  {
    id: 'fr-plus-bon',
    pattern: /\bplus\s+bon(ne|s|nes)?\b/gi,
    errorType: 'word-choice',
    severity: 'moderate',
    fix: (m) => {
      const ending = m[1] ?? ''
      if (ending === 'ne') return 'meilleure'
      if (ending === 's') return 'meilleurs'
      if (ending === 'nes') return 'meilleures'
      return 'meilleur'
    },
    explanation: '« Plus bon » ne se dit pas : le comparatif de « bon » est « meilleur ».',
  },
  {
    id: 'fr-savoir-connaitre',
    // "je connais nager" -> "je sais nager": connaître never takes an infinitive.
    pattern: /\b(connais|connaît|connaissons|connaissez|connaissent)\s+((?:[a-zéèêà]+)(?:er|ir|re))\b/gi,
    errorType: 'word-choice',
    severity: 'moderate',
    fix: (m) => {
      const savoir: Record<string, string> = {
        connais: 'sais',
        connaît: 'sait',
        connaissons: 'savons',
        connaissez: 'savez',
        connaissent: 'savent',
      }
      return `${savoir[m[1].toLowerCase()] ?? 'sais'} ${m[2]}`
    },
    explanation:
      '« Savoir » exprime une capacité et précède un infinitif : je sais nager. « Connaître » porte sur une personne ou un lieu.',
  },

  // --- Spelling confusions --------------------------------------------------
  {
    id: 'fr-ce-se-verb',
    // "il ce lave" -> "il se lave"
    pattern: /\b(je|tu|il|elle|on|nous|vous|ils|elles)\s+ce\s+(?=[a-zéèêà]+(?:e|es|ons|ez|ent)\b)/gi,
    errorType: 'spelling',
    severity: 'moderate',
    fix: (m) => `${m[1]} se `,
    explanation:
      '« se » est le pronom réfléchi (il se lave). « ce » montre quelque chose (ce livre).',
  },
  {
    id: 'fr-leurs-before-verb',
    // "je leurs ai parlé" -> "je leur ai parlé"
    pattern: /\bleurs\s+(ai|as|a|avons|avez|ont|dis|dit|donne|donné|parle|parlé)\b/gi,
    errorType: 'spelling',
    severity: 'moderate',
    fix: (m) => `leur ${m[1]}`,
    explanation:
      'Devant un verbe, « leur » est un pronom et ne prend jamais de -s. « Leurs » n’existe que devant un nom pluriel.',
  },
  {
    id: 'fr-ca-vs-sa',
    pattern: /\bsa\s+(va|suffit|m’est|dépend)\b/gi,
    errorType: 'spelling',
    severity: 'moderate',
    fix: (m) => `ça ${m[1]}`,
    explanation: '« ça » remplace « cela ». « sa » est un possessif : sa voiture.',
  },

  // --- Punctuation ----------------------------------------------------------
  {
    id: 'fr-space-before-double-punctuation',
    // French puts a space before ? ! ; :
    pattern: /(\S)([?!;:])(?=\s|$)/g,
    errorType: 'punctuation',
    severity: 'minor',
    fix: (m) => `${m[1]} ${m[2]}`,
    explanation:
      'En français, les signes doubles ( ? ! ; : ) prennent une espace avant, contrairement à l’anglais.',
  },
  {
    id: 'fr-english-quotes',
    pattern: /"([^"]{1,80})"/g,
    errorType: 'punctuation',
    severity: 'minor',
    fix: (m) => `« ${m[1]} »`,
    explanation: 'Le français utilise les guillemets « » avec une espace à l’intérieur.',
  },
  {
    id: 'fr-lowercase-sentence-start',
    pattern: /(^|[.!?]\s+)([a-zàâéèêîôûùç])(?=[a-zàâéèêîôûùç]{2,})/g,
    errorType: 'punctuation',
    severity: 'minor',
    fix: (m) => `${m[1]}${m[2].toUpperCase()}`,
    explanation: 'Chaque phrase commence par une majuscule.',
  },
]
