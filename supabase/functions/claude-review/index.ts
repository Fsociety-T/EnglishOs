import { createClient } from 'npm:@supabase/supabase-js@2'

type Action =
  | 'review-writing'
  | 'review-speaking'
  | 'generate-lessons'
  | 'suggest-vocabulary'
  | 'estimate-level'

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
const CONFIDENCES = new Set(['low', 'medium', 'high'])

const ERROR_TYPES = new Set([
  'verb-tense',
  'article',
  'preposition',
  'word-order',
  'subject-verb-agreement',
  'plural',
  'spelling',
  'collocation',
  'punctuation',
  'word-choice',
  // French-only categories. Kept in the shared set so one schema serves both
  // languages; the prompt is what stops them being used for English.
  'gender-agreement',
  'accent',
  'other',
])
const SEVERITIES = new Set(['minor', 'moderate', 'major'])
const MAX_INPUT_CHARS = 24_000

function corsHeaders(origin: string | null): HeadersInit {
  const allowedOrigins = new Set([
    'https://fsociety-t.github.io',
    'http://localhost:5173',
  ])
  return {
    'Access-Control-Allow-Origin': origin && allowedOrigins.has(origin) ? origin : 'null',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
    Vary: 'Origin',
  }
}

function respond(body: unknown, status = 200, origin: string | null = null): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(origin) })
}

function getPublishableKey(): string {
  const direct = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY')
  if (direct) return direct
  const keys = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') ?? '{}') as Record<string, string>
  const key = keys.default
  if (!key) throw new Error('Supabase publishable key is missing from the function environment.')
  return key
}

function text(value: unknown, limit = 4_000): string {
  return typeof value === 'string' ? value.trim().slice(0, limit) : ''
}

function score(value: unknown): number {
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(number) ? Math.max(0, Math.min(100, Math.round(number))) : 0
}

function parseModelJson(raw: string): unknown {
  const unwrapped = raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '')
  return JSON.parse(unwrapped)
}

/**
 * The language being learned. Anything unrecognised falls back to English so a
 * malformed request still produces a usable review rather than an error.
 */
function language(input: Record<string, unknown>): 'en' | 'fr' {
  return input.language === 'fr' ? 'fr' : 'en'
}

interface LanguageProfile {
  /** The language named in English, for the instruction sentence. */
  name: string
  /** The error types this language can produce, as a prompt enum. */
  errorTypes: string
  /** How the feedback prose itself should be written. */
  feedbackLanguage: string
}

const LANGUAGE_PROFILE: Record<'en' | 'fr', LanguageProfile> = {
  en: {
    name: 'English',
    errorTypes:
      'verb-tense|article|preposition|word-order|subject-verb-agreement|plural|spelling|collocation|punctuation|word-choice|other',
    feedbackLanguage:
      'Write every explanation, summary, strength and next-focus item in clear, simple English.',
  },
  fr: {
    name: 'French',
    errorTypes:
      'verb-tense|gender-agreement|accent|article|preposition|word-order|subject-verb-agreement|plural|spelling|punctuation|word-choice|other',
    feedbackLanguage:
      'Write every explanation, summary, strength and next-focus item in clear, simple French — the learner reads the app in French. Use "gender-agreement" for adjective and participle agreement mistakes, and "accent" for missing or wrong accents including the -er/-é confusion.',
  },
}

