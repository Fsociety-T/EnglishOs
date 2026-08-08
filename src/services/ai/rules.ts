import type { ErrorType, Severity } from '@/types'

/**
 * Pattern rules for the mock reviewer.
 *
 * These are real, common mistakes rather than random canned text, which buys
 * two things: the correction offsets are genuine (so inline highlighting can be
 * built and tested properly), and the feedback is actually worth something
 * before the real AI is connected in Phase 11.
 *
 * A rule fires only on a clear, unambiguous pattern. When in doubt, leave it
 * out - a confident wrong correction is worse than a missed one for a learner.
 */
export interface Rule {
  id: string
  pattern: RegExp
  errorType: ErrorType
  severity: Severity
  /** Build the replacement from the regex match. */
  fix: (m: RegExpMatchArray) => string
  explanation: string
}

/** Copy the capitalisation of `source` onto `target`. */
function matchCase(source: string, target: string): string {
  if (source[0] && source[0] === source[0].toUpperCase()) {
    return target[0].toUpperCase() + target.slice(1)
  }
  return target
}

const IRREGULAR_THIRD_PERSON: Record<string, string> = {
  go: 'goes',
  do: 'does',
  have: 'has',
  be: 'is',
}

/** work -> works, watch -> watches, study -> studies. */
function thirdPerson(verb: string): string {
  const lower = verb.toLowerCase()
  const irregular = IRREGULAR_THIRD_PERSON[lower]
  if (irregular) return matchCase(verb, irregular)
  if (/(ch|sh|ss|x|z|o)$/.test(lower)) return matchCase(verb, `${lower}es`)
  if (/[^aeiou]y$/.test(lower)) return matchCase(verb, `${lower.slice(0, -1)}ies`)
  return matchCase(verb, `${lower}s`)
}

const PAST_TO_BASE: Record<string, string> = {
  went: 'go',
  saw: 'see',
  ate: 'eat',
  took: 'take',
  made: 'make',
  had: 'have',
  got: 'get',
  came: 'come',
  said: 'say',
  knew: 'know',
  thought: 'think',
  gave: 'give',
  found: 'find',
  told: 'tell',
  felt: 'feel',
  left: 'leave',
  brought: 'bring',
  bought: 'buy',
}

const UNCOUNTABLE = [
  'information',
  'advice',
  'furniture',
  'equipment',
  'knowledge',
  'homework',
  'software',
  'feedback',
  'luggage',
  'progress',
  'research',
  'traffic',
  'weather',
]

const BASE_VERBS = [
  'go',
  'do',
  'have',
  'make',
  'take',
  'say',
  'get',
  'know',
  'think',
  'want',
  'need',
  'like',
  'live',
  'work',
  'play',
  'come',
  'give',
  'feel',
  'seem',
  'look',
  'talk',
  'speak',
  'write',
  'read',
  'watch',
  'study',
  'help',
  'try',
  'love',
  'hate',
  'eat',
  'sleep',
  'learn',
  'teach',
]

const CONTRACTIONS: Record<string, string> = {
  dont: "don't",
  cant: "can't",
  wont: "won't",
  didnt: "didn't",
  doesnt: "doesn't",
  isnt: "isn't",
  arent: "aren't",
  wasnt: "wasn't",
  werent: "weren't",
  couldnt: "couldn't",
  shouldnt: "shouldn't",
  wouldnt: "wouldn't",
  havent: "haven't",
  hasnt: "hasn't",
  hadnt: "hadn't",
  // Deliberately NOT "its" -> "it's". "its" is a correct possessive ("its
  // colour"), so that rule would teach a wrong lesson more often than a right one.
}

