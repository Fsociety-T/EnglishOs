import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookmarkPlus, Check, ExternalLink, Plus, Trash2 } from 'lucide-react'
import { Badge, Button, Card, EmptyState, SectionHeading, Spinner, Tabs } from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'
import { formatTimestamp, parseMediaUrl } from '@/lib/media'
import { newId } from '@/lib/utils'
import { useRepo } from '@/services/db'
import type { PodcastStatus } from '@/types'

const STATUS_TABS: { id: PodcastStatus; label: string }[] = [
  { id: 'to-watch', label: 'To watch' },
  { id: 'watching', label: 'Watching' },
  { id: 'done', label: 'Done' },
]

export default function PodcastDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const repo = useRepo()

  const [noteText, setNoteText] = useState('')
  const [stampMinutes, setStampMinutes] = useState('')
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set())

  const { data: podcast, loading, reload } = useAsync(
    () => (id ? repo.getPodcast(id) : Promise.resolve(null)),
    [id],
  )
  const { data: notes, reload: reloadNotes } = useAsync(
    () => (id ? repo.listNotes(id) : Promise.resolve([])),
    [id],
  )

  if (loading) return <Spinner label="Loading..." />

  if (!podcast) {
    return (
      <Card>
        <p className="text-fg-muted">That podcast could not be found.</p>
        <div className="mt-4">
          <Link to="/podcasts">
            <Button variant="outline">Back to shelf</Button>
          </Link>
        </div>
      </Card>
    )
  }

  const media = parseMediaUrl(podcast.url)

  /** "12" means 12 minutes in; "12:30" means twelve and a half. */
  function parseStamp(raw: string): number | null {
    const trimmed = raw.trim()
    if (!trimmed) return null
    const parts = trimmed.split(':').map((p) => Number(p))
    if (parts.some((p) => Number.isNaN(p))) return null
    if (parts.length === 1) return parts[0] * 60
    if (parts.length === 2) return parts[0] * 60 + parts[1]
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
    return null
  }

  async function addNote() {
    const text = noteText.trim()
    if (!text || !podcast) return
    await repo.addNote({
      id: newId('note'),
      podcastId: podcast.id,
      timestampSeconds: parseStamp(stampMinutes),
      note: text,
      createdAt: new Date().toISOString(),
    })
    // Writing a note means you are actually watching it.
    if (podcast.status === 'to-watch') {
      await repo.updatePodcast(podcast.id, { status: 'watching' })
      reload()
    }
    setNoteText('')
    setStampMinutes('')
    reloadNotes()
  }

  /** Pull the interesting word out of a note and file it in the notebook. */
  async function saveWordFromNote(noteId: string, note: string) {
    if (savedWords.has(noteId) || !podcast) return
    const firstLine = note.split(/[.\n]/)[0].trim()
    const word = firstLine.split(/\s+/).slice(0, 3).join(' ')
    await repo.addWord({
      id: newId('voc'),
      word,
      definition: note,
      example: '',
      tags: ['podcast'],
      source: 'podcast',
      sourceId: podcast.id,
      srsBox: 1,
      nextReviewAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    })
    await repo.recordActivity({ wordsLearned: 1 })
    setSavedWords((prev) => new Set(prev).add(noteId))
  }

  const inputClass =
    'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-fg outline-none placeholder:text-fg-faint focus:border-violet/50'

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-fg-muted transition hover:text-fg"
      >
        <ArrowLeft className="size-4" />
        Back to shelf
      </button>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">{podcast.title}</h1>
        <a
          href={podcast.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-fg-muted transition hover:text-fg"
        >
          Open original
          <ExternalLink className="size-3.5" />
        </a>
      </header>

      <div className="max-w-sm">
        <Tabs
          tabs={STATUS_TABS}
          active={podcast.status}
          onChange={async (status) => {
            await repo.updatePodcast(podcast.id, { status })
            reload()
          }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        {/* Player */}
        <div>
          {media.embedUrl ? (
            <div className="overflow-hidden rounded-glass border border-white/10">
              <iframe
                src={media.embedUrl}
                title={podcast.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
                className={
                  media.platform === 'spotify' ? 'h-40 w-full' : 'aspect-video w-full'
                }
              />
            </div>
          ) : (
            <Card>
              <p className="text-sm leading-relaxed text-fg-muted">
                This link cannot be embedded here. Open it in a new tab and keep this page beside
                it to take notes.
              </p>
              <div className="mt-4">
                <a href={podcast.url} target="_blank" rel="noreferrer">
                  <Button variant="outline">
                    Open in a new tab
                    <ExternalLink className="size-4" />
                  </Button>
                </a>
              </div>
            </Card>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-4">
          <SectionHeading
            title="Notes"
            subtitle="Write down anything you want to remember."
          />

          <Card>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="A word, a phrase, or an idea you liked..."
              className="min-h-24 w-full resize-y bg-transparent text-sm leading-relaxed text-fg outline-none placeholder:text-fg-faint"
            />
            <div className="mt-3 flex gap-2">
              <input
                value={stampMinutes}
                onChange={(e) => setStampMinutes(e.target.value)}
                placeholder="12:30"
                title="Where in the episode? Optional."
                className={`${inputClass} w-24 shrink-0 text-center`}
              />
              <Button onClick={addNote} disabled={!noteText.trim()} className="flex-1">
                <Plus className="size-4" />
                Add note
              </Button>
            </div>
          </Card>

          {(notes ?? []).length === 0 ? (
            <EmptyState
              title="No notes yet"
              body="Your notes will appear here, ordered by where they happen in the episode."
            />
          ) : (
            <div className="space-y-2">
              {(notes ?? []).map((note) => (
                <Card key={note.id} className="group p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {note.timestampSeconds !== null && (
                        <Badge tone="violet" className="mb-2">
                          {formatTimestamp(note.timestampSeconds)}
                        </Badge>
                      )}
                      <p className="text-sm leading-relaxed text-fg">{note.note}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        aria-label="Save as a word"
                        title="Save to my word notebook"
                        onClick={() => saveWordFromNote(note.id, note.note)}
                        disabled={savedWords.has(note.id)}
                        className="rounded-lg p-1.5 text-fg-faint transition hover:bg-violet/15 hover:text-violet-soft disabled:opacity-40"
                      >
                        {savedWords.has(note.id) ? (
                          <Check className="size-4 text-good" />
                        ) : (
                          <BookmarkPlus className="size-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        aria-label="Delete note"
                        onClick={async () => {
                          await repo.deleteNote(note.id)
                          reloadNotes()
                        }}
                        className="rounded-lg p-1.5 text-fg-faint opacity-0 transition hover:bg-bad/15 hover:text-bad group-hover:opacity-100 focus-visible:opacity-100"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