function reviewPrompt(kind: 'writing' | 'speaking', input: Record<string, unknown>): string {
  const learnerText = text(kind === 'writing' ? input.text : input.transcript, 12_000)
  const metrics = kind === 'speaking' ? input.metrics : undefined
  const profile = LANGUAGE_PROFILE[language(input)]
  const level = text(input.level, 8)
  return `You are an expert, encouraging ${profile.name} teacher. Review the learner's ${kind} at CEFR ${level}. The learner is writing in ${profile.name}; judge it by ${profile.name} rules only. Correct only genuine issues; do not rewrite for style alone.\n\n${profile.feedbackLanguage}\n\nWords that do not exist are mistakes, and the most important ones to catch. If a word is not a real ${profile.name} word - invented, misspelt beyond recognition, or typed at random - correct it to the word the learner most likely meant, with errorType "spelling" and severity "major". If you cannot tell what they meant, say so in the explanation and correct it to a sensible word. Never pass over a non-word in silence, and never treat one as advanced vocabulary. If much of the text is not real ${profile.name}, scores must be very low, the summary must say plainly that the text could not be understood, and strengths must be empty rather than invented.\n\nReturn a JSON object with exactly this shape:\n{"correctedText":"the learner's full text with every correction applied","improvedText":"the same text rewritten at its best","corrections":[{"original":"string","corrected":"string","explanation":"plain language","errorType":"${profile.errorTypes}","severity":"minor|moderate|major","charStart":0,"charEnd":0}],"scores":{"overall":0,"grammar":0,"vocabulary":0,"fluency":0},"summary":"1-2 specific encouraging sentences","strengths":["string"],"nextFocus":["string"]}\n\ncorrectedText and improvedText are two different things and must not be the same string. correctedText fixes what is wrong and changes nothing else. improvedText shows what good looks like:\n- Keep every idea the learner had, in the same order. Add no new facts, opinions or examples.\n- Stay within about 10 percent of the original length. This is a model of how they could have written it, not a longer essay.\n- Improve the STRUCTURE: join choppy sentences, vary sentence length, tighten word order, and make each sentence lead into the next.\n- Write it as a strong CEFR ${level} writer would - one realistic step above this learner, using structures they could reach for next time. Do not show off vocabulary far above ${level}; an unreachable model teaches nothing.\n\nEvery one of correctedText, improvedText, corrections, scores, summary, strengths and nextFocus is REQUIRED. Include all six even when the text is very short or already correct — use an empty array for corrections, strengths or nextFocus when you have nothing to add, and still give scores and a summary. Scores are integers from 0 to 100. Give at most three strengths and three nextFocus items.\n\nRule for offsets: charStart and charEnd are JavaScript string offsets into the exact learner text below, and "original" must be copied character for character from that text so it can be found again. Get the quote exactly right; the offsets are a hint and will be corrected from the quote if they are slightly out. A correction whose "original" does not appear in the text at all is discarded, so never quote words the learner did not write.\n\nTopic: ${text(input.topic, 300)}\n${metrics ? `Local speaking metrics (do not invent audio facts): ${JSON.stringify(metrics)}\n` : ''}Learner text:\n${learnerText}`
}

/**
 * Build the mini-lessons.
 *
 * The old version of this prompt asked for a "concise personalised mini-lesson"
 * and got exactly that: correct, forgettable grammar notes that read like a
 * reference book. Nobody remembers a reference book.
 *
 * So the instructions below are about *teaching*, not about being right. A
 * one-line hook you can hear in your head while writing beats a paragraph you
 * skim once. A rule stated with the learner's own broken sentence beside it
 * lands harder than the same rule stated abstractly. And exercises have to
 * test the rule in new sentences, because a quiz that quotes the lesson back
 * measures short-term memory rather than understanding.
 */
function lessonsPrompt(input: Record<string, unknown>): string {
  const corrections = Array.isArray(input.corrections) ? input.corrections.slice(0, 20) : []
  const profile = LANGUAGE_PROFILE[language(input)]
  return `You are a ${profile.name} teacher writing mini-lessons for one learner at CEFR ${text(input.level, 8)}, built from the mistakes they just made. Return one to three lessons, grouped by the most important error types.\n\n${profile.feedbackLanguage} Every example and exercise must be in ${profile.name}.\n\nHow to teach, in order of importance:\n\n1. "memoryHook" is the most important field. One short sentence that makes the rule stick: a trick, a vivid image, a question they can ask themselves mid-sentence, a two-word test. It must be memorable enough to recall a week later without re-reading the lesson. Warm and a bit playful is good; a restatement of the rule is not a hook.\n2. "body" is two or three SHORT paragraphs of plain language. Speak to the learner as "you". Explain WHY the correct form is correct, not just what it is. No grammar jargon unless you immediately explain it in ordinary words. At A1 and A2, keep sentences very simple.\n3. "examples" must start from what the learner actually wrote. Put their real mistake first, fixed, then one or two other cases that show the same rule somewhere new.\n4. "exercises" are three or four questions testing the SAME rule in sentences the learner has not seen. Never quote the lesson body back at them. Wrong choices should be mistakes a real learner would make, not obvious nonsense. Every explanation says why the right answer is right AND why the tempting wrong one is wrong.\n5. Be encouraging without being empty. Never say the mistake is bad, common, or careless.\n\nReturn a JSON object with exactly this shape:\n{"lessons":[{"errorType":"${profile.errorTypes}","title":"string","body":"short markdown explanation","memoryHook":"one memorable sentence","examples":[{"wrong":"string","right":"string","note":"string"}],"exercises":[{"question":"string","choices":["string","string","string","string"],"answerIndex":0,"explanation":"string"}],"sourceSessionId":null,"sourceSentence":null}]}\n\nEvery field shown is REQUIRED on every lesson. Use an empty string for "note" when there is nothing to add, and null for a source field you cannot determine. answerIndex is the 0-based position of the correct choice.\n\nCorrections: ${JSON.stringify(corrections)}\nSource text: ${text(input.sourceText, 12_000)}`
}