export const RULES: Rule[] = [
  // --- Spelling / mechanics -------------------------------------------------
  {
    id: 'lowercase-i',
    pattern: /\bi\b/g,
    errorType: 'spelling',
    severity: 'minor',
    fix: () => 'I',
    explanation:
      'In English the pronoun "I" is always a capital letter, anywhere in the sentence. This is different from most other languages.',
  },
  {
    id: 'im',
    pattern: /\bim\b/g,
    errorType: 'spelling',
    severity: 'minor',
    fix: () => "I'm",
    explanation: '"I\'m" is short for "I am". It needs a capital I and an apostrophe.',
  },
  {
    id: 'alot',
    pattern: /\balot\b/gi,
    errorType: 'spelling',
    severity: 'minor',
    fix: (m) => matchCase(m[0], 'a lot'),
    explanation: '"A lot" is always two separate words. "Alot" is not a word in English.',
  },
  {
    id: 'missing-apostrophe',
    pattern: new RegExp(`\\b(${Object.keys(CONTRACTIONS).join('|')})\\b`, 'gi'),
    errorType: 'punctuation',
    severity: 'minor',
    fix: (m) => matchCase(m[0], CONTRACTIONS[m[0].toLowerCase()] ?? m[0]),
    explanation:
      'Contractions need an apostrophe to show the missing letters, for example "do not" becomes "don\'t".',
  },
  {
    id: 'lowercase-after-period',
    pattern: /([.!?]\s+)([a-z])/g,
    errorType: 'punctuation',
    severity: 'minor',
    fix: (m) => `${m[1]}${m[2].toUpperCase()}`,
    explanation: 'A new sentence always starts with a capital letter.',
  },

  // --- Articles -------------------------------------------------------------
  {
    id: 'a-before-vowel',
    // The rule is about vowel *sounds*, not vowel letters. "u" is excluded
    // entirely (a university), and euro-/one- are excluded because they start
    // with a consonant sound despite the vowel letter (a European, a one-way street).
    pattern: /\ba\s+(?=(?!euro|one\b|once\b)[aeio])/gi,
    errorType: 'article',
    severity: 'moderate',
    fix: (m) => matchCase(m[0], 'an '),
    explanation:
      'Use "an" before a vowel sound: an apple, an idea, an old car. Use "a" before a consonant sound.',
  },
  {
    id: 'an-before-consonant',
    pattern: /\ban\s+(?=[bcdfgjklmnpqrstvwxyz])/gi,
    errorType: 'article',
    severity: 'moderate',
    fix: (m) => matchCase(m[0], 'a '),
    explanation: 'Use "a" before a consonant sound: a book, a car, a good day.',
  },

  // --- Subject-verb agreement ----------------------------------------------
  {
    id: 'third-person-s',
    pattern: new RegExp(`\\b(he|she|it)\\s+(${BASE_VERBS.join('|')})\\b`, 'gi'),
    errorType: 'subject-verb-agreement',
    severity: 'major',
    fix: (m) => `${m[1]} ${thirdPerson(m[2])}`,
    explanation:
      'After he, she or it in the present simple, the verb takes -s: he works, she goes, it has.',
  },
  {
    id: 'people-is',
    pattern: /\bpeople\s+is\b/gi,
    errorType: 'subject-verb-agreement',
    severity: 'major',
    fix: (m) => matchCase(m[0], 'people are'),
    explanation: '"People" is already plural, so it takes "are": people are, not people is.',
  },
  {
    id: 'there-is-plural',
    pattern: /\bthere\s+is\s+(?=(many|several|some|a lot of|lots of|two|three|four|five)\b)/gi,
    errorType: 'subject-verb-agreement',
    severity: 'moderate',
    fix: (m) => matchCase(m[0], 'there are '),
    explanation: 'Use "there are" before plural nouns: there are many people, there is one person.',
  },

  // --- Verb tense -----------------------------------------------------------
  {
    id: 'did-plus-past',
    pattern: new RegExp(`\\b(didn't|did not|doesn't|don't)\\s+(${Object.keys(PAST_TO_BASE).join('|')})\\b`, 'gi'),
    errorType: 'verb-tense',
    severity: 'major',
    fix: (m) => `${m[1]} ${matchCase(m[2], PAST_TO_BASE[m[2].toLowerCase()] ?? m[2])}`,
    explanation:
      'After "did", "didn\'t" or "doesn\'t", the main verb goes back to its base form: I didn\'t go, not I didn\'t went.',
  },
  {
    id: 'have-years',
    pattern: /\b(i|he|she|we|they|you)\s+(have|has)\s+(\d+)\s+years?\b/gi,
    errorType: 'word-choice',
    severity: 'major',
    fix: (m) => {
      const be = /^(i)$/i.test(m[1]) ? 'am' : /^(he|she)$/i.test(m[1]) ? 'is' : 'are'
      return `${m[1]} ${be} ${m[3]} years old`
    },
    explanation:
      'English uses "be" for age, not "have": I am 25 years old. Many languages use "have" here.',
  },
  {
    id: 'i-am-agree',
    pattern: /\b(i|we|they|you)\s+(am|are|is)\s+agree\b/gi,
    errorType: 'verb-tense',
    severity: 'moderate',
    fix: (m) => `${m[1]} agree`,
    explanation: '"Agree" is a verb on its own, so it does not need "am" or "are": I agree.',
  },

  // --- Prepositions ---------------------------------------------------------
  {
    id: 'depend-of',
    pattern: /\bdepend(s|ed|ing)?\s+of\b/gi,
    errorType: 'preposition',
    severity: 'moderate',
    fix: (m) => `depend${m[1] ?? ''} on`,
    explanation: 'The fixed pair is "depend on", never "depend of".',
  },
  {
    id: 'good-in',
    pattern: /\b(good|bad|great|terrible|excellent)\s+in\b/gi,
    errorType: 'preposition',
    severity: 'moderate',
    fix: (m) => `${m[1]} at`,
    explanation: 'Use "good at" for skills: good at English, good at cooking.',
  },
  {
    id: 'interested-on',
    pattern: /\binterested\s+(on|about|for)\b/gi,
    errorType: 'preposition',
    severity: 'moderate',
    fix: () => 'interested in',
    explanation: 'The fixed pair is "interested in".',
  },
  {
    id: 'married-with',
    pattern: /\bmarried\s+with\b/gi,
    errorType: 'preposition',
    severity: 'moderate',
    fix: () => 'married to',
    explanation: 'You are "married to" a person, not "married with".',
  },
  {
    id: 'responsible-of',
    pattern: /\bresponsible\s+(of|about)\b/gi,
    errorType: 'preposition',
    severity: 'moderate',
    fix: () => 'responsible for',
    explanation: 'The fixed pair is "responsible for".',
  },
  {
    id: 'in-weekday',
    pattern: /\bin\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
    errorType: 'preposition',
    severity: 'moderate',
    fix: (m) => `on ${m[1][0].toUpperCase()}${m[1].slice(1).toLowerCase()}`,
    explanation: 'Use "on" with days: on Monday. Use "in" with months and years: in June, in 2026.',
  },
  {
    id: 'since-duration',
    pattern: /\bsince\s+(?=(\d+|a|two|three|four|five|six|ten)\s+(year|month|week|day|hour)s?\b)/gi,
    errorType: 'preposition',
    severity: 'moderate',
    fix: (m) => matchCase(m[0], 'for '),
    explanation:
      'Use "for" with a length of time (for two years) and "since" with a starting point (since 2020).',
  },
  {
    id: 'listen-music',
    pattern: /\blisten\s+(?=(music|the music|radio|me|him|her|them)\b)/gi,
    errorType: 'preposition',
    severity: 'moderate',
    fix: (m) => matchCase(m[0], 'listen to '),
    explanation: 'You "listen to" something. The "to" is not optional.',
  },
  {
    id: 'discuss-about',
    pattern: /\bdiscuss(ed|ing)?\s+about\b/gi,
    errorType: 'preposition',
    severity: 'moderate',
    fix: (m) => `discuss${m[1] ?? ''}`,
    explanation: '"Discuss" already includes the idea of "about", so no preposition is needed.',
  },
  {
    id: 'explain-me',
    pattern: /\bexplain\s+(me|him|her|us|them)\b/gi,
    errorType: 'preposition',
    severity: 'moderate',
    fix: (m) => `explain to ${m[1]}`,
    explanation: 'You "explain something to someone". "Explain me" is missing the "to".',
  },

  // --- Plurals and quantity -------------------------------------------------
  {
    id: 'uncountable-plural',
    pattern: new RegExp(`\\b(${UNCOUNTABLE.join('|')})s\\b`, 'gi'),
    errorType: 'plural',
    severity: 'moderate',
    fix: (m) => m[1],
    explanation:
      'This is an uncountable noun in English, so it has no plural -s. Say "some information" or "pieces of advice".',
  },
  {
    id: 'double-plural',
    pattern: /\b(childrens|peoples|womens|mens|feets|teeths)\b/gi,
    errorType: 'plural',
    severity: 'moderate',
    fix: (m) => matchCase(m[0], m[0].toLowerCase().replace(/s$/, '')),
    explanation:
      'This word is already plural (children, people, women, men), so it does not take another -s.',
  },
  {
    id: 'much-countable',
    pattern: /\bmuch\s+(?=(people|things|friends|books|cars|years|times|words|places|ideas)\b)/gi,
    errorType: 'word-choice',
    severity: 'moderate',
    fix: (m) => matchCase(m[0], 'many '),
    explanation:
      'Use "many" with things you can count (many books) and "much" with things you cannot (much water).',
  },

  // --- Comparatives ---------------------------------------------------------
  {
    id: 'double-comparative',
    pattern: /\bmore\s+(better|easier|faster|bigger|smaller|worse|happier|harder|older|younger)\b/gi,
    errorType: 'word-order',
    severity: 'moderate',
    fix: (m) => m[1],
    explanation:
      'A word that already ends in -er is a comparative, so it never takes "more" as well.',
  },
  {
    id: 'most-superlative',
    pattern: /\bmost\s+(easiest|biggest|best|worst|fastest|hardest|smallest)\b/gi,
    errorType: 'word-order',
    severity: 'moderate',
    fix: (m) => m[1],
    explanation: 'A word ending in -est is already a superlative, so it does not need "most".',
  },
  {
    id: 'then-than',
    pattern: /\b(more|better|worse|less|older|younger|bigger|smaller|faster|slower)\s+then\b/gi,
    errorType: 'word-choice',
    severity: 'moderate',
    fix: (m) => `${m[1]} than`,
    explanation:
      '"Than" compares two things (bigger than). "Then" is about time (first this, then that).',
  },

  // --- Collocations ---------------------------------------------------------
  {
    id: 'make-photo',
    pattern: /\bmake\s+(a\s+)?(photo|picture)\b/gi,
    errorType: 'collocation',
    severity: 'moderate',
    fix: (m) => `take ${m[1] ?? ''}${m[2]}`,
    explanation: 'In English you "take" a photo. "Make a photo" is a word-partnership mistake.',
  },
  {
    id: 'very-much-adj',
    pattern: /\bvery\s+much\s+(?=(interesting|good|nice|beautiful|important|difficult|easy|happy)\b)/gi,
    errorType: 'word-order',
    severity: 'minor',
    fix: (m) => matchCase(m[0], 'very '),
    explanation:
      '"Very much" does not go before an adjective. Just use "very": very interesting.',
  },
]
