import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BookmarkPlus,
  Check,
  ExternalLink,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { Badge, Button, Card, EmptyState, SectionHeading, Spinner, Tabs } from '@/components/ui'
import { useLanguage, useT } from '@/i18n'
import { useAsync } from '@/hooks/useAsync'
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer'
import { formatTimestamp, parseMediaUrl } from '@/lib/media'
import { newId } from '@/lib/utils'
import { ai } from '@/services/ai'
import type { PhraseExplanation } from '@/services/ai/types'
import { useRepo } from '@/services/db'
import type { StringKey } from '@/i18n/strings'
import type { PodcastStatus } from '@/types'

/** Watched this far counts as watched. Credits and outros are not the lesson. */
const FINISHED_PERCENT = 90

/** How often the position is written back while playing. */
const SAVE_EVERY_SECONDS = 15

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
  const [savedLineWords, setSavedLineWords] = useState<Set<string>>(new Set())
  const [phrase, setPhrase] = useState('')
  const [explaining, setExplaining] = useState(false)
  const [explanation, setExplanation] = useState<PhraseExplanation | null>(null)
  const [explainError, setExplainError] = useState<string | null>(null)
  const [finishHint, setFinishHint] = useState(false)

  const { data: podcast, loading, reload } = useAsync(
    () => (id ? repo.getPodcast(id) : Promise.resolve(null)),
    [id],
  )
  const { data: notes, reload: reloadNotes } = useAsync(
    () => (id ? repo.listNotes(id) : Promise.resolve([])),
    [id],
  )

  // Parsed before the early returns because the player is a hook. An empty
  // string yields the "no embed" shape, which is safe while loading.
  const media = parseMediaUrl(podcast?.url ?? '')
  const isYouTube = media.platform === 'youtube' && Boolean(media.embedId)
  const player = useYouTubePlayer(isYouTube ? media.embedId : null)
  const savedAtRef = useRef(0)
  const resumedRef = useRef(false)

  const watchedSeconds = Math.max(podcast?.progressSeconds ?? 0, player.currentTime)
  const watchedPercent =
    player.duration > 0 ? Math.min(100, Math.round((watchedSeconds / player.duration) * 100)) : null
  /** Near enough the end: nobody sits through the outro, and they should not have to. */
  const finished = watchedPercent !== null && watchedPercent >= FINISHED_PERCENT

  // Pick up where they stopped, once, rather than starting the hour again.
  useEffect(() => {
    if (!player.ready || resumedRef.current || !podcast) return
    resumedRef.current = true
    const at = podcast.progressSeconds
    if (at > 10 && (player.duration === 0 || at < player.duration * 0.95)) player.seekTo(at)
  }, [player, podcast])

  // Remember the position, but not on every tick - that would be a write to
  // the database ten times a second.
  useEffect(() => {
    if (!podcast || !player.playing) return
    const at = Math.floor(player.currentTime)
    if (at - savedAtRef.current < SAVE_EVERY_SECONDS) return
    savedAtRef.current = at
    void repo.updatePodcast(podcast.id, { progressSeconds: at })
  }, [player.currentTime, player.playing, podcast, repo])

  // The status now follows what actually happened, instead of waiting to be
  // clicked: playing it starts it, reaching the end finishes it.
  useEffect(() => {
    if (!podcast || !isYouTube) return
    if (finished && podcast.status !== 'done') {
      void repo
        .updatePodcast(podcast.id, {
          status: 'done',
          progressSeconds: Math.floor(watchedSeconds),
        })
        .then(reload)
    } else if (player.playing && podcast.status === 'to-watch') {
      void repo.updatePodcast(podcast.id, { status: 'watching' }).then(reload)
    }
  }, [finished, player.playing, podcast, isYouTube, repo, reload, watchedSeconds])

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

  /** The point of this box: it works on a video with no captions at all. */
  async function askAi() {
    const asked = phrase.trim()
    if (!asked || explaining || !podcast) return
    setExplaining(true)
    setExplainError(null)
    setExplanation(null)
    try {
      const profile = await repo.getProfile()
      const result = await ai.explainPhrase({
        phrase: asked,
        language: profile.language,
        level: profile.level,
      })
      if (!result.meaning) setExplainError(t('pod.explainOffline'))
      else setExplanation(result)
    } catch (err) {
      setExplainError(err instanceof Error ? err.message : t('pod.explainFailed'))
    } finally {
      setExplaining(false)
    }
  }

  /** Save a word the explanation offered, definition and all. */
  async function saveSuggested(word: string, definition: string) {
    if (savedLineWords.has(word.toLowerCase()) || !podcast) return
    await repo.addWord({
      id: newId(),
      language,
      word,
      definition,
      example: phrase.trim(),
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

  // No width here. `cn` is a plain join, so a `w-24` at the call site does not
  // override a `w-full` baked in - both land, stylesheet order decides, and
  // that is exactly how Add note ended up spilling out of its own card.
  const inputClass =
    'rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-fg outline-none placeholder:text-fg-faint focus:border-violet/50'

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

      <div className="max-w-sm space-y-2">
        <Tabs
          tabs={STATUS_TABS.map(({ id, labelKey }) => ({ id, label: t(labelKey) }))}
          active={podcast.status}
          onChange={async (status) => {
            // Done has to be earned on a video we can actually measure.
            // Anything we cannot track stays a free choice, or it could never
            // be finished at all.
            if (status === 'done' && isYouTube && !finished) {
              setFinishHint(true)
              return
            }
            setFinishHint(false)
            await repo.updatePodcast(podcast.id, { status })
            reload()
          }}
        />
        {isYouTube && watchedPercent !== null && (
          <div>
            <div className="h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-neon transition-[width] duration-500"
                style={{ width: `${watchedPercent}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-fg-faint">
              {t('pod.watched', { percent: watchedPercent })}
            </p>
          </div>
        )}
        {finishHint && (
          <p className="rounded-xl border border-warn/30 bg-warn/10 px-3 py-2 text-xs leading-relaxed text-warn">
            {t('pod.finishFirst', { percent: watchedPercent ?? 0 })}
          </p>
        )}
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

        </div>

        {/* Ask, and notes */}
        <div className="space-y-4">
          <Card className="border-violet/30">
            <SectionHeading
              title={t('pod.askTitle')}
              subtitle={t('pod.askSub')}
            />
            <textarea
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              placeholder={t('pod.askPlaceholder')}
              className="min-h-20 w-full resize-y rounded-xl border border-white/10 bg-white/5 p-3 text-sm leading-relaxed text-fg outline-none placeholder:text-fg-faint focus:border-violet/50"
            />
            <div className="mt-3">
              <Button onClick={askAi} disabled={!phrase.trim() || explaining}>
                {explaining ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {t('pod.asking')}
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    {t('pod.ask')}
                  </>
                )}
              </Button>
            </div>

            {explainError && (
              <p className="mt-3 rounded-xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn">
                {explainError}
              </p>
            )}

            {explanation && (
              <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                <p className="leading-relaxed text-fg">{explanation.meaning}</p>
                {explanation.notes.length > 0 && (
                  <ul className="space-y-1.5">
                    {explanation.notes.map((note) => (
                      <li key={note} className="flex gap-2 text-sm leading-relaxed text-fg-muted">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-violet" />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {explanation.words.length > 0 && (
                  <div className="space-y-2">
                    {explanation.words.map((item) => (
                      <div
                        key={item.word}
                        className="flex items-start justify-between gap-3 rounded-xl bg-white/5 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-fg">{item.word}</p>
                          <p className="text-sm leading-relaxed text-fg-faint">{item.definition}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => saveSuggested(item.word, item.definition)}
                          disabled={savedLineWords.has(item.word.toLowerCase())}
                          aria-label={t('pod.saveThisWord')}
                          className="shrink-0 rounded-lg p-1.5 text-fg-faint transition hover:bg-violet/15 hover:text-violet-soft disabled:opacity-40"
                        >
                          {savedLineWords.has(item.word.toLowerCase()) ? (
                            <Check className="size-4 text-good" />
                          ) : (
                            <BookmarkPlus className="size-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>

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
