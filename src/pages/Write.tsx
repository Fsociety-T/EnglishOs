import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, PenLine, Shuffle, Sparkles } from 'lucide-react'
import { Badge, Button, Card, SectionHeading, Tabs } from '@/components/ui'
import { randomTopic, topicCategoriesFor, topicsFor } from '@/data/topics'
import { countWords } from '@/lib/text'
import { useLanguage, useT } from '@/i18n'
import { practiceErrorMessage } from '@/lib/practiceError'
import { submitPractice } from '@/lib/session'
import { formatDuration } from '@/lib/utils'
import type { Topic } from '@/types'

const DRAFT_KEY = 'englishos.draft.writing'

/** Roughly the shortest answer that produces feedback worth reading. */
const TARGET_WORDS = 120

export default function Write() {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const t = useT()
  const [topic, setTopic] = useState<Topic | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')
  const [text, setText] = useState('')
  const [category, setCategory] = useState<string>('All')
  const [seconds, setSeconds] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const wordCount = useMemo(() => countWords(text), [text])
  const progress = Math.min(100, (wordCount / TARGET_WORDS) * 100)

  // Restore an unfinished draft so a refresh or a closed tab never loses work.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return
      const draft = JSON.parse(raw) as { topic: Topic; text: string; seconds: number }
      if (draft.topic && draft.text) {
        setTopic(draft.topic)
        setText(draft.text)
        setSeconds(draft.seconds ?? 0)
      }
    } catch {
      /* ignore a corrupt draft */
    }
  }, [])

  useEffect(() => {
    if (!topic) return
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ topic, text, seconds }))
  }, [topic, text, seconds])

  // Count only while a topic is open, so the timer reflects real writing time.
  useEffect(() => {
    if (!topic || submitting) return
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [topic, submitting])

  useEffect(() => {
    if (topic) textareaRef.current?.focus()
  }, [topic])

  const allTopics = useMemo(() => topicsFor(language), [language])
  const visibleTopics = useMemo(
    () => (category === 'All' ? allTopics : allTopics.filter((t) => t.category === category)),
    [allTopics, category],
  )

  async function handleSubmit() {
    if (!topic || wordCount < 10 || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const session = await submitPractice({
        kind: 'writing',
        topicTitle: topic.title,
        prompt: topic.prompt,
        content: text.trim(),
        durationSeconds: seconds,
      })
      localStorage.removeItem(DRAFT_KEY)
      navigate(`/session/${session.id}`)
    } catch (err) {
      setError(practiceErrorMessage(err, t, 'write.failed'))
      setSubmitting(false)
    }
  }

  function startCustom() {
    const prompt = customPrompt.trim()
    if (!prompt) return
    setTopic({
      id: 'custom',
      language,
      title: prompt.length > 60 ? `${prompt.slice(0, 57)}...` : prompt,
      prompt,
      category: t('write.ownCategory'),
      level: 'B1',
    })
  }

  /* ---------------------------------------------------------------- editor */
  if (topic) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => {
            setTopic(null)
            setText('')
            setSeconds(0)
            localStorage.removeItem(DRAFT_KEY)
          }}
          className="inline-flex items-center gap-1.5 text-sm text-fg-muted transition hover:text-fg"
        >
          <ArrowLeft className="size-4" />
          {t('write.changeTopic')}
        </button>

        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="violet">{topic.category}</Badge>
            <Badge>{topic.level}</Badge>
          </div>
          <h1 className="mt-3 text-xl font-bold tracking-tight">{topic.title}</h1>
          <p className="mt-2 leading-relaxed text-fg-muted">{topic.prompt}</p>
        </Card>

        <div className="rounded-glass glass overflow-hidden">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={submitting}
            placeholder={t('write.placeholder')}
            className="min-h-[45vh] w-full resize-y bg-transparent p-5 text-base leading-relaxed text-fg outline-none placeholder:text-fg-faint disabled:opacity-60"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
            <div className="flex items-center gap-4 text-sm text-fg-faint">
              <span className={wordCount >= TARGET_WORDS ? 'text-good' : undefined}>
                {t('write.wordCount', { count: wordCount, target: TARGET_WORDS })}
              </span>
              <span>{formatDuration(seconds)}</span>
            </div>
            <div className="h-1 w-full max-w-40 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-neon transition-[width] duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="rounded-xl border border-bad/30 bg-bad/15 px-4 py-3 text-sm text-bad">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleSubmit} disabled={wordCount < 10 || submitting}>
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t('write.checking')}
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                {t('write.check')}
              </>
            )}
          </Button>
          {wordCount < 10 && (
            <span className="text-sm text-fg-faint">{t('write.tooShort')}</span>
          )}
        </div>
      </div>
    )
  }

  /* --------------------------------------------------------- topic picker */
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('write.title')}</h1>
        <p className="mt-1 text-sm text-fg-muted">{t('write.subtitle')}</p>
      </header>

      <Card>
        <SectionHeading
          title={t('write.ownIdea')}
          subtitle={t('write.ownIdeaSub')}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && startCustom()}
            placeholder={t('write.ownPlaceholder')}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-fg outline-none placeholder:text-fg-faint focus:border-violet/50"
          />
          <Button onClick={startCustom} disabled={!customPrompt.trim()}>
            <PenLine className="size-4" />
            {t('write.start')}
          </Button>
          <Button variant="outline" onClick={() => setTopic(randomTopic(language))}>
            <Shuffle className="size-4" />
            {t('write.surprise')}
          </Button>
        </div>
      </Card>

      <section>
        <SectionHeading title={t('write.library')} />
        <Tabs
          tabs={[
            { id: 'All', label: t('lessons.all'), count: allTopics.length },
            ...topicCategoriesFor(language).map((c) => ({
              id: c,
              label: c,
              count: allTopics.filter((t) => t.category === c).length,
            })),
          ]}
          active={category}
          onChange={setCategory}
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleTopics.map((t) => (
            <Card key={t.id} onClick={() => setTopic(t)} className="h-full">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-fg">{t.title}</h3>
                <Badge>{t.level}</Badge>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-fg-faint">{t.prompt}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
