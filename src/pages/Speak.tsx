import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, Loader2, Mic, Shuffle, Sparkles, Square } from 'lucide-react'
import { Badge, Button, Card, SectionHeading, Tabs } from '@/components/ui'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import { speechRecognitionSupported, useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { randomTopic, topicCategoriesFor, topicsFor } from '@/data/topics'
import { computeFluencyMetrics, countWords } from '@/lib/text'
import { useLanguage, useT } from '@/i18n'
import { practiceErrorMessage } from '@/lib/practiceError'
import { submitPractice } from '@/lib/session'
import { cn, formatDuration } from '@/lib/utils'
import type { Topic } from '@/types'

function Waveform({ levels, active }: { levels: number[]; active: boolean }) {
  return (
    <div className="flex h-16 items-center justify-center gap-[3px]">
      {levels.map((level, i) => (
        <span
          key={i}
          className={cn(
            'w-1.5 rounded-full transition-[height] duration-75',
            active ? 'bg-neon' : 'bg-white/10',
          )}
          style={{ height: `${Math.max(4, level * 100)}%` }}
        />
      ))}
    </div>
  )
}

export default function Speak() {
  const navigate = useNavigate()
  const { language } = useLanguage()
  const t = useT()
  const [topic, setTopic] = useState<Topic | null>(null)
  const [category, setCategory] = useState('All')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [finished, setFinished] = useState(false)
  const [editedTranscript, setEditedTranscript] = useState('')

  const recorder = useAudioRecorder()
  const speech = useSpeechRecognition()

  const liveTranscript = speech.transcript + (speech.interim ? ` ${speech.interim}` : '')
  const finalTranscript = finished ? editedTranscript : liveTranscript
  const wordCount = countWords(finalTranscript)

  const allTopics = useMemo(() => topicsFor(language), [language])
  const visibleTopics = useMemo(
    () => (category === 'All' ? allTopics : allTopics.filter((t) => t.category === category)),
    [allTopics, category],
  )

  // Keep the editable copy in sync until the learner stops and takes over.
  useEffect(() => {
    if (!finished) setEditedTranscript(speech.transcript)
  }, [speech.transcript, finished])

  async function handleStart() {
    setFinished(false)
    setSubmitError(null)
    speech.reset()
    recorder.reset()
    await recorder.start()
    if (speechRecognitionSupported) speech.start()
  }

  function handleStop() {
    recorder.stop()
    speech.stop()
    setFinished(true)
  }

  async function handleSubmit() {
    if (!topic || wordCount < 10 || submitting) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const metrics = computeFluencyMetrics(
        finalTranscript,
        recorder.seconds,
        speech.longPauses,
      )
      const session = await submitPractice({
        kind: 'speaking',
        topicTitle: topic.title,
        prompt: topic.prompt,
        content: finalTranscript.trim(),
        durationSeconds: recorder.seconds,
        metrics,
      })
      navigate(`/session/${session.id}`)
    } catch (err) {
      setSubmitError(practiceErrorMessage(err, t, 'speak.failed'))
      setSubmitting(false)
    }
  }

  /* ------------------------------------------------------------- recorder */
  if (topic) {
    const active = recorder.recording
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => {
            recorder.stop()
            speech.stop()
            setTopic(null)
            setFinished(false)
          }}
          className="inline-flex items-center gap-1.5 text-sm text-fg-muted transition hover:text-fg"
        >
          <ArrowLeft className="size-4" />
          {t('speak.changeTopic')}
        </button>

        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="violet">{topic.category}</Badge>
            <Badge>{topic.level}</Badge>
          </div>
          <h1 className="mt-3 text-xl font-bold tracking-tight">{topic.title}</h1>
          <p className="mt-2 leading-relaxed text-fg-muted">{topic.prompt}</p>
        </Card>

        {!speechRecognitionSupported && (
          <div className="flex gap-3 rounded-xl border border-warn/30 bg-warn/15 px-4 py-3 text-sm text-warn">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p className="leading-relaxed">{t('speak.noSpeechApi')}</p>
          </div>
        )}

        {(recorder.error || speech.error) && (
          <p className="rounded-xl border border-bad/30 bg-bad/15 px-4 py-3 text-sm text-bad">
            {recorder.error ?? speech.error}
          </p>
        )}

        {/* Recorder */}
        <Card className="flex flex-col items-center gap-5 py-8">
          <Waveform levels={recorder.levels} active={active} />

          <p className="font-mono text-3xl font-bold tabular-nums">
            {formatDuration(recorder.seconds)}
          </p>

          {!active ? (
            <Button onClick={handleStart} className="px-8 py-4 text-base">
              <Mic className="size-5" />
              {finished ? t('speak.recordAgain') : t('speak.startRecording')}
            </Button>
          ) : (
            <Button onClick={handleStop} variant="danger" className="px-8 py-4 text-base">
              <Square className="size-5" />
              {t('speak.stop')}
            </Button>
          )}

          <p className="text-center text-sm text-fg-faint">
            {active
              ? t('speak.listening')
              : finished
                ? t('speak.reviewTranscript')
                : t('speak.pressRecord')}
          </p>
        </Card>

        {/* Transcript */}
        {(liveTranscript || finished) && (
          <section>
            <SectionHeading
              title={t('speak.transcript')}
              subtitle={
                finished ? t('speak.transcriptFixable') : t('speak.transcriptLive')
              }
            />
            {finished ? (
              <div className="rounded-glass glass overflow-hidden">
                <textarea
                  value={editedTranscript}
                  onChange={(e) => setEditedTranscript(e.target.value)}
                  placeholder={t('speak.transcriptPlaceholder')}
                  className="min-h-[25vh] w-full resize-y bg-transparent p-5 leading-relaxed text-fg outline-none placeholder:text-fg-faint"
                />
                <div className="border-t border-white/10 px-4 py-3 text-sm text-fg-faint">
                  {wordCount} {t('dash.words')} &middot;{' '}
                  {recorder.seconds > 0
                    ? t('speak.wordsPerMinute', {
                        count: Math.round(wordCount / (recorder.seconds / 60)),
                      })
                    : '-'}
                </div>
              </div>
            ) : (
              <Card>
                <p className="leading-relaxed">
                  <span className="text-fg">{speech.transcript}</span>{' '}
                  <span className="text-fg-faint italic">{speech.interim}</span>
                </p>
              </Card>
            )}
          </section>
        )}

        {submitError && (
          <p className="rounded-xl border border-bad/30 bg-bad/15 px-4 py-3 text-sm text-bad">
            {submitError}
          </p>
        )}

        {finished && (
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleSubmit} disabled={wordCount < 10 || submitting}>
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t('speak.checking')}
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  {t('speak.check')}
                </>
              )}
            </Button>
            {wordCount < 10 && (
              <span className="text-sm text-fg-faint">{t('speak.tooShort')}</span>
            )}
          </div>
        )}
      </div>
    )
  }

  /* --------------------------------------------------------- topic picker */
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('speak.title')}</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {t('speak.subtitle')}
        </p>
      </header>

      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-fg">{t('speak.noIdea')}</p>
          <p className="mt-0.5 text-sm text-fg-faint">{t('speak.noIdeaSub')}</p>
        </div>
        <Button onClick={() => setTopic(randomTopic(language))}>
          <Shuffle className="size-4" />
          {t('speak.surprise')}
        </Button>
      </Card>

      <section>
        <SectionHeading title={t('speak.chooseTopic')} />
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
