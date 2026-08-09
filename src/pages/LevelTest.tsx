import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, Gauge, Loader2, Shuffle, Sparkles } from 'lucide-react'
import { Badge, Button, Card, SectionHeading } from '@/components/ui'
import { placementPrompt } from '@/data/placement'
import type { PlacementPrompt } from '@/data/placement'
import { useAsync } from '@/hooks/useAsync'
import { useLanguage, useT } from '@/i18n'
import { MIN_WORDS_FOR_LEVEL } from '@/lib/level'
import { practiceErrorMessage } from '@/lib/practiceError'
import { submitPlacement } from '@/lib/session'
import { countWords } from '@/lib/text'
import { formatDuration } from '@/lib/utils'
import { useRepo } from '@/services/db'
import type { LevelEstimate, PracticeSession } from '@/types'

const DRAFT_KEY = 'englishos.draft.placement'

/** The prompt used last time, so retaking never hands back the same question. */
const LAST_PROMPT_KEY = 'englishos.placement.lastPrompt'

/**
 * A pacing aid, not an exam clock. When it runs out the page says so and
 * nothing else happens: cutting someone off mid-sentence would measure their
 * typing speed, not their language.
 */
const TIME_LIMIT_SECONDS = 10 * 60

/**
 * The shortest answer worth judging at all. Below MIN_WORDS_FOR_LEVEL the
 * estimate is a floor rather than a level, and the result screen says so - but
 * a real A1 learner may never reach 120 words, and refusing to place them
 * would fail exactly the person the test is for.
 */
const MIN_WORDS_TO_SUBMIT = 40

type Stage = 'intro' | 'writing' | 'result'

interface Draft {
  prompt: PlacementPrompt
  text: string
  seconds: number
}

function readLastPromptId(): string | undefined {
  try {
    return localStorage.getItem(LAST_PROMPT_KEY) ?? undefined
  } catch {
    return undefined
  }
}

