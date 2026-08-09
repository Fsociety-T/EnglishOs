import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BookmarkPlus,
  Check,
  CheckCircle2,
  GraduationCap,
  Mic,
  PenLine,
  RotateCcw,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { Badge, Button, Card, ProgressRing, SectionHeading, Spinner, Tabs } from '@/components/ui'
import { useLanguage } from '@/i18n'
import { useLessons } from '@/hooks/useContent'
import { useAsync } from '@/hooks/useAsync'
import { ERROR_TONE, SEVERITY_LABEL, scoreTone } from '@/lib/errorStyles'
import { cn, formatDuration, formatRelative, newId } from '@/lib/utils'
import { ai } from '@/services/ai'
import { useRepo } from '@/services/db'
import type { Correction, PracticeSession } from '@/types'
import { ERROR_TYPE_LABEL } from '@/types'

type Segment =
  | { kind: 'text'; text: string }
  | { kind: 'error'; text: string; correction: Correction }

/** Slice the text into plain runs and error runs using the stored offsets. */
function buildSegments(content: string, corrections: Correction[]): Segment[] {
  const ordered = [...corrections].sort((a, b) => a.charStart - b.charStart)
  const segments: Segment[] = []
  let cursor = 0

  for (const correction of ordered) {
    // Guard against an offset that no longer lines up with the text.
    if (correction.charStart < cursor || correction.charEnd > content.length) continue
    if (correction.charStart > cursor) {
      segments.push({ kind: 'text', text: content.slice(cursor, correction.charStart) })
    }
    segments.push({
      kind: 'error',
      text: content.slice(correction.charStart, correction.charEnd),
      correction,
    })
    cursor = correction.charEnd
  }
  if (cursor < content.length) segments.push({ kind: 'text', text: content.slice(cursor) })
  return segments
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const tone = scoreTone(value)
  const barTone =
    tone === 'good' ? 'bg-good' : tone === 'warn' ? 'bg-warn' : 'bg-bad'
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-fg-muted">{label}</span>
        <span className="font-semibold text-fg">{value}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={cn('h-full rounded-full transition-[width] duration-700', barTone)}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  )
}