function vocabularyPrompt(input: Record<string, unknown>): string {
  const profile = LANGUAGE_PROFILE[language(input)]
  return `Suggest five useful ${profile.name} vocabulary words for a CEFR ${text(input.level, 8)} learner based on the text below. Do not repeat words already used in the text.\n\n${profile.feedbackLanguage} The definitions and example sentences must be in ${profile.name}.\n\nReturn a JSON object with exactly this shape:\n{"words":[{"word":"string","phonetic":"IPA string","partOfSpeech":"string","definition":"clear short definition","example":"natural example sentence"}]}\n\nEvery field shown is REQUIRED on every word. Use an empty string for "phonetic" if you are unsure of the IPA.\n\nText:\n${text(input.text, 12_000)}`
}

/**
 * Groq enforces these with constrained decoding (strict mode), so the model
 * cannot emit a shape the validators below would reject outright. The
 * validators still run: a schema can guarantee an integer charStart, but not
 * that it points at the right characters.
 *
 * Strict mode rules: every property must be listed in `required`, and every
 * object needs `additionalProperties: false`. Fields that are conceptually
 * optional are required here and carry "" or null instead.
 */
const str = { type: 'string' } as const
// anyOf rather than `type: ['string', 'null']`: Groq documents anyOf as
// supported in strict mode, the array form of `type` is not listed.
const nullableStr = { anyOf: [{ type: 'string' }, { type: 'null' }] } as const
const score100 = { type: 'integer', minimum: 0, maximum: 100 } as const

function object(properties: Record<string, unknown>) {
  return {
    type: 'object',
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
  }
}

const REVIEW_SCHEMA = object({
  correctedText: str,
  improvedText: str,
  corrections: {
    type: 'array',
    items: object({
      original: str,
      corrected: str,
      explanation: str,
      errorType: { type: 'string', enum: [...ERROR_TYPES] },
      severity: { type: 'string', enum: [...SEVERITIES] },
      charStart: { type: 'integer', minimum: 0 },
      charEnd: { type: 'integer', minimum: 0 },
    }),
  },
  scores: object({
    overall: score100,
    grammar: score100,
    vocabulary: score100,
    fluency: score100,
  }),
  summary: str,
  strengths: { type: 'array', items: str },
  nextFocus: { type: 'array', items: str },
})

const LESSONS_SCHEMA = object({
  lessons: {
    type: 'array',
    items: object({
      errorType: { type: 'string', enum: [...ERROR_TYPES] },
      title: str,
      body: str,
      memoryHook: str,
      examples: {
        type: 'array',
        items: object({ wrong: str, right: str, note: str }),
      },
      exercises: {
        type: 'array',
        items: object({
          question: str,
          choices: { type: 'array', items: str },
          answerIndex: { type: 'integer', minimum: 0 },
          explanation: str,
        }),
      },
      sourceSessionId: nullableStr,
      sourceSentence: nullableStr,
    }),
  },
})

const VOCABULARY_SCHEMA = object({
  words: {
    type: 'array',
    items: object({
      word: str,
      phonetic: str,
      partOfSpeech: str,
      definition: str,
      example: str,
    }),
  },
})

const LEVEL_SCHEMA = object({
  level: { type: 'string', enum: [...CEFR_LEVELS] },
  confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
  evidence: { type: 'array', items: str },
})

function schemaFor(action: Action): { name: string; schema: unknown } {
  switch (action) {
    case 'review-writing':
    case 'review-speaking':
      return { name: 'review', schema: REVIEW_SCHEMA }
    case 'generate-lessons':
      return { name: 'lessons', schema: LESSONS_SCHEMA }
    case 'suggest-vocabulary':
      return { name: 'vocabulary', schema: VOCABULARY_SCHEMA }
    case 'estimate-level':
      return { name: 'level', schema: LEVEL_SCHEMA }
  }
}

