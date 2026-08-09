import { useMemo, useState } from 'react'
import { BookMarked, Check, Layers, Plus, Trash2, X } from 'lucide-react'
import { Badge, Button, Card, EmptyState, SectionHeading, Spinner, Tabs } from '@/components/ui'
import { useLanguage } from '@/i18n'
import { useVocabulary } from '@/hooks/useContent'
import { describeInterval, dueWords, isMastered, nextBox, nextReviewDate } from '@/lib/srs'
import type { ReviewGrade } from '@/lib/srs'
import { cn, newId } from '@/lib/utils'
import { useRepo } from '@/services/db'
import type { VocabWord } from '@/types'

type Tab = 'all' | 'due' | 'mastered'

function AddWordForm({ onAdded }: { onAdded: () => void }) {
  const repo = useRepo()
  const { language } = useLanguage()
  const [open, setOpen] = useState(false)
  const [word, setWord] = useState('')
  const [definition, setDefinition] = useState('')
  const [example, setExample] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!word.trim() || !definition.trim() || saving) return
    setSaving(true)
    await repo.addWord({
      id: newId(),
      language,
      word: word.trim(),
      definition: definition.trim(),
      example: example.trim(),
      tags: [],
      source: 'manual',
      srsBox: 1,
      nextReviewAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    })
    await repo.recordActivity({ wordsLearned: 1 })
    setWord('')
    setDefinition('')
    setExample('')
    setSaving(false)
    setOpen(false)
    onAdded()
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Add a word
      </Button>
    )
  }

  const inputClass =
    'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-fg outline-none placeholder:text-fg-faint focus:border-violet/50'

  return (
    <Card className="w-full">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">New word</h3>
        <button
          type="button"
          aria-label="Cancel"
          onClick={() => setOpen(false)}
          className="rounded-lg p-1 text-fg-muted hover:bg-white/5 hover:text-fg"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="mt-4 space-y-2">
        <input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="Word or phrase"
          className={inputClass}
        />
        <input
          value={definition}
          onChange={(e) => setDefinition(e.target.value)}
          placeholder="What does it mean?"
          className={inputClass}
        />
        <input
          value={example}
          onChange={(e) => setExample(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          placeholder="A sentence using it (optional)"
          className={inputClass}
        />
      </div>
      <div className="mt-4">
        <Button onClick={save} disabled={!word.trim() || !definition.trim() || saving}>
          Save word
        </Button>
      </div>
    </Card>
  )
}

function Flashcards({ words, onDone }: { words: VocabWord[]; onDone: () => void }) {
  const repo = useRepo()
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [correct, setCorrect] = useState(0)

  const card = words[index]
  const finished = index >= words.length

  async function grade(g: ReviewGrade) {
    if (!card) return
    const box = nextBox(card.srsBox, g)
    await repo.reviewWord(card.id, box, nextReviewDate(box))
    if (g !== 'again') setCorrect((c) => c + 1)
    setFlipped(false)
    setIndex((i) => i + 1)
  }

  if (finished) {
    return (
      <Card className="text-center">
        <p className="text-4xl font-bold text-gradient">
          {correct}/{words.length}
        </p>
        <p className="mt-3 leading-relaxed text-fg-muted">
          Review finished. The words you found hard will come back tomorrow; the rest are
          scheduled further out.
        </p>
        <div className="mt-5">
          <Button onClick={onDone}>Back to my words</Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between text-sm text-fg-faint">
        <span>
          Card {index + 1} of {words.length}
        </span>
        <button type="button" onClick={onDone} className="transition hover:text-fg">
          Stop review
        </button>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-neon transition-[width] duration-300"
          style={{ width: `${(index / words.length) * 100}%` }}
        />
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="rounded-glass glass flex min-h-64 w-full flex-col items-center justify-center gap-3 p-8 text-center transition hover:bg-white/10"
      >
        {!flipped ? (
          <>
            <p className="text-3xl font-bold text-fg">{card.word}</p>
            {card.phonetic && <p className="font-mono text-sm text-fg-faint">{card.phonetic}</p>}
            <p className="mt-4 text-sm text-fg-faint">Tap to see the meaning</p>
          </>
        ) : (
          <>
            <p className="text-xl font-semibold text-gradient">{card.word}</p>
            {card.partOfSpeech && <Badge>{card.partOfSpeech}</Badge>}
            <p className="mt-2 leading-relaxed text-fg">{card.definition}</p>
            {card.example && (
              <p className="mt-2 text-sm leading-relaxed text-fg-faint italic">
                &ldquo;{card.example}&rdquo;
              </p>
            )}
          </>
        )}
      </button>

      {flipped && (
        <div className="grid grid-cols-3 gap-2">
          <Button variant="danger" onClick={() => grade('again')}>
            Again
          </Button>
          <Button variant="outline" onClick={() => grade('good')}>
            Good
          </Button>
          <Button onClick={() => grade('easy')}>Easy</Button>
        </div>
      )}
      {flipped && (
        <p className="text-center text-xs text-fg-faint">
          &ldquo;Again&rdquo; brings it back tomorrow. &ldquo;Easy&rdquo; pushes it{' '}
          {describeInterval(nextBox(card.srsBox, 'easy'))}.
        </p>
      )}
    </div>
  )
}

export default function Vocabulary() {
  const repo = useRepo()
  const [tab, setTab] = useState<Tab>('all')
  const [reviewing, setReviewing] = useState(false)

  const { data: words, loading, reload } = useVocabulary()
  const all = useMemo(() => words ?? [], [words])
  const due = useMemo(() => dueWords(all), [all])
  const mastered = useMemo(() => all.filter(isMastered), [all])

  if (loading) return <Spinner label="Loading your words..." />

  if (reviewing && due.length > 0) {
    return (
      <Flashcards
        words={due}
        onDone={() => {
          setReviewing(false)
          reload()
        }}
      />
    )
  }

  const visible = tab === 'due' ? due : tab === 'mastered' ? mastered : all

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Your word notebook</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Words you liked, reviewed at increasing intervals so they actually stay in memory.
          </p>
        </div>
        <AddWordForm onAdded={reload} />
      </header>

      {due.length > 0 && (
        <Card className="flex flex-wrap items-center justify-between gap-4 border-violet/30">
          <div>
            <p className="font-semibold text-fg">
              {due.length} {due.length === 1 ? 'word is' : 'words are'} ready to review
            </p>
            <p className="mt-0.5 text-sm text-fg-faint">
              A couple of minutes now is worth an hour of re-reading later.
            </p>
          </div>
          <Button onClick={() => setReviewing(true)}>
            <Layers className="size-4" />
            Start review
          </Button>
        </Card>
      )}

      {all.length === 0 ? (
        <EmptyState
          icon={<BookMarked className="size-6" />}
          title="No words saved yet"
          body="Add a word above, or save one from a practice session or a podcast note. Every word you save gets scheduled for review automatically."
        />
      ) : (
        <section>
          <Tabs
            tabs={[
              { id: 'all', label: 'All', count: all.length },
              { id: 'due', label: 'Due now', count: due.length },
              { id: 'mastered', label: 'Mastered', count: mastered.length },
            ]}
            active={tab}
            onChange={setTab}
          />

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((word) => (
              <Card key={word.id} className="group h-full">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-fg">{word.word}</p>
                    {word.phonetic && (
                      <p className="font-mono text-xs text-fg-faint">{word.phonetic}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label={`Delete ${word.word}`}
                    onClick={async () => {
                      await repo.deleteWord(word.id)
                      reload()
                    }}
                    className="rounded-lg p-1.5 text-fg-faint opacity-0 transition hover:bg-bad/15 hover:text-bad group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{word.definition}</p>
                {word.example && (
                  <p className="mt-1.5 text-sm leading-relaxed text-fg-faint italic">
                    &ldquo;{word.example}&rdquo;
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {isMastered(word) ? (
                    <Badge tone="good">
                      <Check className="size-3" />
                      Mastered
                    </Badge>
                  ) : (
                    <Badge tone="violet">Box {word.srsBox} of 5</Badge>
                  )}
                  {word.source !== 'manual' && <Badge>from {word.source}</Badge>}
                </div>
              </Card>
            ))}
          </div>

          {visible.length === 0 && (
            <p className="mt-6 text-center text-sm text-fg-faint">
              {tab === 'due'
                ? 'Nothing due right now. Come back tomorrow.'
                : 'Nothing here yet.'}
            </p>
          )}
        </section>
      )}
    </div>
  )
}
