import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, Loader2, Mic, Shuffle, Sparkles, Square } from 'lucide-react'
import { Badge, Button, Card, SectionHeading, Tabs } from '@/components/ui'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import { speechRecognitionSupported, useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { TOPICS, TOPIC_CATEGORIES, randomTopic } from '@/data/topics'
import { computeFluencyMetrics, countWords } from '@/lib/text'
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

  const visibleTopics = useMemo(
    () => (category === 'All' ? TOPICS : TOPICS.filter((t) => t.category === category)),
    [category],
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
      setSubmitError(
        err instanceof Error ? err.message : 'Something went wrong. Your transcript is safe.',
      )
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
          Choose a different topic
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
            <p className="leading-relaxed">
              Your browser cannot make a live transcript. Chrome or Edge can. You can still record
              and type what you said below, and it will be checked normally.
            </p>
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
              {finished ? 'Record again' : 'Start recording'}
            </Button>
          ) : (
            <Button onClick={handleStop} variant="danger" className="px-8 py-4 text-base">
              <Square className="size-5" />
              Stop
            </Button>
          )}

          <p className="text-center text-sm text-fg-faint">
            {active
              ? 'Listening. Speak naturally - aim for at least a minute.'
              : finished
                ? 'Check the transcript below, then get your feedback.'
                : 'Press record and talk about the topic above.'}
          </p>
        </Card>

        {/* Transcript */}
        {(liveTranscript || finished) && (
          <section>
            <SectionHeading
              title="Transcript"
              subtitle={
                finished
                  ? 'Fix anything the transcription got wrong before checking.'
                  : 'Updating as you speak.'
              }
            />
            {finished ? (
              <div className="rounded-glass glass overflow-hidden">
                <textarea
                  value={editedTranscript}
                  onChange={(e) => setEditedTranscript(e.target.value)}
                  placeholder="Type what you said, if the transcript is empty."
                  className="min-h-[25vh] w-full resize-y bg-transparent p-5 leading-relaxed text-fg outline-none placeholder:text-fg-faint"
                />
                <div className="border-t border-white/10 px-4 py-3 text-sm text-fg-faint">
                  {wordCount} words &middot;{' '}
                  {recorder.seconds > 0
                    ? `${Math.round(wordCount / (recorder.seconds / 60))} words per minute`
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
                  Checking...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Check my speaking
                </>
              )}
            </Button>
            {wordCount < 10 && (
              <span className="text-sm text-fg-faint">
                Say or type at least 10 words to get feedback.
              </span>
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
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Speaking practice</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Record yourself talking about a topic. You get a transcript, your speed, your filler
          words, and the same corrections as writing.
        </p>
      </header>

      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-fg">Not sure what to talk about?</p>
          <p className="mt-0.5 text-sm text-fg-faint">Let the app pick one for you.</p>
        </div>
        <Button onClick={() => setTopic(randomTopic())}>
          <Shuffle className="size-4" />
          Surprise me
        </Button>
      </Card>

      <section>
        <SectionHeading title="Choose a topic" />
        <Tabs
          tabs={[
            { id: 'All', label: 'All', count: TOPICS.length },
            ...TOPIC_CATEGORIES.map((c) => ({
              id: c,
              label: c,
              count: TOPICS.filter((t) => t.category === c).length,
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