/**
 * Judge a writing sample against the CEFR descriptors.
 *
 * The instruction about range is the whole point. Asked to grade a piece of
 * writing, a model will happily equate "few mistakes" with "high level", which
 * ranks a flawless beginner above an ambitious intermediate. Telling it that
 * range sets the ceiling and accuracy places the learner inside it is what
 * stops that, and it mirrors exactly what the offline estimator does.
 */
function levelPrompt(input: Record<string, unknown>): string {
  const profile = LANGUAGE_PROFILE[language(input)]
  const corrections = Array.isArray(input.corrections) ? input.corrections.slice(0, 40) : []
  return `You are a ${profile.name} examiner placing a learner on the CEFR scale from a single writing sample.\n\n${profile.feedbackLanguage}\n\nJudge on two axes, in this order.\n\nRANGE sets the ceiling - how much language the learner reaches for at all: sentence length and variety, subordinate clauses, the tenses and moods attempted, vocabulary beyond the everyday core, and discourse markers.\n\nACCURACY places them inside that ceiling - how much of what they reached for actually lands.\n\nCritical: fewer mistakes does NOT mean a higher level. A learner writing only short, simple, correct sentences is A1 or A2 no matter how clean the text is. A learner attempting complex structures and getting some wrong is B1 or higher, because attempting them is itself evidence. Never place a learner above B1 on the basis of clean but simple writing, and never below B1 purely because an ambitious attempt failed.\n\nLength caps the ceiling: a sample under 120 words cannot demonstrate C1 or C2, however good it is.\n\nReturn a JSON object with exactly this shape:\n{"level":"A1|A2|B1|B2|C1|C2","confidence":"low|medium|high","evidence":["short reason","short reason"]}\n\nGive two to four evidence lines. Each must point at something concrete in the text - a structure attempted, a pattern of error, the range of vocabulary - not a general compliment.\n\nMistakes already found by the checker: ${JSON.stringify(corrections)}\n\nLearner text:\n${text(input.text, 12_000)}`
}

function promptFor(action: Action, input: Record<string, unknown>): string {
  switch (action) {
    case 'review-writing':
      return reviewPrompt('writing', input)
    case 'review-speaking':
      return reviewPrompt('speaking', input)
    case 'generate-lessons':
      return lessonsPrompt(input)
    case 'suggest-vocabulary':
      return vocabularyPrompt(input)
    case 'estimate-level':
      return levelPrompt(input)
  }
}

/**
 * Where in the source text a correction really belongs.
 *
 * Character offsets are the one thing a language model is genuinely bad at:
 * it counts by tokens, not by UTF-16 code units, and it drifts by a few
 * characters over a long text. The old rule - offsets must match exactly or
 * the correction is thrown away - meant a model that found ten real mistakes
 * and miscounted could leave the learner reading "no mistakes found".
 *
 * Silently deleting correct feedback is far worse than highlighting it a few
 * characters off, so the quoted text is trusted over the arithmetic: find the
 * quote, and prefer the occurrence closest to where the model thought it was.
 * Only a quote that does not appear in the text at all is discarded, because
 * that is the model inventing something the learner never wrote.
 */
function locate(source: string, original: string, claimedStart: number): [number, number] | null {
  if (!original) return null
  if (source.slice(claimedStart, claimedStart + original.length) === original) {
    return [claimedStart, claimedStart + original.length]
  }

  let best = -1
  for (let at = source.indexOf(original); at !== -1; at = source.indexOf(original, at + 1)) {
    if (best === -1 || Math.abs(at - claimedStart) < Math.abs(best - claimedStart)) best = at
  }
  return best === -1 ? null : [best, best + original.length]
}

