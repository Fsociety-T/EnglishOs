import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookmarkPlus, Check, ExternalLink, Plus, Trash2 } from 'lucide-react'
import { Badge, Button, Card, EmptyState, SectionHeading, Spinner, Tabs } from '@/components/ui'
import { useLanguage, useT } from '@/i18n'
import { useAsync } from '@/hooks/useAsync'
import TranscriptPanel, { bareWord } from '@/components/TranscriptPanel'
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer'
import { formatTimestamp, parseMediaUrl } from '@/lib/media'
import { parseTranscript, transcriptIndexAt } from '@/lib/transcript'
import { newId } from '@/lib/utils'
import { useRepo } from '@/services/db'
import type { StringKey } from '@/i18n/strings'
import type { PodcastStatus } from '@/types'

const STATUS_TABS: { id: PodcastStatus; labelKey: StringKey }[] = [
  { id: 'to-watch', labelKey: 'pod.toWatch' },
  { id: 'watching', labelKey: 'pod.watching' },
  { id: 'done', labelKey: 'pod.done' },
]

export default function PodcastDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const repo = useRepo()
  const { language } = useLanguage()
  const t = useT()

  const [noteText, setNoteText] = useState('')
  const [stampMinutes, setStampMinutes] = useState('')
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set())
  const [transcriptDraft, setTranscriptDraft] = useState('')
  const [pasting, setPasting] = useState(false)
  const [follow, setFollow] = useState(true)
  const [savedLineWords, setSavedLineWords] = useState<Set<string>>(new Set())

  const { data: podcast, loading, reload } = useAsync(
    () => (id ? repo.getPodcast(id) : Promise.resolve(null)),
    [id],
  )
  const { data: notes, reload: reloadNotes } = useAsync(
    () => (id ? repo.listNotes(id) : Promise.resolve([])),
    [id],
  )

  // Parsed before the early returns because the player is a hook. An empty
  // string simply yields the "no embed" shape, so this is safe while loading.
  const media = parseMediaUrl(podcast?.url ?? '')
  const isYouTube = media.platform === 'youtube' && Boolean(media.embedId)
  // Only YouTube can say where it has reached, which is what lets the
  // transcript follow along. Anything else still shows the words, unlit.
  const player = useYouTubePlayer(isYouTube ? media.embedId : null)
  const transcript = podcast?.transcript ?? []
  const activeLine = transcriptIndexAt(transcript, player.currentTime)

  if (loading) return <Spinner label={t('common.loading')} />

  if (!podcast) {
    return (
      <Card>
        <p className="text-fg-muted">{t('pod.notFound')}</p>
        <div className="mt-4">
          <Link to="/podcasts">
            <Button variant="outline">{t('pod.backToShelf')}</Button>
          </Link>
        </div>
      </Card>
    )
  }

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
      id: newId(),
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
      id: newId(),
      language,
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

  async function saveTranscript() {
    if (!podcast) return
    const parsed = parseTranscript(transcriptDraft)
    if (parsed.length === 0) return
    await repo.updatePodcast(podcast.id, { transcript: parsed })
    setTranscriptDraft('')
    setPasting(false)
    reload()
  }

  /** A word tapped in the transcript, filed with the line it came from. */
  async function saveWordFromTranscript(token: string, line: string) {
    const word = bareWord(token)
    if (!word || savedLineWords.has(word.toLowerCase()) || !podcast) return
    await repo.addWord({
      id: newId(),
      language,
      word,
      definition: '',
      example: line,
      tags: ['podcast'],
      source: 'podcast',
      sourceId: podcast.id,
      srsBox: 1,
      nextReviewAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    })
    await repo.recordActivity({ wordsLearned: 1 })
    setSavedLineWords((prev) => new Set(prev).add(word.toLowerCase()))
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
        {t('pod.backToShelf')}
      </button>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">{podcast.title}</h1>
        <a
          href={podcast.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-fg-muted transition hover:text-fg"
        >
          {t('pod.openOriginal')}
          <ExternalLink className="size-3.5" />
        </a>
      </header>

      <div className="max-w-sm">
        <Tabs
          tabs={STATUS_TABS.map(({ id, labelKey }) => ({ id, label: t(labelKey) }))}
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
          {isYouTube ? (
            <div className="overflow-hidden rounded-glass border border-white/10">
              <div className="aspect-video w-full">
                <div ref={player.containerRef} className="size-full" />
              </div>
            </div>
          ) : media.embedUrl ? (
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
                {t('pod.noEmbed')}
              </p>
              <div className="mt-4">
                <a href={podcast.url} target="_blank" rel="noreferrer">
                  <Button variant="outline">
                    {t('pod.openNewTab')}
                    <ExternalLink className="size-4" />
                  </Button>
                </a>
              </div>
            </Card>
          )}

          <section className="mt-5 space-y-3">
            <SectionHeading title={t('pod.transcriptTitle')} />
            {transcript.length === 0 || pasting ? (
              <Card>
                {transcript.length === 0 && (
                  <>
                    <p className="font-medium text-fg">{t('pod.noTranscriptTitle')}</p>
                    <p className="mt-1 text-sm leading-relaxed text-fg-muted">
                      {t('pod.noTranscriptBody')}
                    </p>
                  </>
                )}
                <p className="mt-3 text-sm leading-relaxed text-fg-faint">
                  {t('pod.whereToGet')}
                </p>
                <textarea
                  value={transcriptDraft}
                  onChange={(e) => setTranscriptDraft(e.target.value)}
                  placeholder={t('pod.pastePlaceholder')}
                  className="mt-3 min-h-40 w-full resize-y rounded-xl border border-white/10 bg-white/5 p-3 text-sm leading-relaxed text-fg outline-none placeholder:text-fg-faint focus:border-violet/50"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button onClick={saveTranscript} disabled={!transcriptDraft.trim()}>
                    {t('pod.saveTranscript')}
                  </Button>
                  {transcript.length > 0 && (
                    <Button variant="ghost" onClick={() => setPasting(false)}>
                      {t('common.cancel')}
                    </Button>
                  )}
                </div>
              </Card>
            ) : (
              <>
                {!transcript.some((line) => line.startSeconds !== null) && (
                  <p className="rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn">
                    {t('pod.transcriptNoTimes')}
                  </p>
                )}
                <TranscriptPanel
                  lines={transcript}
                  activeIndex={activeLine}
                  follow={follow}
                  onFollowChange={setFollow}
                  onJump={isYouTube ? player.seekTo : undefined}
                  onSaveWord={saveWordFromTranscript}
                  savedWords={savedLineWords}
                  onReplace={() => {
                    setTranscriptDraft(transcript.map((line) => line.text).join('\n'))
                    setPasting(true)
                  }}
                />
              </>
            )}
          </section>
        </div>

        {/* Notes */}
        <div className="space-y-4">
          <SectionHeading
            title={t('pod.notes')}
            subtitle={t('pod.notesSub')}
          />

          <Card>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={t('pod.notePlaceholder')}
              className="min-h-24 w-full resize-y bg-transparent text-sm leading-relaxed text-fg outline-none placeholder:text-fg-faint"
            />
            <div className="mt-3 flex gap-2">
              <input
                value={stampMinutes}
                onChange={(e) => setStampMinutes(e.target.value)}
                placeholder="12:30"
                title={t('pod.timestampTitle')}
                className={`${inputClass} w-24 shrink-0 text-center`}
              />
              <Button onClick={addNote} disabled={!noteText.trim()} className="flex-1">
                <Plus className="size-4" />
                {t('pod.addNote')}
              </Button>
            </div>
          </Card>

          {(notes ?? []).length === 0 ? (
            <EmptyState
              title={t('pod.noNotesTitle')}
              body={t('pod.noNotesBody')}
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
                        aria-label={t('pod.saveAsWord')}
                        title={t('pod.saveToNotebook')}
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
                        aria-label={t('pod.deleteNote')}
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