export default function SessionView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const repo = useRepo()
  const { language } = useLanguage()

  const [view, setView] = useState<'yours' | 'corrected'>('yours')
  const [selected, setSelected] = useState<Correction | null>(null)
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set())

  const { data: session, loading } = useAsync<PracticeSession | null>(
    () => (id ? repo.getSession(id) : Promise.resolve(null)),
    [id],
  )
  const { data: lessons } = useLessons([id])
  const { data: suggestions } = useAsync(
    () => (session ? ai.suggestVocabulary({ text: session.content, level: 'B1', language: session.language }) : Promise.resolve([])),
    [session?.id],
  )

  const segments = useMemo(
    () => (session ? buildSegments(session.content, session.corrections) : []),
    [session],
  )

  const correctedText = useMemo(() => {
    if (!session) return ''
    let out = session.content
    const ordered = [...session.corrections].sort((a, b) => b.charStart - a.charStart)
    for (const c of ordered) out = out.slice(0, c.charStart) + c.corrected + out.slice(c.charEnd)
    return out
  }, [session])

  const sessionLessons = (lessons ?? []).filter((l) => l.sourceSessionId === session?.id)

  async function saveWord(word: {
    word: string
    phonetic?: string
    partOfSpeech?: string
    definition: string
    example: string
  }) {
    if (savedWords.has(word.word)) return
    await repo.addWord({
      id: newId(),
      language,
      word: word.word,
      phonetic: word.phonetic,
      partOfSpeech: word.partOfSpeech,
      definition: word.definition,
      example: word.example,
      tags: [],
      source: session?.kind === 'speaking' ? 'speaking' : 'writing',
      sourceId: session?.id ?? null,
      srsBox: 1,
      nextReviewAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    })
    await repo.recordActivity({ wordsLearned: 1 })
    setSavedWords((prev) => new Set(prev).add(word.word))
  }

  if (loading) return <Spinner label="Loading your session..." />

  if (!session) {
    return (
      <Card>
        <p className="text-fg-muted">That session could not be found.</p>
        <div className="mt-4">
          <Link to="/">
            <Button variant="outline">Back to dashboard</Button>
          </Link>
        </div>
      </Card>
    )
  }

  const errorCount = session.corrections.length

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-fg-muted transition hover:text-fg"
      >
        <ArrowLeft className="size-4" />
        Back
      </button>

      {/* Header */}
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="violet">
            {session.kind === 'writing' ? (
              <>
                <PenLine className="size-3" /> Writing
              </>
            ) : (
              <>
                <Mic className="size-3" /> Speaking
              </>
            )}
          </Badge>
          <Badge>{session.wordCount} words</Badge>
          <Badge>{formatDuration(session.durationSeconds)}</Badge>
          <span className="text-sm text-fg-faint">{formatRelative(session.createdAt)}</span>
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">{session.topicTitle}</h1>
      </header>

      {/* Scores */}
      <Card className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
        <ProgressRing value={session.scores.overall} sublabel="overall" size={124} />
        <div className="w-full flex-1 space-y-3">
          <ScoreBar label="Grammar" value={session.scores.grammar} />
          <ScoreBar label="Vocabulary" value={session.scores.vocabulary} />
          <ScoreBar
            label={session.kind === 'speaking' ? 'Fluency' : 'Sentence flow'}
            value={session.scores.fluency}
          />
        </div>
      </Card>

      <Card>
        <p className="leading-relaxed text-fg">{session.summary}</p>
        {!ai.isReal && (
          <p className="mt-3 text-xs leading-relaxed text-fg-faint">
            Checked by the offline practice engine. It finds common mistakes reliably, but it is
            not the full AI yet, so it will miss things a real reviewer would catch.
          </p>
        )}
      </Card>

      {/* Speaking metrics */}
      {session.metrics && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs text-fg-faint">Speed</p>
            <p className="mt-1 text-xl font-bold">
              {session.metrics.wordsPerMinute}
              <span className="ml-1 text-sm font-medium text-fg-faint">wpm</span>
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-fg-faint">Filler words</p>
            <p className="mt-1 text-xl font-bold">{session.metrics.fillerCount}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-fg-faint">Long pauses</p>
            <p className="mt-1 text-xl font-bold">{session.metrics.longPauses}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-fg-faint">Word variety</p>
            <p className="mt-1 text-xl font-bold">
              {Math.round(session.metrics.uniqueWordRatio * 100)}
              <span className="ml-0.5 text-sm font-medium text-fg-faint">%</span>
            </p>
          </Card>
        </div>
      )}

      {/* The text */}
      <section>
        <SectionHeading
          title={errorCount === 0 ? 'Your text' : `Your text with ${errorCount} corrections`}
          subtitle={errorCount === 0 ? undefined : 'Tap any highlighted part to see why.'}
        />
        <div className="mb-3 max-w-xs">
          <Tabs
            tabs={[
              { id: 'yours', label: 'What you wrote' },
              { id: 'corrected', label: 'Corrected' },
            ]}
            active={view}
            onChange={setView}
          />
        </div>

        <Card>
          {view === 'yours' ? (
            <p className="text-base leading-loose whitespace-pre-wrap">
              {segments.map((segment, i) =>
                segment.kind === 'text' ? (
                  <span key={i}>{segment.text}</span>
                ) : (
                  <button
                    key={i}
                    type="button"
                    onClick={() =>
                      setSelected((current) =>
                        current?.id === segment.correction.id ? null : segment.correction,
                      )
                    }
                    className={cn(
                      'rounded px-0.5 underline decoration-2 underline-offset-4 transition',
                      ERROR_TONE[segment.correction.errorType].underline,
                      selected?.id === segment.correction.id
                        ? 'bg-white/15 text-fg'
                        : 'hover:bg-white/10',
                    )}
                  >
                    {segment.text}
                  </button>
                ),
              )}
            </p>
          ) : (
            <p className="text-base leading-loose whitespace-pre-wrap text-fg">{correctedText}</p>
          )}
        </Card>

        {/* Detail for the tapped correction */}
        {selected && view === 'yours' && (
          <Card className="mt-3 border-violet/30">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
                  ERROR_TONE[selected.errorType].chip,
                )}
              >
                {ERROR_TYPE_LABEL[language][selected.errorType]}
              </span>
              <Badge>{SEVERITY_LABEL[language][selected.severity]}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-sm">
              <span className="rounded bg-bad/15 px-2 py-1 text-bad line-through">
                {selected.original}
              </span>
              <span className="text-fg-faint">&rarr;</span>
              <span className="rounded bg-good/15 px-2 py-1 text-good">{selected.corrected}</span>
            </div>
            <p className="mt-3 leading-relaxed text-fg-muted">{selected.explanation}</p>
          </Card>
        )}
      </section>

      {/* All corrections */}
      {errorCount > 0 && (
        <section>
          <SectionHeading title="Every correction" />
          <div className="space-y-2">
            {[...session.corrections]
              .sort((a, b) => a.charStart - b.charStart)
              .map((correction) => (
                <Card key={correction.id} className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
                        ERROR_TONE[correction.errorType].chip,
                      )}
                    >
                      {ERROR_TYPE_LABEL[language][correction.errorType]}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-sm">
                    <span className="text-bad line-through">{correction.original}</span>
                    <span className="text-fg-faint">&rarr;</span>
                    <span className="text-good">{correction.corrected}</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-fg-faint">
                    {correction.explanation}
                  </p>
                </Card>
              ))}
          </div>
        </section>
      )}

      {/* Strengths and focus */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <h3 className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="size-4 text-good" />
            What went well
          </h3>
          <ul className="mt-3 space-y-2">
            {session.strengths.map((s) => (
              <li key={s} className="flex gap-2 text-sm leading-relaxed text-fg-muted">
                <Check className="mt-0.5 size-4 shrink-0 text-good" />
                {s}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h3 className="flex items-center gap-2 font-semibold">
            <TrendingUp className="size-4 text-violet-soft" />
            Work on this next
          </h3>
          {session.nextFocus.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {session.nextFocus.map((f) => (
                <li key={f} className="text-sm leading-relaxed text-fg-muted">
                  {f}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-fg-muted">
              Nothing specific this time. Try a harder topic to find your next weak spot.
            </p>
          )}
        </Card>
      </div>

      {/* Generated lessons */}
      {sessionLessons.length > 0 && (
        <section>
          <SectionHeading
            title="Lessons made from your mistakes"
            subtitle="Short, targeted, and based on what you actually wrote."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {sessionLessons.map((lesson) => (
              <Link key={lesson.id} to={`/lessons/${lesson.id}`} className="block">
                <Card className="h-full transition hover:bg-white/10">
                  <span className="grid size-9 place-items-center rounded-xl bg-violet/10 text-violet-soft">
                    <GraduationCap className="size-4" />
                  </span>
                  <p className="mt-3 font-medium text-fg">{lesson.title}</p>
                  <p className="mt-1 text-sm text-fg-faint">
                    {ERROR_TYPE_LABEL[language][lesson.errorType]} &middot; {lesson.exercises.length} questions
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Vocabulary suggestions */}
      {(suggestions ?? []).length > 0 && (
        <section>
          <SectionHeading
            title="Words worth learning"
            subtitle="Useful words you did not use. Save any you like."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {(suggestions ?? []).map((suggestion) => {
              const saved = savedWords.has(suggestion.word)
              return (
                <Card key={suggestion.word} className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-fg">
                      {suggestion.word}
                      {suggestion.phonetic && (
                        <span className="ml-2 font-mono text-xs font-normal text-fg-faint">
                          {suggestion.phonetic}
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-fg-muted">{suggestion.definition}</p>
                    <p className="mt-1 text-sm text-fg-faint italic">{suggestion.example}</p>
                  </div>
                  <Button
                    variant={saved ? 'ghost' : 'outline'}
                    onClick={() => saveWord(suggestion)}
                    disabled={saved}
                    title={saved ? 'Saved to your notebook' : 'Save to your notebook'}
                    className="shrink-0 px-3"
                  >
                    {saved ? <Check className="size-4 text-good" /> : <BookmarkPlus className="size-4" />}
                  </Button>
                </Card>
              )
            })}
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-3 pt-2">
        <Link to={session.kind === 'writing' ? '/write' : '/speak'}>
          <Button>
            <RotateCcw className="size-4" />
            Practise again
          </Button>
        </Link>
        <Link to="/lessons">
          <Button variant="outline">
            <Sparkles className="size-4" />
            Study my weak areas
          </Button>
        </Link>
      </div>
    </div>
  )
}