function validateReview(value: unknown, source: string) {
  const review = value as Record<string, unknown>
  const corrections = Array.isArray(review.corrections) ? review.corrections : []
  // A model that ignores the instruction and returns the learner's own text
  // back, or the corrected text again, has produced nothing worth a tab. Drop
  // it here rather than letting the screen present it as an improvement.
  const improved = text(review.improvedText, 16_000)
  const corrected = text(review.correctedText, 16_000) || source
  return {
    correctedText: corrected,
    improvedText:
      improved && improved.trim() !== source.trim() && improved.trim() !== corrected.trim()
        ? improved
        : '',
    corrections: corrections.slice(0, 30).flatMap((item) => {
      const correction = item as Record<string, unknown>
      const original = text(correction.original, 500)
      const errorType = text(correction.errorType, 40)
      const severity = text(correction.severity, 20)
      if (!ERROR_TYPES.has(errorType) || !SEVERITIES.has(severity)) return []

      const claimed = Number(correction.charStart)
      const span = locate(source, original, Number.isInteger(claimed) && claimed >= 0 ? claimed : 0)
      if (!span) return []

      return [{
        original,
        corrected: text(correction.corrected, 500),
        explanation: text(correction.explanation, 700),
        errorType,
        severity,
        charStart: span[0],
        charEnd: span[1],
      }]
    }),
    scores: {
      overall: score((review.scores as Record<string, unknown>)?.overall),
      grammar: score((review.scores as Record<string, unknown>)?.grammar),
      vocabulary: score((review.scores as Record<string, unknown>)?.vocabulary),
      fluency: score((review.scores as Record<string, unknown>)?.fluency),
    },
    summary: text(review.summary, 1_000),
    strengths: (Array.isArray(review.strengths) ? review.strengths : []).slice(0, 3).map((item) => text(item, 300)).filter(Boolean),
    nextFocus: (Array.isArray(review.nextFocus) ? review.nextFocus : []).slice(0, 3).map((item) => text(item, 300)).filter(Boolean),
  }
}

function validateLessons(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.slice(0, 3).flatMap((item) => {
    const lesson = item as Record<string, unknown>
    const errorType = text(lesson.errorType, 40)
    if (!ERROR_TYPES.has(errorType)) return []
    const examples = (Array.isArray(lesson.examples) ? lesson.examples : []).slice(0, 4).flatMap((example) => {
      const row = example as Record<string, unknown>
      const wrong = text(row.wrong, 300)
      const right = text(row.right, 300)
      return wrong && right ? [{ wrong, right, ...(text(row.note, 300) ? { note: text(row.note, 300) } : {}) }] : []
    })
    const exercises = (Array.isArray(lesson.exercises) ? lesson.exercises : []).slice(0, 5).flatMap((exercise) => {
      const row = exercise as Record<string, unknown>
      const choices = Array.isArray(row.choices) ? row.choices.slice(0, 4).map((choice) => text(choice, 200)).filter(Boolean) : []
      const answerIndex = Number(row.answerIndex)
      return choices.length >= 2 && Number.isInteger(answerIndex) && answerIndex >= 0 && answerIndex < choices.length
        ? [{ question: text(row.question, 500), choices, answerIndex, explanation: text(row.explanation, 600) }]
        : []
    })
    return [{
      errorType,
      title: text(lesson.title, 200),
      body: text(lesson.body, 4_000),
      // Capped hard: a hook is one sentence by definition, and a paragraph
      // dressed as a hook would just be the body printed twice.
      memoryHook: text(lesson.memoryHook, 240) || null,
      examples,
      exercises,
      sourceSessionId: typeof lesson.sourceSessionId === 'string' ? lesson.sourceSessionId : null,
      sourceSentence: typeof lesson.sourceSentence === 'string' ? text(lesson.sourceSentence, 1_000) : null,
    }]
  })
}

function validateVocabulary(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.slice(0, 5).flatMap((item) => {
    const word = item as Record<string, unknown>
    const entry = {
      word: text(word.word, 100),
      phonetic: text(word.phonetic, 100),
      partOfSpeech: text(word.partOfSpeech, 80),
      definition: text(word.definition, 500),
      example: text(word.example, 500),
    }
    return entry.word && entry.definition && entry.example ? [entry] : []
  })
}

function validateLevel(value: unknown, wordCount: number) {
  const row = (value ?? {}) as Record<string, unknown>
  const level = text(row.level, 2).toUpperCase()
  const confidence = text(row.confidence, 10).toLowerCase()
  const evidence = (Array.isArray(row.evidence) ? row.evidence : [])
    .slice(0, 5)
    .map((line) => text(line, 300))
    .filter(Boolean)

  // The model is told about the length rule, but it is enforced here too: a
  // short sample must never come back as C1 just because it was well written.
  const conclusive = wordCount >= 120
  let index = (CEFR_LEVELS as readonly string[]).indexOf(level)
  if (index < 0) index = (CEFR_LEVELS as readonly string[]).indexOf('B1')
  if (!conclusive) index = Math.min(index, (CEFR_LEVELS as readonly string[]).indexOf('B1'))
  if (wordCount < 60) index = Math.min(index, (CEFR_LEVELS as readonly string[]).indexOf('A2'))

  return {
    level: CEFR_LEVELS[index],
    confidence: conclusive && CONFIDENCES.has(confidence) ? confidence : 'low',
    evidence,
    conclusive,
  }
}