export default function LevelTest() {
  const navigate = useNavigate()
  const repo = useRepo()
  const { language } = useLanguage()
  const t = useT()
  const { data: profile } = useAsync(() => repo.getProfile(), [])

  const [stage, setStage] = useState<Stage>('intro')
  const [prompt, setPrompt] = useState<PlacementPrompt>(() =>
    placementPrompt(language, readLastPromptId()),
  )
  const [text, setText] = useState('')
  const [seconds, setSeconds] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ session: PracticeSession; estimate: LevelEstimate } | null>(
    null,
  )
  const [decision, setDecision] = useState<'applied' | 'kept' | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  /**
   * Set synchronously by the restore effect, which runs before the language
   * effect below. A `stage` check there would read the value from the render
   * that queued both, and swap the prompt out from under restored writing.
   */
  const restoredDraft = useRef(false)

  const wordCount = useMemo(() => countWords(text), [text])
  const progress = Math.min(100, (wordCount / MIN_WORDS_FOR_LEVEL) * 100)
  const remaining = Math.max(0, TIME_LIMIT_SECONDS - seconds)

  // Restore an unfinished attempt, so a refresh in the middle of the test does
  // not throw away ten minutes of writing.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return
      const draft = JSON.parse(raw) as Draft
      if (draft.prompt?.id && draft.text) {
        restoredDraft.current = true
        setPrompt(draft.prompt)
        setText(draft.text)
        setSeconds(draft.seconds ?? 0)
        setStage('writing')
      }
    } catch {
      /* ignore a corrupt draft */
    }
  }, [])

  useEffect(() => {
    if (stage !== 'writing') return
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ prompt, text, seconds } satisfies Draft))
  }, [stage, prompt, text, seconds])

  // The interface language settles a moment after first paint, once the profile
  // has loaded. Re-draw the prompt if it turns out to be the wrong language -
  // but never while someone is already writing against it.
  useEffect(() => {
    if (stage !== 'intro' || restoredDraft.current) return
    setPrompt((current) =>
      current.language === language ? current : placementPrompt(language, readLastPromptId()),
    )
  }, [language, stage])

  useEffect(() => {
    if (stage !== 'writing' || submitting) return
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [stage, submitting])

  useEffect(() => {
    if (stage === 'writing') textareaRef.current?.focus()
  }, [stage])

  function start() {
    setStage('writing')
    setError(null)
  }

  function quit() {
    localStorage.removeItem(DRAFT_KEY)
    restoredDraft.current = false
    setStage('intro')
    setText('')
    setSeconds(0)
  }

  async function handleSubmit() {
    if (wordCount < MIN_WORDS_TO_SUBMIT || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const placement = await submitPlacement({
        kind: 'writing',
        topicTitle: prompt.title,
        prompt: prompt.prompt,
        content: text.trim(),
        durationSeconds: seconds,
      })
      localStorage.removeItem(DRAFT_KEY)
      try {
        localStorage.setItem(LAST_PROMPT_KEY, prompt.id)
      } catch {
        /* only costs a repeated prompt next time */
      }
      setResult(placement)
      setStage('result')
    } catch (err) {
      setError(practiceErrorMessage(err, t, 'placement.failed'))
    } finally {
      setSubmitting(false)
    }
  }

  /**
   * Adopt the measured level.
   *
   * The profile is re-read rather than reused: submitting the test already
   * wrote `writingLevel`, so the copy loaded when this page opened is stale and
   * spreading it would undo that.
   */
  async function accept(): Promise<void> {
    if (!result) return
    const current = await repo.getProfile()
    await repo.saveProfile({ ...current, level: result.estimate.level })
    setDecision('applied')
  }

  function retake() {
    restoredDraft.current = false
    setResult(null)
    setDecision(null)
    setText('')
    setSeconds(0)
    setPrompt(placementPrompt(language, readLastPromptId()))
    setStage('intro')
  }

  /* ----------------------------------------------------------------- intro */
  if (stage === 'intro') {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('placement.title')}</h1>
          <p className="mt-1 text-sm text-fg-muted">{t('placement.subtitle')}</p>
        </header>

        <Card>
          <SectionHeading title={t('placement.howTitle')} />
          <ul className="space-y-3 text-sm leading-relaxed text-fg-muted">
            {[
              t('placement.how1', { target: MIN_WORDS_FOR_LEVEL }),
              t('placement.how2'),
              t('placement.how3'),
            ].map((line) => (
              <li key={line} className="flex gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-good" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-3">
            <Badge tone="violet">{t('placement.yourTopic')}</Badge>
            <button
              type="button"
              onClick={() => setPrompt(placementPrompt(language, prompt.id))}
              className="inline-flex items-center gap-1.5 text-sm text-fg-muted transition hover:text-fg"
            >
              <Shuffle className="size-4" />
              {t('placement.differentTopic')}
            </button>
          </div>
          <h2 className="mt-3 text-xl font-bold tracking-tight">{prompt.title}</h2>
          <p className="mt-2 leading-relaxed text-fg-muted">{prompt.prompt}</p>
        </Card>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={start}>
            <Gauge className="size-4" />
            {t('placement.start')}
          </Button>
          <Button variant="ghost" onClick={() => navigate('/')}>
            {t('placement.notNow')}
          </Button>
        </div>
      </div>
    )
  }

  /* --------------------------------------------------------------- writing */
  if (stage === 'writing') {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <Card>
          <Badge tone="violet">{t('placement.yourTopic')}</Badge>
          <h1 className="mt-3 text-xl font-bold tracking-tight">{prompt.title}</h1>
          <p className="mt-2 leading-relaxed text-fg-muted">{prompt.prompt}</p>
        </Card>

        <div className="rounded-glass glass overflow-hidden">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={submitting}
            placeholder={t('placement.placeholder')}
            className="min-h-[45vh] w-full resize-y bg-transparent p-5 text-base leading-relaxed text-fg outline-none placeholder:text-fg-faint disabled:opacity-60"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
            <div className="flex items-center gap-4 text-sm text-fg-faint">
              <span className={wordCount >= MIN_WORDS_FOR_LEVEL ? 'text-good' : undefined}>
                {t('placement.words', { count: wordCount, target: MIN_WORDS_FOR_LEVEL })}
              </span>
              <span className={remaining === 0 ? 'text-warn' : undefined}>
                {t('placement.timeLeft', { time: formatDuration(remaining) })}
              </span>
            </div>
            <div className="h-1 w-full max-w-40 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-neon transition-[width] duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {remaining === 0 && (
          <p className="rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn">
            {t('placement.timeUp')}
          </p>
        )}

        {error && (
          <p className="rounded-xl border border-bad/30 bg-bad/15 px-4 py-3 text-sm text-bad">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleSubmit} disabled={wordCount < MIN_WORDS_TO_SUBMIT || submitting}>
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t('placement.checking')}
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                {t('placement.submit')}
              </>
            )}
          </Button>
          {wordCount < MIN_WORDS_TO_SUBMIT && (
            <span className="text-sm text-fg-faint">
              {t('placement.tooShort', { count: MIN_WORDS_TO_SUBMIT })}
            </span>
          )}
          {!submitting && (
            <Button variant="ghost" onClick={quit}>
              {t('placement.quit')}
            </Button>
          )}
        </div>
      </div>
    )
  }

  /* ---------------------------------------------------------------- result */
  if (!result) return null
  const { session, estimate } = result
  const confidenceLabel = t(
    estimate.confidence === 'high'
      ? 'placement.confidenceHigh'
      : estimate.confidence === 'medium'
        ? 'placement.confidenceMedium'
        : 'placement.confidenceLow',
  )
  const currentLevel = profile?.level ?? 'B1'

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="text-center">
        <p className="text-sm text-fg-muted">{t('placement.resultTitle')}</p>
        <p className="mt-2 text-6xl font-extrabold tracking-tight text-gradient">
          {estimate.level}
        </p>
        <p className="mt-2 text-sm text-fg-muted">
          {estimate.conclusive
            ? t('placement.resultAbout', { level: estimate.level })
            : t('placement.resultFloor', { level: estimate.level })}
        </p>
        <p className="mt-1 text-sm text-fg-faint">{t(`level.${estimate.level}`)}</p>
        <div className="mt-4 flex justify-center">
          <Badge tone={estimate.confidence === 'high' ? 'good' : estimate.confidence === 'medium' ? 'info' : 'warn'}>
            {confidenceLabel}
          </Badge>
        </div>
      </Card>

      {!estimate.conclusive && (
        <p className="rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm leading-relaxed text-warn">
          {t('placement.shortSample', {
            count: session.wordCount,
            target: MIN_WORDS_FOR_LEVEL,
          })}
        </p>
      )}

      <Card>
        <SectionHeading title={t('placement.whyTitle')} />
        <ul className="space-y-2.5 text-sm leading-relaxed text-fg-muted">
          {estimate.evidence.map((line) => (
            <li key={line} className="flex gap-2.5">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-violet" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </Card>

      {decision === null ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={accept}>{t('placement.use', { level: estimate.level })}</Button>
          <Button variant="outline" onClick={() => setDecision('kept')}>
            {t('placement.keep', { level: currentLevel })}
          </Button>
        </div>
      ) : (
        <p className="inline-flex items-center gap-2 rounded-xl border border-good/25 bg-good/10 px-4 py-3 text-sm text-good">
          <Check className="size-4 shrink-0" />
          {decision === 'applied'
            ? t('placement.applied', { level: estimate.level })
            : t('placement.kept', { level: currentLevel })}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-5">
        <Link to={`/session/${session.id}`}>
          <Button variant="outline">{t('placement.seeCorrections')}</Button>
        </Link>
        <Button variant="ghost" onClick={retake}>
          {t('placement.retake')}
        </Button>
        <Button variant="ghost" onClick={() => navigate('/')}>
          {t('placement.backToDashboard')}
        </Button>
      </div>
    </div>
  )
}
