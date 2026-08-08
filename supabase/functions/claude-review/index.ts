import { createClient } from 'npm:@supabase/supabase-js@2'

type Action = 'review-writing' | 'review-speaking' | 'generate-lessons' | 'suggest-vocabulary'

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

function reviewPrompt(kind: 'writing' | 'speaking', input: Record<string, unknown>): string {
  const learnerText = text(kind === 'writing' ? input.text : input.transcript, 12_000)
  const metrics = kind === 'speaking' ? input.metrics : undefined
  return `You are an expert, encouraging English teacher. Review the learner's ${kind} at CEFR ${text(input.level, 8)}. Correct only genuine issues; do not rewrite for style alone. Every correction's charStart and charEnd must be JavaScript string offsets into the exact learner text, and original must equal text.slice(charStart, charEnd). Return a single JSON object and nothing else.\n\nRequired schema:\n{"correctedText":"string","corrections":[{"original":"string","corrected":"string","explanation":"plain English","errorType":"verb-tense|article|preposition|word-order|subject-verb-agreement|plural|spelling|collocation|punctuation|word-choice|other","severity":"minor|moderate|major","charStart":0,"charEnd":0}],"scores":{"overall":0,"grammar":0,"vocabulary":0,"fluency":0},"summary":"1-2 specific encouraging sentences","strengths":["string"],"nextFocus":["string"]}\n\nTopic: ${text(input.topic, 300)}\n${metrics ? `Local speaking metrics (do not invent audio facts): ${JSON.stringify(metrics)}\n` : ''}Learner text:\n${learnerText}`
}

function lessonsPrompt(input: Record<string, unknown>): string {
  const corrections = Array.isArray(input.corrections) ? input.corrections.slice(0, 20) : []
  return `You are an English teacher creating concise personalised mini-lessons for CEFR ${text(input.level, 8)}. Use the learner's actual mistakes. Return one to three lessons, grouped by the most important error types, as a JSON array only.\n\nRequired schema:\n[{"errorType":"one allowed error type","title":"string","body":"short markdown explanation","examples":[{"wrong":"string","right":"string","note":"optional string"}],"exercises":[{"question":"string","choices":["string","string","string","string"],"answerIndex":0,"explanation":"string"}],"sourceSessionId":"string or null","sourceSentence":"string or null"}]\n\nCorrections: ${JSON.stringify(corrections)}\nSource text: ${text(input.sourceText, 12_000)}`
}

function vocabularyPrompt(input: Record<string, unknown>): string {
  return `Suggest five useful English vocabulary words for a CEFR ${text(input.level, 8)} learner based on the text below. Do not repeat words already used in the text. Return a JSON array only.\n\nRequired schema:\n[{"word":"string","phonetic":"optional IPA string","partOfSpeech":"string","definition":"clear short definition","example":"natural example sentence"}]\n\nText:\n${text(input.text, 12_000)}`
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
  }
}

function validateReview(value: unknown, source: string) {
  const review = value as Record<string, unknown>
  const corrections = Array.isArray(review.corrections) ? review.corrections : []
  return {
    correctedText: text(review.correctedText, 16_000) || source,
    corrections: corrections.slice(0, 30).flatMap((item) => {
      const correction = item as Record<string, unknown>
      const charStart = Number(correction.charStart)
      const charEnd = Number(correction.charEnd)
      const original = text(correction.original, 500)
      const errorType = text(correction.errorType, 40)
      const severity = text(correction.severity, 20)
      if (
        !Number.isInteger(charStart) || !Number.isInteger(charEnd) || charStart < 0 || charEnd <= charStart ||
        charEnd > source.length || source.slice(charStart, charEnd) !== original || !ERROR_TYPES.has(errorType) ||
        !SEVERITIES.has(severity)
      ) return []
      return [{
        original,
        corrected: text(correction.corrected, 500),
        explanation: text(correction.explanation, 700),
        errorType,
        severity,
        charStart,
        charEnd,
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
    if (!action || !['review-writing', 'review-speaking', 'generate-lessons', 'suggest-vocabulary'].includes(action)) {
      return respond({ error: 'Unknown AI request.' }, 400, origin)
    }
    if (!body.input || typeof body.input !== 'object' || JSON.stringify(body.input).length > MAX_INPUT_CHARS) {
      return respond({ error: 'That request is too large.' }, 400, origin)
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) return respond({ error: 'AI feedback is not configured yet.' }, 503, origin)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-sonnet-4-20250514',
        max_tokens: action === 'generate-lessons' ? 2_500 : 1_500,
        temperature: 0.2,
        messages: [{ role: 'user', content: promptFor(action, body.input as Record<string, unknown>) }],
      }),
    })
    if (!response.ok) {
      console.error('Anthropic request failed:', response.status)
      return respond({ error: 'Claude could not review this just now. Please try again.' }, 502, origin)
    }

    const result = await response.json() as { content?: Array<{ type?: string; text?: string }> }
    const raw = result.content?.find((part) => part.type === 'text')?.text
    if (!raw) return respond({ error: 'Claude returned an empty response. Please try again.' }, 502, origin)

    const parsed = parseModelJson(raw)
    const input = body.input as Record<string, unknown>
    const data = action === 'review-writing'
      ? validateReview(parsed, text(input.text, 12_000))
      : action === 'review-speaking'
        ? validateReview(parsed, text(input.transcript, 12_000))
        : action === 'generate-lessons'
          ? validateLessons(parsed)
          : validateVocabulary(parsed)
    return respond({ data }, 200, origin)
  } catch (error) {
    console.error('claude-review failed:', error instanceof Error ? error.message : 'Unknown error')
    return respond({ error: 'AI feedback could not be completed. Please try again.' }, 500, origin)
  }
})