Deno.serve(async (request) => {
  const origin = request.headers.get('Origin')
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) })
  if (request.method !== 'POST') return respond({ error: 'Method not allowed.' }, 405, origin)

  try {
    const authorization = request.headers.get('Authorization')
    if (!authorization) return respond({ error: 'Sign in to use AI feedback.' }, 401, origin)

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, getPublishableKey(), {
      global: { headers: { Authorization: authorization } },
    })
    const { data: auth, error: authError } = await supabase.auth.getUser()
    if (authError || !auth.user) return respond({ error: 'Your sign-in session has expired.' }, 401, origin)

    const body = await request.json() as { action?: Action; input?: unknown }
    const action = body.action
    if (
      !action ||
      !['review-writing', 'review-speaking', 'generate-lessons', 'suggest-vocabulary', 'estimate-level'].includes(action)
    ) {
      return respond({ error: 'Unknown AI request.' }, 400, origin)
    }
    if (!body.input || typeof body.input !== 'object' || JSON.stringify(body.input).length > MAX_INPUT_CHARS) {
      return respond({ error: 'That request is too large.' }, 400, origin)
    }

    const apiKey = Deno.env.get('GROQ_API_KEY')
    if (!apiKey) return respond({ error: 'AI feedback is not configured yet.' }, 503, origin)

    const { name, schema } = schemaFor(action)
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: Deno.env.get('GROQ_MODEL') ?? 'openai/gpt-oss-120b',
        // gpt-oss spends reasoning tokens out of this same budget, so these sit
        // well above the size of the JSON itself. The model's ceiling is 65k.
        max_completion_tokens: action === 'generate-lessons' ? 6_000 : 4_000,
        // Structured extraction against an explicit schema — extra deliberation
        // buys nothing here and eats both the token budget and the free quota.
        reasoning_effort: 'low',
        temperature: 0.2,
        response_format: {
          type: 'json_schema',
          json_schema: { name, strict: true, schema },
        },
        messages: [{ role: 'user', content: promptFor(action, body.input as Record<string, unknown>) }],
      }),
    })
    if (!response.ok) {
      console.error('Groq request failed:', response.status, await response.text())
      return respond({ error: 'The reviewer could not check this just now. Please try again.' }, 502, origin)
    }

    const result = await response.json() as {
      choices?: Array<{ message?: { content?: string }; finish_reason?: string }>
    }
    const choice = result.choices?.[0]
    const raw = choice?.message?.content
    if (!raw) return respond({ error: 'The reviewer returned an empty response. Please try again.' }, 502, origin)
    // A length cut-off yields valid-looking but truncated JSON; fail loudly
    // rather than silently returning a half-finished review.
    if (choice?.finish_reason === 'length') {
      console.error('Groq response truncated by max_completion_tokens')
      return respond({ error: 'That was too long to review in one go. Try a shorter piece.' }, 502, origin)
    }

    const parsed = parseModelJson(raw) as Record<string, unknown>
    const input = body.input as Record<string, unknown>
    const data = action === 'review-writing'
      ? validateReview(parsed, text(input.text, 12_000))
      : action === 'review-speaking'
        ? validateReview(parsed, text(input.transcript, 12_000))
        : action === 'generate-lessons'
          ? validateLessons(parsed?.lessons)
          : action === 'suggest-vocabulary'
            ? validateVocabulary(parsed?.words)
            : validateLevel(
                parsed,
                text(input.text, 12_000).split(/[^A-Za-z\u00C0-\u024F']+/).filter(Boolean).length,
              )
    return respond({ data }, 200, origin)
  } catch (error) {
    console.error('claude-review failed:', error instanceof Error ? error.message : 'Unknown error')
    return respond({ error: 'AI feedback could not be completed. Please try again.' }, 500, origin)
  }
})
